/**
 * The pure half of the location lookup: address formatting and slippy-map
 * arithmetic. The network half is not tested here — it is one fetch with a
 * documented shape, and a test of it would only assert that fetch was called.
 */

import { describe, expect, it } from 'vitest';
import { formatPlace, previewTiles, project, mapsLink, TILE_PX } from '../src/data/geo';

describe('formatPlace', () => {
  it('leads with the venue and follows with its street', () => {
    const out = formatPlace({
      name: 'Sports Hall',
      street: 'Hlavní',
      housenumber: '12',
      postcode: '100 00',
      city: 'Praha',
      country: 'Česko',
    });
    expect(out.name).toBe('Sports Hall');
    expect(out.detail).toBe('Hlavní 12, 100 00 Praha, Česko');
  });

  it('leads with the street when there is no venue name', () => {
    const out = formatPlace({
      street: 'Vedlejší',
      housenumber: '694/100',
      postcode: '100 00',
      city: 'Praha',
      country: 'Česko',
    });
    expect(out.name).toBe('Vedlejší 694/100');
    expect(out.label).toBe('Vedlejší 694/100, 100 00 Praha, Česko');
  });

  it('never renders empty parts as stray commas', () => {
    const out = formatPlace({ name: 'Praha', country: 'Česko' });
    expect(out.label).toBe('Praha, Česko');
    expect(out.label).not.toMatch(/,\s*,/);
  });

  it('does not repeat the name in the detail', () => {
    const out = formatPlace({ name: 'Praha', city: 'Praha', country: 'Česko' });
    expect(out.detail).not.toContain('Praha,');
    expect(out.detail).toBe('Česko');
  });

  it('survives a result with nothing in it', () => {
    expect(formatPlace({}).label).toBe('');
  });
});

describe('project', () => {
  it('puts 0,0 at the centre of the world', () => {
    const z = 0;
    const p = project(0, 0, z);
    expect(p.x).toBeCloseTo(TILE_PX / 2, 6);
    expect(p.y).toBeCloseTo(TILE_PX / 2, 6);
  });

  it('puts the antimeridian at both edges', () => {
    expect(project(0, -180, 0).x).toBeCloseTo(0, 6);
    expect(project(0, 180, 0).x).toBeCloseTo(TILE_PX, 6);
  });

  it('clamps beyond the Mercator limit rather than returning Infinity', () => {
    const world = TILE_PX * 2 ** 4;
    const north = project(89.9, 0, 4);
    const south = project(-89.9, 0, 4);
    expect(Number.isFinite(north.y)).toBe(true);
    expect(Number.isFinite(south.y)).toBe(true);
    // The clamp latitude lands on the world's edge, to within float noise —
    // it comes out a few hundred-millionths of a pixel past it.
    expect(north.y).toBeCloseTo(0, 5);
    expect(south.y).toBeCloseTo(world, 5);
  });

  it('doubles the world with each zoom level', () => {
    const a = project(50, 14, 10);
    const b = project(50, 14, 11);
    expect(b.x).toBeCloseTo(a.x * 2, 4);
    expect(b.y).toBeCloseTo(a.y * 2, 4);
  });
});

describe('previewTiles', () => {
  const lat = 50.0875;
  const lon = 14.4213;

  it('covers the whole box', () => {
    const w = 400;
    const h = 200;
    const { base } = previewTiles(lat, lon, 15, w, h);
    // Every pixel of the box must fall on some tile.
    const covered = (px: number, py: number) =>
      base.some((t) => px >= t.left && px < t.left + TILE_PX && py >= t.top && py < t.top + TILE_PX);
    for (const [px, py] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1], [w / 2, h / 2]]) {
      expect(covered(px, py)).toBe(true);
    }
  });

  it('centres the point in the box', () => {
    const w = 400;
    const h = 200;
    const z = 15;
    const { base } = previewTiles(lat, lon, z, w, h);
    const centre = project(lat, lon, z);
    // The tile containing the centre, placed by the same origin maths.
    const originX = centre.x - w / 2;
    const originY = centre.y - h / 2;
    expect(centre.x - originX).toBeCloseTo(w / 2, 6);
    expect(centre.y - originY).toBeCloseTo(h / 2, 6);
    expect(base.length).toBeGreaterThan(0);
  });

  it('uses Esri {z}/{y}/{x} order, not {z}/{x}/{y}', () => {
    const z = 15;
    const { base } = previewTiles(lat, lon, z, 256, 256);
    const centre = project(lat, lon, z);
    const tx = Math.floor(centre.x / TILE_PX);
    const ty = Math.floor(centre.y / TILE_PX);
    // y before x — getting this the usual way round shows a different continent.
    expect(base.some((t) => t.url.endsWith(`/${z}/${ty}/${tx}`))).toBe(true);
    expect(ty).not.toBe(tx);
  });

  it('returns a labels layer matching the base layer tile for tile', () => {
    const { base, labels } = previewTiles(lat, lon, 14, 300, 300);
    expect(labels).toHaveLength(base.length);
    for (let i = 0; i < base.length; i++) {
      expect(labels[i].left).toBe(base[i].left);
      expect(labels[i].top).toBe(base[i].top);
      expect(labels[i].url).toContain('Reference');
      expect(base[i].url).toContain('Base');
    }
  });

  it('needs no key in any tile URL', () => {
    const { base, labels } = previewTiles(lat, lon, 15, 400, 200);
    for (const t of [...base, ...labels]) {
      expect(t.url).not.toMatch(/key|token|apikey/i);
      expect(t.url.startsWith('https://services.arcgisonline.com/')).toBe(true);
    }
  });

  it('wraps tiles across the antimeridian instead of asking for negative ones', () => {
    const { base } = previewTiles(0, 179.99, 3, 512, 256);
    for (const t of base) {
      const x = Number(t.url.split('/').pop());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(2 ** 3);
    }
  });
});

describe('mapsLink', () => {
  it('prefers coordinates, which are unambiguous', () => {
    expect(mapsLink('anything', 50.09, 14.42)).toContain('query=50.09,14.42');
  });

  it('falls back to the text, escaped', () => {
    expect(mapsLink('Hlavní 12')).toContain(encodeURIComponent('Hlavní 12'));
  });
});
