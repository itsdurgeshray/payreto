// Shape of the hero tile mosaic, shared by the mosaic and the hero layout.
// Column tile-counts, left → right: 5 5 3 3 1 1 1 1 1 3 3 5 5  → 37 tiles.
export const COL_TILES = [5, 5, 3, 3, 1, 1, 1, 1, 1, 3, 3, 5, 5];
export const COLS = COL_TILES.length; // 13
export const MAX_ROWS = 5;
export const GAP = 6;
// The single-tile columns that form the hollow "valley" in the middle.
const VALLEY_FIRST = COL_TILES.indexOf(1);
const VALLEY_LAST = COL_TILES.lastIndexOf(1);

// Mosaic geometry for a given host width. The tile size is derived from the
// width alone, so the 13 columns always span the full width edge to edge.
// Exported so the hero can place its copy inside the valley.
export function mosaicMetrics(width: number) {
  const tile = Math.max(0, (width - (COLS - 1) * GAP) / COLS);
  return {
    tile,
    gap: GAP,
    // Full band height (tallest columns).
    gridH: tile > 0 ? MAX_ROWS * tile + (MAX_ROWS - 1) * GAP : 0,
    // Height of the valley floor (one row of tiles).
    floorH: tile,
    // Clear width between the 3-tall columns either side of the valley.
    valleyW: (VALLEY_LAST - VALLEY_FIRST + 1) * (tile + GAP) + GAP,
  };
}

// Corner radius of the expertise tab boxes the tiles become.
export const TAB_RADIUS = 16;
