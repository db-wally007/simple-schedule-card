/**
 * The physics of the time drum, kept pure so it can be pinned in tests.
 *
 * The drum is a column of rows on a cylinder. Its state is one number - `offset`,
 * how far down the column the centre line sits, in px (row i is centred when
 * offset = i * rowH). Everything here maps that number to motion or to looks:
 *
 * - a THROW, after a flick: where the momentum carries the column, snapped to a
 *   row, and the exponential curve it decelerates along - the kinetic scrolling
 *   iOS lists have, rather than the linear slide a native scroll-snap column gave;
 * - the RUBBER BAND past either end, with iOS's own formula;
 * - the CYLINDER: where a row is drawn and how squashed and faint it is, from its
 *   distance to the centre line.
 */

/**
 * Time constant of the throw's deceleration, in ms. The momentum decays as
 * exp(-t / KINETIC_TIME_MS): 325ms is the figure iOS-style kinetic scrollers
 * settled on, and it reads as a flick that coasts and then eases in, never stops
 * dead.
 */
export const KINETIC_TIME_MS = 325;

/** How much of the release velocity carries into the throw. */
export const KINETIC_GAIN = 0.8;

/**
 * Time constant for a deliberate move - a tap on a row, a wheel notch, an arrow
 * key, or settling a slow drag onto the nearest row. Short, so it is a glide and
 * not a wait.
 */
export const GLIDE_TIME_MS = 95;

/** Velocity is read off the pointer's last this-many ms - older movement is history. */
export const VELOCITY_WINDOW_MS = 100;

/** iOS's rubber band constant: how stiff the pull past an end feels. */
const RUBBER_C = 0.55;

/** One pointer position, for velocity. */
export interface DrumSample {
  t: number;
  y: number;
}

export function clampIndex(index: number, max: number): number {
  return Math.min(max, Math.max(0, index));
}

/**
 * Where a release lands: the column coasts on KINETIC_GAIN of its velocity for
 * one time constant, then the nearest row in range takes it.
 *
 * @param velocity px per ms along the offset (positive = towards later rows)
 */
export function throwTarget(offset: number, velocity: number, rowH: number, max: number): number {
  const coast = offset + KINETIC_GAIN * velocity * KINETIC_TIME_MS;
  return clampIndex(Math.round(coast / rowH), max);
}

/**
 * Position at `elapsed` ms of an exponential approach from `from` to `to`.
 *
 * Starting velocity is (to - from) / timeConstant. For a throw the target is about
 * velocity * GAIN * KINETIC_TIME_MS away, so the curve picks up at close to the
 * speed the finger left at - the column does not lurch on release.
 */
export function decay(from: number, to: number, elapsed: number, timeConstant: number): number {
  return to + (from - to) * Math.exp(-elapsed / timeConstant);
}

/**
 * The rubber band: how far an overshoot of `over` px is actually drawn. iOS's
 * formula - (1 - 1 / (x * c / d + 1)) * d - tapers, so it gives at first and
 * then holds, and never reaches `dimension`.
 */
export function rubber(over: number, dimension: number): number {
  const x = Math.abs(over);
  return Math.sign(over) * (1 - 1 / ((x * RUBBER_C) / dimension + 1)) * dimension;
}

/**
 * Pointer velocity in px per ms over the recent window, or 0 when the pointer has
 * been still. Positive when the pointer moved DOWN the screen.
 */
export function velocityFrom(samples: DrumSample[], now: number): number {
  const recent = samples.filter((s) => now - s.t <= VELOCITY_WINDOW_MS);
  if (recent.length < 2) return 0;
  const first = recent[0];
  const last = recent[recent.length - 1];
  const dt = last.t - first.t;
  return dt > 0 ? (last.y - first.y) / dt : 0;
}

/** How a row is drawn on the cylinder. */
export interface CylinderPose {
  /** Distance from the centre line, in px on screen. */
  y: number;
  /** Squash towards the rim: the row's face turning away. */
  scaleY: number;
  /** A touch narrower towards the rim, as a curved surface reads. */
  scaleX: number;
  opacity: number;
}

/**
 * Where a row `delta` px from the centre (along the drum's surface) is drawn, on a
 * cylinder of `radius`. Null once the row has turned past the rim and out of view.
 *
 * Opacity is two things added: a brightness that belongs to the selection band and
 * is gone one row away, and a shading that falls with the angle. Together the
 * chosen row is full strength, its neighbours about half, and the rim fades out -
 * the iOS picker's look.
 */
export function cylinder(delta: number, radius: number, rowH: number): CylinderPose | null {
  const theta = delta / radius;
  if (Math.abs(theta) >= Math.PI / 2) return null;
  const cos = Math.cos(theta);
  const band = Math.max(0, 1 - Math.abs(delta) / rowH);
  return {
    y: radius * Math.sin(theta),
    scaleY: cos,
    scaleX: 0.86 + 0.14 * cos,
    opacity: Math.min(1, band * 0.45 + 0.55 * cos),
  };
}

/**
 * The row under a point `y` px from the centre line, on screen. The inverse of
 * cylinder(): a tap lands on what is DRAWN there, which near the rim is not where a
 * flat list would put it.
 */
export function rowAt(y: number, offset: number, radius: number, rowH: number, max: number): number {
  const s = Math.max(-1, Math.min(1, y / radius));
  return clampIndex(Math.round((offset + Math.asin(s) * radius) / rowH), max);
}
