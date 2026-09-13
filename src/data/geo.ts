/**
 * Address lookup and a map preview, for the edit form's location field.
 *
 * Neither half needs a key, an account or a backend, which is the whole reason
 * these two providers were chosen over the obvious ones.
 *
 * SEARCH — Photon (photon.komoot.io). Home Assistant has no geocoder: nothing in
 * core turns text into a place, `google_travel_time` and `waze_travel_time` only
 * measure between points you already have, and the HACS `places` integration
 * geocodes the other way round, coordinates to address. Google's own Places
 * Autocomplete would need a SECOND API key with billing attached — the OAuth
 * token the calendar integration holds is scoped to Calendar and will not
 * authenticate Places. Photon is built for type-ahead specifically, answers
 * partial words, and sends `Access-Control-Allow-Origin: *` so the card can call
 * it straight from the browser. Nominatim also works and is CORS-open, but
 * returned half as many results on the same fragment and its usage policy
 * discourages autocomplete.
 *
 * TILES — Esri Canvas. Home Assistant's own map card uses CARTO, and every CARTO
 * basemap now returns tiles stamped "API KEY REQUIRED" straight across them:
 * verified here by rendering `ha-map`, which came back watermarked. Esri needs no
 * key. Note the path order is {z}/{y}/{x}, NOT the usual {z}/{x}/{y} — the same
 * trap documented in fruity-weather-card's precip map, which uses this source
 * for the same reason.
 */

/** One search result, flattened to what the form actually needs. */
export interface Place {
  /** A single line, in the order an address is written. */
  label: string;
  /** The bold part: a venue name where there is one, else the street line. */
  name: string;
  /** The rest, for the second line of the row. */
  detail: string;
  lat: number;
  lon: number;
}

const PHOTON_URL = 'https://photon.komoot.io/api/';

/** Shortest query worth sending. Below this every answer is noise. */
export const MIN_QUERY_LEN = 3;

interface PhotonProps {
  name?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  osm_key?: string;
  osm_value?: string;
}

/**
 * Build the address line from Photon's parts.
 *
 * Exported and pure because the ordering is the fiddly bit: a house number
 * follows the street in Czech and precedes it in English, and a venue with no
 * street of its own must not render as ", , Praha".
 */
export function formatPlace(props: PhotonProps): { name: string; detail: string; label: string } {
  const streetLine = [props.street, props.housenumber].filter(Boolean).join(' ');
  const cityLine = [props.postcode, props.city].filter(Boolean).join(' ');
  // The name is what you searched for when it is a venue, and the street
  // otherwise — a result whose headline is its own postcode is unreadable.
  const name = props.name || streetLine || props.city || props.country || '';
  const rest: string[] = [];
  if (props.name && streetLine) rest.push(streetLine);
  if (cityLine && cityLine !== name) rest.push(cityLine);
  if (props.district && !cityLine.includes(props.district) && props.district !== name) {
    rest.push(props.district);
  }
  if (props.country && props.country !== name) rest.push(props.country);
  const detail = rest.join(', ');
  return { name, detail, label: detail ? `${name}, ${detail}` : name };
}

/**
 * Look an address up. Returns [] rather than throwing: a lookup that fails is
 * an empty suggestion list, never an error in the middle of typing.
 *
 * `signal` lets the caller drop an in-flight request when the next keystroke
 * arrives, so results cannot land out of order.
 */
export async function searchPlaces(
  query: string,
  opts: { lat?: number; lon?: number; limit?: number; lang?: string; signal?: AbortSignal } = {},
): Promise<Place[]> {
  const q = query.trim();
  if (q.length < MIN_QUERY_LEN) return [];
  const params = new URLSearchParams({ q, limit: String(opts.limit ?? 6) });
  // Bias towards home, so "gymnastika" finds the one down the road rather than
  // the one in another country.
  if (typeof opts.lat === 'number' && typeof opts.lon === 'number') {
    params.set('lat', String(opts.lat));
    params.set('lon', String(opts.lon));
  }
  if (opts.lang) params.set('lang', opts.lang);
  try {
    const res = await fetch(`${PHOTON_URL}?${params.toString()}`, { signal: opts.signal });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      features?: Array<{ properties?: PhotonProps; geometry?: { coordinates?: number[] } }>;
    };
    const out: Place[] = [];
    for (const f of data.features ?? []) {
      const coords = f.geometry?.coordinates;
      if (!coords || coords.length < 2) continue;
      const { name, detail, label } = formatPlace(f.properties ?? {});
      if (!label) continue;
      out.push({ label, name, detail, lat: coords[1], lon: coords[0] });
    }
    return out;
  } catch {
    // Aborted, offline, or the service is down. All the same to the form.
    return [];
  }
}

