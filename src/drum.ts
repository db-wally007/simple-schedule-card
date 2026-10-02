/**
 * The time drum: one column of an iOS-style picker, driven by hand.
 *
 * It used to be a native scroll-snap column, and that failed twice. On a touch
 * screen the edit sheet's own drag handling (the rubber band that stops the page
 * behind it scrolling) measured the SHEET, found it had nowhere to go, and
 * cancelled the touch - so a drag on the drum moved the sheet instead of the
 * numbers. And where it did scroll, it slid linearly and stopped dead: no coast,
 * no ease, no cylinder.
 *
 * So the drum owns its gesture outright: `touch-action: none`, pointer capture,
 * and the sheet ignores any touch that starts on it. Motion comes from
 * src/data/drum.ts - a flick coasts and decelerates exponentially into a row, a
 * drag past either end rubber-bands, a tap glides to the row drawn under the
 * finger, and every row is drawn on a cylinder. The state is one number, the
 * column's `offset`, written straight to the rows' transforms each frame and never
 * through Lit: re-rendering the card sixty times a second to move some digits is
 * not a trade worth making.
 *
 * Values leave through ONE door, `onSettle`, called once the drum is at rest on a
 * row - however it got there.
 */

import {
  clampIndex,
  cylinder,
  decay,
  type DrumSample,
  GLIDE_TIME_MS,
  KINETIC_TIME_MS,
  rowAt,
  rubber,
  throwTarget,
  velocityFrom,
} from './data/drum';

export interface DrumOptions {
  rowH: number;
  /** Cylinder radius: half the drum's height, so the rim is the drum's edge. */
  radius: number;
  /** Last row index. */
  max: number;
  /** The card's resolved reduced-motion: moves land at once instead of animating. */
  reduced: () => boolean;
  /** The row the drum came to rest on. */
  onSettle: (index: number) => void;
}

/** Movement under this is a tap, not a drag - a finger is never perfectly still. */
const TAP_SLOP_PX = 6;
const TAP_MAX_MS = 400;
/** Close enough to the row to call it there and stop animating. */
const SETTLED_PX = 0.4;
/** A wheel delta this big is a mouse notch; smaller ones are a trackpad's stream. */
const WHEEL_NOTCH_PX = 50;
/** How long a trackpad stream has to pause before the drum settles onto a row. */
const TRACKPAD_SETTLE_MS = 120;
/** Released past an end: the bounce back, a little softer than a glide. */
const BOUNCE_TIME_MS = 140;
/** Under this release speed (px/ms) a drag is a placement, not a flick. */
const FLICK_MIN = 0.25;

interface Drag {
  id: number;
  startY: number;
  startOffset: number;
  t0: number;
  samples: DrumSample[];
  moved: boolean;
  /** The drum was still moving when touched: the touch catches it, as on iOS. */
  caught: boolean;
}

interface Anim {
  from: number;
  to: number;
  index: number;
  start: number;
  tc: number;
}

export class Drum {
  private items: HTMLElement[];
  private offset: number;
  private shown = new Set<number>();
  private drag: Drag | null = null;
  private anim: Anim | null = null;
  private frame = 0;
  private wheelTimer = 0;

  constructor(
    private readonly col: HTMLElement,
    private readonly o: DrumOptions,
    index: number,
  ) {
    this.items = [...col.querySelectorAll<HTMLElement>('.wheel-item')];
    this.offset = clampIndex(index, o.max) * o.rowH;
    col.addEventListener('pointerdown', this.onDown);
    col.addEventListener('pointermove', this.onMove);
    col.addEventListener('pointerup', this.onUp);
    col.addEventListener('pointercancel', this.onUp);
    // Not passive: the wheel must be owned here, or the sheet and the page behind
    // it scroll along with the numbers.
    col.addEventListener('wheel', this.onWheel, { passive: false });
    col.addEventListener('keydown', this.onKey);
    this.paint();
  }

  /** Follow a value set from outside - unless the drum is busy with one of its own. */
  sync(index: number): void {
    if (this.drag || this.anim) return;
    const to = clampIndex(index, this.o.max) * this.o.rowH;
    if (Math.abs(this.offset - to) < SETTLED_PX) return;
    this.offset = to;
    this.paint();
  }

  // --- drawing ----------------------------------------------------------------

  private paint(): void {
    const { rowH, radius, max } = this.o;
    // Rows further than a quarter turn are round the back of the cylinder.
    const reach = Math.ceil((radius * Math.PI) / 2 / rowH) + 1;
    const centre = this.offset / rowH;
    const lo = Math.max(0, Math.floor(centre) - reach);
    const hi = Math.min(this.items.length - 1, Math.ceil(centre) + reach);
    const now = new Set<number>();
    for (let i = lo; i <= hi; i++) {
      const pose = cylinder(i * rowH - this.offset, radius, rowH);
      if (!pose) continue;
      const el = this.items[i];
      el.style.transform =
        `translateY(${pose.y.toFixed(2)}px) ` +
        `scale(${pose.scaleX.toFixed(4)}, ${pose.scaleY.toFixed(4)})`;
      el.style.opacity = pose.opacity.toFixed(3);
      el.style.visibility = 'visible';
      now.add(i);
    }
    for (const i of this.shown) {
      if (!now.has(i)) this.items[i].style.visibility = 'hidden';
    }
    this.shown = now;
    const at = clampIndex(Math.round(centre), max);
    this.col.setAttribute('aria-valuenow', String(at));
    this.col.setAttribute('aria-valuetext', this.items[at]?.textContent?.trim() ?? '');
  }

