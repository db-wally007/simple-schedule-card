/**
 * The time drum's physics. These are the numbers that decide whether a flick
 * feels like iOS or like a web page, so the shape of each curve is pinned.
 */

import { describe, expect, it } from 'vitest';
import {
  clampIndex,
  cylinder,
  decay,
  GLIDE_TIME_MS,
  KINETIC_GAIN,
  KINETIC_TIME_MS,
  rowAt,
  rubber,
  throwTarget,
  velocityFrom,
} from '../src/data/drum';

const ROW = 44;
const R = 110;

describe('throwTarget', () => {
  it('a release with no velocity settles on the nearest row', () => {
    expect(throwTarget(10 * ROW + 21, 0, ROW, 59)).toBe(10);
    expect(throwTarget(10 * ROW + 23, 0, ROW, 59)).toBe(11);
  });

  it('a flick carries GAIN * velocity * time-constant further, then snaps', () => {
    const v = 1.5; // px per ms - a brisk flick
    const coast = KINETIC_GAIN * v * KINETIC_TIME_MS; // 390px, ~8.9 rows
    expect(throwTarget(0, v, ROW, 59)).toBe(Math.round(coast / ROW));
  });

  it('never throws past either end', () => {
    expect(throwTarget(0, -5, ROW, 59)).toBe(0);
    expect(throwTarget(50 * ROW, 5, ROW, 59)).toBe(59);
  });
});

describe('decay', () => {
  it('starts where it is, ends where it is going', () => {
    expect(decay(0, 100, 0, 325)).toBe(0);
    expect(decay(0, 100, 10 * 325, 325)).toBeCloseTo(100, 2);
  });

  it('decelerates - it is NOT linear', () => {
    const tc = 325;
    const first = decay(0, 400, 100, tc) - decay(0, 400, 0, tc);
    const later = decay(0, 400, 600, tc) - decay(0, 400, 500, tc);
    // The same 100ms covers far more ground early than late.
    expect(first).toBeGreaterThan(later * 3);
  });

  it('a throw picks up at about the release velocity, so the column does not lurch', () => {
    const v = 1.2;
    const to = KINETIC_GAIN * v * KINETIC_TIME_MS;
    const startVelocity = (decay(0, to, 1, KINETIC_TIME_MS) - decay(0, to, 0, KINETIC_TIME_MS)) / 1;
    expect(startVelocity).toBeCloseTo(KINETIC_GAIN * v, 2);
  });

  it('a glide across one row is over in well under half a second', () => {
    // Within half a pixel of the row is "there".
    const t = -GLIDE_TIME_MS * Math.log(0.5 / ROW);
    expect(t).toBeLessThan(450);
  });
});

describe('rubber', () => {
  it('gives at first, then holds - and never reaches the dimension', () => {
    const d = 220;
    expect(rubber(0, d)).toBe(0);
    expect(rubber(10, d)).toBeGreaterThan(4);
    expect(rubber(1000, d)).toBeLessThan(d);
    expect(rubber(400, d) - rubber(300, d)).toBeLessThan(rubber(100, d) - rubber(0, d));
  });

  it('is symmetric', () => {
    expect(rubber(-50, 220)).toBeCloseTo(-rubber(50, 220), 9);
  });
});

describe('velocityFrom', () => {
  it('reads the recent movement', () => {
    const s = [
      { t: 0, y: 0 },
      { t: 50, y: 50 },
      { t: 100, y: 100 },
    ];
    expect(velocityFrom(s, 100)).toBeCloseTo(1, 6);
  });

  it('is zero when the finger stopped before letting go', () => {
    const s = [
      { t: 0, y: 0 },
      { t: 40, y: 120 },
    ];
    expect(velocityFrom(s, 400)).toBe(0);
  });
});

describe('cylinder', () => {
  it('the centred row is drawn in place, full size, full strength', () => {
    const p = cylinder(0, R, ROW)!;
    expect(p.y).toBeCloseTo(0, 9);
    expect(p.scaleY).toBe(1);
    expect(p.opacity).toBe(1);
  });

  it('a neighbour is about half as bright, and rows fade towards the rim', () => {
    const one = cylinder(ROW, R, ROW)!;
    const two = cylinder(2 * ROW, R, ROW)!;
    expect(one.opacity).toBeGreaterThan(0.4);
    expect(one.opacity).toBeLessThan(0.6);
    expect(two.opacity).toBeLessThan(one.opacity);
  });

  it('rows bunch up towards the rim, as a turning surface does', () => {
    const gap1 = cylinder(ROW, R, ROW)!.y - cylinder(0, R, ROW)!.y;
    const gap3 = cylinder(3 * ROW, R, ROW)!.y - cylinder(2 * ROW, R, ROW)!.y;
    expect(gap3).toBeLessThan(gap1);
  });

  it('is symmetric, and gone past the rim', () => {
    expect(cylinder(-ROW, R, ROW)!.y).toBeCloseTo(-cylinder(ROW, R, ROW)!.y, 9);
    expect(cylinder(R * 1.6, R, ROW)).toBeNull();
  });
});

describe('rowAt', () => {
  it('a tap lands on the row DRAWN there, rim included', () => {
    const offset = 10 * ROW;
    for (const k of [-3, -2, -1, 0, 1, 2, 3]) {
      const drawnAt = cylinder(k * ROW, R, ROW);
      if (!drawnAt) continue;
      expect(rowAt(drawnAt.y, offset, R, ROW, 59)).toBe(10 + k);
    }
  });

  it('stays in range', () => {
    expect(rowAt(-R, 0, R, ROW, 59)).toBe(0);
    expect(rowAt(R, 59 * ROW, R, ROW, 59)).toBe(59);
    expect(clampIndex(-3, 59)).toBe(0);
  });
});