/* ------------------------------------------------------------------ *
 * Slippy-map arithmetic for the preview. Pure, and covered by tests.
 * ------------------------------------------------------------------ */

export const TILE_PX = 256;

/** World pixel coordinates at a zoom, Web Mercator. */
export function project(lat: number, lon: number, z: number): { x: number; y: number } {
  const n = TILE_PX * 2 ** z;
  const x = ((lon + 180) / 360) * n;
  // Clamped to the latitudes Mercator can represent; beyond them the tangent
  // runs away and the arithmetic returns Infinity.
  const clamped = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const rad = (clamped * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  return { x, y };
}

export interface MapTile {
  url: string;
  /** Where to place it inside the preview box, in CSS px from the top left. */
  left: number;
  top: number;
}

/**
 * The tiles covering a `width`x`height` box centred on a point, plus where each
 * one sits. Two layers come back interleaved: the base, then its labels.
 */
export function previewTiles(
  lat: number,
  lon: number,
  z: number,
  width: number,
  height: number,
  shade: 'Dark' | 'Light' = 'Dark',
): { base: MapTile[]; labels: MapTile[] } {
  const centre = project(lat, lon, z);
  const originX = centre.x - width / 2;
  const originY = centre.y - height / 2;
  const n = 2 ** z;
  const base: MapTile[] = [];
  const labels: MapTile[] = [];
  const x0 = Math.floor(originX / TILE_PX);
  const y0 = Math.floor(originY / TILE_PX);
  const x1 = Math.floor((originX + width) / TILE_PX);
  const y1 = Math.floor((originY + height) / TILE_PX);
  for (let ty = y0; ty <= y1; ty++) {
    if (ty < 0 || ty >= n) continue;
    for (let tx = x0; tx <= x1; tx++) {
      // Wrapped, so a box straddling the antimeridian still tiles.
      const wx = ((tx % n) + n) % n;
      const left = tx * TILE_PX - originX;
      const top = ty * TILE_PX - originY;
      const root = 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas';
      // {z}/{y}/{x} — Esri's order, not the usual one.
      base.push({ url: `${root}/World_${shade}_Gray_Base/MapServer/tile/${z}/${ty}/${wx}`, left, top });
      labels.push({
        url: `${root}/World_${shade}_Gray_Reference/MapServer/tile/${z}/${ty}/${wx}`,
        left,
        top,
      });
    }
  }
  return { base, labels };
}

/**
 * Esri Canvas has real imagery to zoom 16. Seventeen and deeper return an
 * identical 2521-byte "Map data not yet available" placeholder — measured, at
 * z13-z19. Only the static fallback preview still uses Canvas.
 */
export const ESRI_MAX_NATIVE_ZOOM = 16;

export function esriTileUrl(layer: 'Base' | 'Reference', shade: 'Dark' | 'Light' = 'Dark'): string {
  // {z}/{y}/{x} — Esri's order, not the usual one.
  return (
    'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/' +
    `World_${shade}_Gray_${layer}/MapServer/tile/{z}/{y}/{x}`
  );
}

export type BaseMap = 'street';

export interface BaseMapSpec {
  url: string;
  maxNativeZoom: number;
  attribution: string;
  /** A second layer drawn over the first, for labels on imagery. */
  overlay?: string;
}

/**
 * The basemaps the interactive map offers.
 *
 * Esri's CANVAS styles are deliberately almost empty — they are a backdrop for
 * plotting data on, not a map to read, and using one here was the mistake: no
 * shops, no building names, nothing to recognise a place by. Measured at the
 * same tile, Canvas is 12kB against OSM's 31kB; that difference is the detail.
 *
 * Neither of these needs a key. OSM standard is the closest keyless thing to
 * what Google shows — named POIs, buildings, parks, in colour — and Esri's World
 * Imagery gives the satellite view, with a transparent reference layer on top so
 * the streets stay named.
 */
export const BASEMAPS: Record<BaseMap, BaseMapSpec> = {
  street: {
    // World_TOPO_Map, not World_Street_Map. Compared at zoom 18 over a Czech
    // village, Street draws ONE ROAD LINE and nothing else — no buildings, no
    // street names — while Topo draws the buildings and names the streets. Esri's
    // street rendering thins out badly outside cities, which is exactly where a
    // child's after-school club is.
    //
    // NOT tile.openstreetmap.org either: their policy forbids third-party apps
    // and their servers enforce it with 403 "Access blocked", rendered as a
    // yellow hazard-striped tile. A browser cannot send an identifying
    // User-Agent, so there is no compliant way to use them.
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    maxNativeZoom: 19,
    attribution: '© Esri',
  },
};

/** Home Assistant serves Leaflet's stylesheet here; ha-map links the same file. */
export const LEAFLET_CSS = '/static/images/leaflet/leaflet.css';

/* eslint-disable @typescript-eslint/no-explicit-any */
type LeafletGlobal = any;

let leafletPromise: Promise<LeafletGlobal | null> | null = null;

/**
 * Home Assistant's own Leaflet, borrowed rather than bundled.
 *
 * There is no supported way to ask for it. What works — and what `ha-map` does
 * internally — is to let the map card import it: the chunk assigns `window.L`
 * on load, and it stays there afterwards. Creating the card element is NOT
 * enough; it has to be CONNECTED, because the import happens in the element's
 * first update. Measured at about 100ms, once per page.
 *
 * Returns null rather than throwing if any of that fails, so the caller can fall
 * back to the static tile preview. This is a private path and may change.
 */
export function loadLeaflet(): Promise<LeafletGlobal | null> {
  if (leafletPromise) return leafletPromise;
  leafletPromise = (async () => {
    const w = window as unknown as {
      L?: LeafletGlobal;
      loadCardHelpers?: () => Promise<{ createCardElement: (c: unknown) => Promise<HTMLElement> }>;
    };
    if (w.L) return w.L;
    if (!w.loadCardHelpers) return null;
    try {
      const helpers = await w.loadCardHelpers();
      const el = await helpers.createCardElement({ type: 'map', entities: [] });
      el.style.cssText =
        'position:absolute;left:-9999px;top:0;width:1px;height:1px;visibility:hidden';
      document.body.appendChild(el);
      for (let i = 0; i < 60 && !w.L; i++) {
        await new Promise((r) => setTimeout(r, 50));
      }
      el.remove();
      return w.L ?? null;
    } catch {
      return null;
    }
  })();
  return leafletPromise;
}

/** What is at this point? Used when the map is dragged to choose a place. */
export async function reverseGeocode(
  lat: number,
  lon: number,
  opts: { lang?: string; signal?: AbortSignal } = {},
): Promise<Place | null> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  if (opts.lang) params.set('lang', opts.lang);
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?${params.toString()}`, {
      signal: opts.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: Array<{ properties?: PhotonProps; geometry?: { coordinates?: number[] } }>;
    };
    const f = data.features?.[0];
    if (!f) return null;
    const { name, detail, label } = formatPlace(f.properties ?? {});
    if (!label) return null;
    const coords = f.geometry?.coordinates;
    return {
      label,
      name,
      detail,
      lat: coords?.[1] ?? lat,
      lon: coords?.[0] ?? lon,
    };
  } catch {
    return null;
  }
}

/** A link that opens the place in whatever maps app the device prefers. */
export function mapsLink(query: string, lat?: number, lon?: number): string {
  if (typeof lat === 'number' && typeof lon === 'number') {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