  // --- motion -----------------------------------------------------------------

  private nearest(): number {
    return clampIndex(Math.round(this.offset / this.o.rowH), this.o.max);
  }

  /** Where the drum is heading: the target of a move in flight, else where it is. */
  private heading(): number {
    return this.anim ? this.anim.index : this.nearest();
  }

  private animate(index: number, tc: number): void {
    const to = index * this.o.rowH;
    cancelAnimationFrame(this.frame);
    if (this.o.reduced()) {
      this.anim = null;
      this.offset = to;
      this.paint();
      this.o.onSettle(index);
      return;
    }
    this.anim = { from: this.offset, to, index, start: performance.now(), tc };
    this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (now: number): void => {
    const a = this.anim;
    if (!a) return;
    // Closed mid-spin: the picker was removed under it.
    if (!this.col.isConnected) {
      this.anim = null;
      return;
    }
    const x = decay(a.from, a.to, Math.max(0, now - a.start), a.tc);
    if (Math.abs(x - a.to) < SETTLED_PX) {
      this.anim = null;
      this.offset = a.to;
      this.paint();
      this.o.onSettle(a.index);
      return;
    }
    this.offset = x;
    this.paint();
    this.frame = requestAnimationFrame(this.tick);
  };

  /** Stop wherever it is. Returns whether it was moving. */
  private stop(): boolean {
    const was = this.anim !== null;
    this.anim = null;
    cancelAnimationFrame(this.frame);
    window.clearTimeout(this.wheelTimer);
    return was;
  }

  private glideTo(index: number): void {
    this.animate(clampIndex(index, this.o.max), GLIDE_TIME_MS);
  }

  /** A raw offset, with the rubber band applied past either end. */
  private banded(raw: number): number {
    const end = this.o.max * this.o.rowH;
    const span = this.o.radius * 2;
    if (raw < 0) return rubber(raw, span);
    if (raw > end) return end + rubber(raw - end, span);
    return raw;
  }

  // --- input ------------------------------------------------------------------

  private onDown = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const caught = this.stop();
    this.drag = {
      id: e.pointerId,
      startY: e.clientY,
      startOffset: this.offset,
      t0: e.timeStamp,
      samples: [{ t: e.timeStamp, y: e.clientY }],
      moved: false,
      caught,
    };
    // Synthetic pointers (and some test harnesses) have no capturable id.
    try {
      this.col.setPointerCapture(e.pointerId);
    } catch {
      /* the drag still works while the pointer stays over the column */
    }
    this.col.classList.add('grabbing');
  };

  private onMove = (e: PointerEvent): void => {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    d.samples.push({ t: e.timeStamp, y: e.clientY });
    if (d.samples.length > 24) d.samples.splice(0, d.samples.length - 24);
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.abs(dy) < TAP_SLOP_PX) return;
    d.moved = true;
    // Finger down, numbers down: earlier rows come to the centre.
    this.offset = this.banded(d.startOffset - dy);
    this.paint();
  };

  private onUp = (e: PointerEvent): void => {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    this.drag = null;
    this.col.classList.remove('grabbing');
    try {
      this.col.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    const { rowH, radius, max } = this.o;

    if (!d.moved) {
      // A tap that caught a spinning drum only stops it - it does not also pick
      // whatever row happened to be under the finger.
      if (!d.caught && e.type === 'pointerup' && e.timeStamp - d.t0 <= TAP_MAX_MS) {
        const box = this.col.getBoundingClientRect();
        const y = e.clientY - (box.top + box.height / 2);
        this.glideTo(rowAt(y, this.offset, radius, rowH, max));
      } else {
        this.glideTo(this.nearest());
      }
      return;
    }

    const end = max * rowH;
    if (this.offset < 0 || this.offset > end) {
      this.animate(this.offset < 0 ? 0 : max, BOUNCE_TIME_MS);
      return;
    }
    // Pointer down the screen is the offset going DOWN, hence the minus.
    const v = -velocityFrom(d.samples, e.timeStamp);
    if (e.type === 'pointerup' && Math.abs(v) >= FLICK_MIN) {
      this.animate(throwTarget(this.offset, v, rowH, max), KINETIC_TIME_MS);
    } else {
      this.glideTo(this.nearest());
    }
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    if (this.drag) return;
    const notch = e.deltaMode !== 0 || Math.abs(e.deltaY) >= WHEEL_NOTCH_PX;
    if (notch) {
      // A mouse: one notch, one row - retargeted from wherever a move in flight is
      // heading, so a quick spin of the wheel adds up rather than restarting.
      const dir = Math.sign(e.deltaY);
      if (dir) this.glideTo(this.heading() + dir);
      return;
    }
    // A trackpad streams small deltas: follow them, then settle once they stop.
    this.stop();
    const end = this.o.max * this.o.rowH;
    this.offset = Math.min(end, Math.max(0, this.offset + e.deltaY));
    this.paint();
    this.wheelTimer = window.setTimeout(() => this.glideTo(this.nearest()), TRACKPAD_SETTLE_MS);
  };

  private onKey = (e: KeyboardEvent): void => {
    const step = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    e.stopPropagation();
    this.glideTo(this.heading() + step);
  };
}
