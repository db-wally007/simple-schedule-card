import { describe, expect, it, vi } from 'vitest';
import { PALETTE, darkenForContrast, eventColor, fetchRegistryColors, resolveColor } from '../src/data/colors';

describe('resolveColor', () => {
  const reg = { 'calendar.a': '#cd74e6' };

  it('falls back to the entity-registry colour', () => {
    expect(resolveColor({ entity: 'calendar.a' }, reg, 0)).toBe('#cd74e6');
  });

  it('falls back to the palette for a calendar registered before the feature landed', () => {
    expect(resolveColor({ entity: 'calendar.old' }, reg, 1)).toBe(PALETTE[1]);
  });

  it('wraps the palette rather than going undefined', () => {
    expect(resolveColor({ entity: 'x' }, {}, PALETTE.length + 2)).toBe(PALETTE[2]);
  });
});

describe('fetchRegistryColors', () => {
  it('reads options.calendar.color out of the registry entries', async () => {
    const hass = {
      callWS: vi.fn().mockResolvedValue({
        'calendar.a': { options: { calendar: { color: '#cd74e6' } } },
        'calendar.b': { options: {} },
        'calendar.c': null,
      }),
    };
    expect(await fetchRegistryColors(hass, ['calendar.a', 'calendar.b', 'calendar.c'])).toEqual({
      'calendar.a': '#cd74e6',
    });
    expect(hass.callWS).toHaveBeenCalledWith({
      type: 'config/entity_registry/get_entries',
      entity_ids: ['calendar.a', 'calendar.b', 'calendar.c'],
    });
  });

  it('rejects a malformed colour instead of injecting it into a style', async () => {
    const hass = {
      callWS: vi.fn().mockResolvedValue({
        'calendar.a': { options: { calendar: { color: 'red; background:url(x)' } } },
      }),
    };
    expect(await fetchRegistryColors(hass, ['calendar.a'])).toEqual({});
  });

  it('treats a failed call as simply having no colours', async () => {
    const hass = { callWS: vi.fn().mockRejectedValue(new Error('nope')) };
    expect(await fetchRegistryColors(hass, ['calendar.a'])).toEqual({});
  });

  it('does not call out at all for an empty list', async () => {
    const hass = { callWS: vi.fn() };
    expect(await fetchRegistryColors(hass, [])).toEqual({});
    expect(hass.callWS).not.toHaveBeenCalled();
  });
});

describe('eventColor', () => {
  const map = { Lunch: '#f4c542', 'PE (Hall)': '#5ac8fa' };

  it('matches an event title exactly', () => {
    expect(eventColor('Lunch', map)).toBe('#f4c542');
    expect(eventColor('PE (Hall)', map)).toBe('#5ac8fa');
  });

  it('ignores case and surrounding space', () => {
    expect(eventColor('  lunch ', map)).toBe('#f4c542');
    expect(eventColor('LUNCH', map)).toBe('#f4c542');
  });

  it('returns undefined for an unlisted title, so the calendar colour wins', () => {
    expect(eventColor('Maths', map)).toBeUndefined();
    expect(eventColor('Lunch', undefined)).toBeUndefined();
  });

  it('does not match on a partial title', () => {
    expect(eventColor('Lunch break', map)).toBeUndefined();
  });
});

describe('darkenForContrast', () => {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const ratio = (hex: string) => {
    const m = /^#(..)(..)(..)$/.exec(hex)!;
    const l =
      0.2126 * lin(parseInt(m[1], 16)) +
      0.7152 * lin(parseInt(m[2], 16)) +
      0.0722 * lin(parseInt(m[3], 16));
    return 1.05 / (l + 0.05);
  };

  it('darkens a pale fill until white text clears the target', () => {
    // Flamingo is 2.9:1 against white untouched — the whole reason this exists.
    expect(ratio('#e67c73')).toBeLessThan(3);
    expect(ratio(darkenForContrast('#e67c73', 4.5))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(darkenForContrast('#f6bf26', 4.5))).toBeGreaterThanOrEqual(4.5);
  });

  it('leaves a fill that already passes completely alone', () => {
    // Basil is 5.0:1 already; darkening it would be gratuitous.
    expect(darkenForContrast('#0b8043', 4.5)).toBe('#0b8043');
    expect(darkenForContrast('#616161', 4.5)).toBe('#616161');
  });

  it('darkens no further than it must', () => {
    expect(ratio(darkenForContrast('#e67c73', 4.5))).toBeLessThan(4.75);
  });

  it('keeps the hue — it removes lightness, it does not grey out', () => {
    const out = darkenForContrast('#e67c73', 4.5);
    const m = /^#(..)(..)(..)$/.exec(out)!;
    const [r, g, b] = [1, 2, 3].map((i) => parseInt(m[i], 16));
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b);
  });

  it('is a no-op when disabled or given junk', () => {
    expect(darkenForContrast('#e67c73', 0)).toBe('#e67c73');
    expect(darkenForContrast('nonsense', 4.5)).toBe('nonsense');
  });
});

/**
 * A coloured mark on a PALE surface, which is the other half of the same job.
 * Today's month cell inverts to near-white, and the palette is picked to read on
 * the dark card — so a light colour lands on it almost invisibly.
 */
describe('darkenForContrast against a light surface', () => {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const lum = (hex: string) => {
    const m = /^#(..)(..)(..)$/.exec(hex)!;
    return (
      0.2126 * lin(parseInt(m[1], 16)) +
      0.7152 * lin(parseInt(m[2], 16)) +
      0.0722 * lin(parseInt(m[3], 16))
    );
  };
  const against = (hex: string, bg: string) => {
    const a = lum(hex);
    const b = lum(bg);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  const TODAY = '#ededed';

  it('rescues a pale colour that vanishes on the today cell', () => {
    // The general-waste grey: fine on the dark card, a smudge on #ededed.
    expect(against('#c8c8c8', TODAY)).toBeLessThan(1.5);
    expect(against(darkenForContrast('#c8c8c8', 3, TODAY), TODAY)).toBeGreaterThanOrEqual(3);
  });

  it('rescues the pale end of the palette too', () => {
    for (const c of ['#f6bf26', '#e67c73', '#7bd389']) {
      expect(against(darkenForContrast(c, 3, TODAY), TODAY)).toBeGreaterThanOrEqual(3);
    }
  });

  it('leaves a colour that already reads on that surface alone', () => {
    expect(darkenForContrast('#0b8043', 3, TODAY)).toBe('#0b8043');
  });

  it('is stricter than the same target measured against pure white', () => {
    // #ededed is darker than white, so less separation is available and the
    // colour has to come down further. Getting this backwards would under-darken.
    const onWhite = darkenForContrast('#c8c8c8', 3);
    const onCell = darkenForContrast('#c8c8c8', 3, TODAY);
    expect(lum(onCell)).toBeLessThan(lum(onWhite));
  });

  it('still defaults to white, so the block labels are unaffected', () => {
    expect(darkenForContrast('#e67c73', 4.5)).toBe(darkenForContrast('#e67c73', 4.5, '#ffffff'));
  });
});
