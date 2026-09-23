// Shape of the hero tile mosaic, shared by the mosaic and the hero layout.
// Column tile-counts, left → right: 5 5 3 3 1 1 1 1 1 1 3 3 5 5  → 38 tiles,
// one per expertise item. 14 columns keeps the tiles square while making the
// band a touch lighter than a 13-column grid would.
export const COL_TILES = [5, 5, 3, 3, 1, 1, 1, 1, 1, 1, 3, 3, 5, 5];
export const COLS = COL_TILES.length; // 14
export const MAX_ROWS = Math.max(...COL_TILES);
export const GAP = 6;
// The single-tile columns that form the hollow "valley" in the middle.
const VALLEY_FIRST = COL_TILES.indexOf(1);
const VALLEY_LAST = COL_TILES.lastIndexOf(1);
// Columns between the tallest runs at either edge, and their tallest height.
const INNER_FIRST = COL_TILES.findIndex((n) => n < MAX_ROWS);
const INNER_LAST = COLS - 1 - [...COL_TILES].reverse().findIndex((n) => n < MAX_ROWS);
const MID_ROWS = Math.max(...COL_TILES.slice(INNER_FIRST, INNER_LAST + 1));

// Mosaic geometry for a given host width. The tile size is derived from the
// width alone, so the columns always span the full width edge to edge.
// Exported so the hero can place its copy around the mosaic.
export function mosaicMetrics(width: number) {
  const tile = Math.max(0, (width - (COLS - 1) * GAP) / COLS);
  const span = (from: number, to: number) => (to - from + 1) * (tile + GAP) + GAP;
  return {
    tile,
    gap: GAP,
    // Full band height (tallest columns).
    gridH: tile > 0 ? MAX_ROWS * tile + (MAX_ROWS - 1) * GAP : 0,
    // Height of the valley floor (one row of tiles).
    floorH: tile,
    // Clear width between the mid-height columns either side of the valley.
    valleyW: span(VALLEY_FIRST, VALLEY_LAST),
    // Clear width between the tallest edge columns, and the height of the
    // mid-height columns inside them.
    innerW: span(INNER_FIRST, INNER_LAST),
    midH: MID_ROWS * tile + (MID_ROWS - 1) * GAP,
  };
}

// Corner radius of the expertise tab boxes the tiles become.
export const TAB_RADIUS = 16;
