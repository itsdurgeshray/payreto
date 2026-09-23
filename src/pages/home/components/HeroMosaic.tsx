import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { heroGlow } from "./heroGlowState";
import {
  clamp01,
  easeInOutCubic,
  heroTransition,
  lerp,
  smoothstep,
  useActiveGroup,
} from "./heroTransition";
import { GROUPS, ITEMS, type GroupKey } from "./solutionsData";
import { TabFace } from "./ExpertiseTabs";
import { COLS, COL_TILES, GAP, MAX_ROWS, TAB_RADIUS, mosaicMetrics } from "./mosaicGeometry";

// Full-bleed, bottom-anchored mosaic of perfectly square tiles.
//
// Column tile-counts, left → right: 5 5 3 3 1 1 1 1 1 3 3 5 5  → 37 tiles.
// The 13 columns ALWAYS span the entire viewport width — the square tile size
// is derived from the available width, so the band scales with the screen and
// never leaves side gaps. Every column rests on the same baseline, giving the
// symmetric rising-valley silhouette.
//
// Hover: the reveal is a RADIAL gradient centred exactly under the cursor —
// brightest at the cursor and fading out toward the edges. Everything is
// clipped inside the tile, so no colour or glow ever bleeds into the negative
// space between tiles.
//
// Scroll: as the hero transition progresses, every tile flies to its colour
// group's tab, stretching into a pill; the tiles of a group merge into one
// tab, which the real tab bar then takes over (see Solutions).

// Uniform, clean blue resting state for every tile.
const BLUE = {
  border: "rgba(96,165,250,0.18)",
  bg: "rgba(37,99,235,0.10)",
  fill: "linear-gradient(135deg, rgba(96,165,250,0.22) 0%, rgba(37,99,235,0.13) 100%)",
};

// Flight timing (in overall transition progress). Each tile starts a little
// later than its left neighbour and later again by group, so the mosaic
// peels apart in a wave rather than moving as one block.
// Timing is in transition progress (0–1 over the timed transition). The tiles
// wait until the light wash (Hero) is half-way across the stage and finish
// as it completes; two quick beats ripple out from the centre column:
//  1. ignite — each tile lights up in its group colour, still in place;
//  2. flight — it lifts off, glides to its tab and settles into the tab skin.
const IGNITE_START = 0.4; // wash half-way (Hero: smoothstep(0.02, 0.78))
const IGNITE_SPREAD = 0.04;
const IGNITE_DUR = 0.06;
const FLIGHT_START = 0.42;
const FLIGHT_SPREAD_COL = 0.05;
const FLIGHT_SPREAD_ROW = 0.005;
const FLIGHT_DUR = 0.29; // last tile lands at ~0.78, as the wash completes
const CENTRE_COL = (COLS - 1) / 2;
const WHITE = [255, 255, 255];
const NEUTRAL_BORDER = [23, 23, 23, 0.08];

const rgb = (s: string) => s.split(",").map(Number);
const mix = (a: number[], b: number[], t: number) =>
  a.map((v, i) => Math.round(lerp(v, b[i], t)));

type CellCfg = {
  label: string;
  group: GroupKey;
  // The first tile of each group carries the tab label and survives the merge.
  leader: boolean;
  col: number;
};

type CellRefs = {
  flight: HTMLDivElement | null;
  root: HTMLDivElement | null;
  hover: HTMLDivElement | null;
  shimmer: HTMLDivElement | null;
  label: HTMLDivElement | null;
  chip: HTMLDivElement | null;
};

type Geometry = { cx: number; cy: number; left: number; top: number };


export default function HeroMosaic() {
  const hostRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const cellRefs = useRef<Map<string, CellRefs>>(new Map());
  const activeRef = useRef<Set<string>>(new Set());
  // Host width + stage (viewport) height — the latter locates the tab targets.
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = hostRef.current;
    const stage = el?.parentElement;
    if (!el || !stage) return;
    const update = () => setSize({ w: el.clientWidth, h: stage.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const setCellRef = useCallback(
    (key: string, field: keyof CellRefs) => (el: HTMLDivElement | null) => {
      const existing = cellRefs.current.get(key) ?? {
        flight: null,
        root: null,
        hover: null,
        shimmer: null,
        label: null,
        chip: null,
      };
      existing[field] = el;
      cellRefs.current.set(key, existing);
    },
    []
  );

  // Square tile size — derived from width only, so the band always fills the
  // full width with no side margins.
  const { tile, gridH } = useMemo(() => mosaicMetrics(size.w), [size.w]);

  const revealRadius = tile > 0 ? tile * 1.7 : 0;
  const labelFontSize = Math.round(Math.min(13, Math.max(8, tile * 0.17)));
  const active = useActiveGroup();

  const cellConfig = useMemo(() => {
    const config: Record<string, CellCfg> = {};
    const seen = new Set<GroupKey>();
    let idx = 0;
    for (let c = 0; c < COLS; c++) {
      for (let i = 0; i < COL_TILES[c]; i++) {
        const entry = ITEMS[idx % ITEMS.length];
        idx++;
        config[`${c}-${i}`] = {
          label: entry.code,
          group: entry.group,
          leader: !seen.has(entry.group),
          col: c,
        };
        seen.add(entry.group);
      }
    }
    return config;
  }, []);

  // Geometry of every tile, in host coordinates. Child i=0 is the TOP tile of
  // its column group, so the group occupies the bottom `count` rows.
  const geometry = useMemo(() => {
    const map: Record<string, Geometry> = {};
    if (tile <= 0) return map;
    for (let c = 0; c < COLS; c++) {
      const count = COL_TILES[c];
      const groupTop = gridH - (count * tile + (count - 1) * GAP);
      for (let i = 0; i < count; i++) {
        const left = c * (tile + GAP);
        const top = groupTop + i * (tile + GAP);
        map[`${c}-${i}`] = { cx: left + tile / 2, cy: top + tile / 2, left, top };
      }
    }
    return map;
  }, [tile, gridH]);

  // Track the cursor relative to the host (writes to a ref — never renders).
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const rect = hostRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pad = 200;
      if (
        e.clientX < rect.left - pad ||
        e.clientX > rect.right + pad ||
        e.clientY < rect.top - pad ||
        e.clientY > rect.bottom + pad
      ) {
        mouseRef.current = null;
        return;
      }
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener("mousemove", handle, { passive: true });
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  useEffect(() => {
    if (tile <= 0 || revealRadius <= 0) return;

    let raf = 0;
    let mounted = true;
    let lastP = -1;

    const resetCell = (key: string) => {
      const refs = cellRefs.current.get(key);
      if (!refs) return;
      if (refs.root) {
        refs.root.style.transform = "translate3d(0,0,0) scale(1)";
        refs.root.style.borderColor = BLUE.border;
        refs.root.style.boxShadow = "";
      }
      if (refs.flight) refs.flight.style.zIndex = "1";
      if (refs.hover) refs.hover.style.opacity = "0";
      if (refs.shimmer) {
        refs.shimmer.style.opacity = "0";
        refs.shimmer.style.transform = "translateX(-30%)";
      }
      if (refs.label) {
        refs.label.style.opacity = "0";
        refs.label.style.transform = "scale(0.86)";
      }
    };

    const applyCell = (key: string, reveal: number, cfg: CellCfg, g: Geometry) => {
      const refs = cellRefs.current.get(key);
      if (!refs) return;
      const group = GROUPS[cfg.group];
      const q = 1 - Math.pow(1 - reveal, 3); // ease-out
      const head = mouseRef.current;
      const relX = head ? head.x - g.left : tile / 2;
      const relY = head ? head.y - g.top : tile / 2;

      if (refs.root) {
        refs.root.style.transform = `translate3d(0, ${-q * 3}px, 0) scale(${1 + q * 0.05})`;
        refs.root.style.borderColor = `rgba(${group.base}, ${0.18 + q * 0.62})`;
        refs.root.style.boxShadow = `inset 0 0 ${8 + q * 22}px rgba(${group.base}, ${
          0.5 * q
        })`;
      }
      if (refs.flight) refs.flight.style.zIndex = q > 0.35 ? "3" : "1";
      if (refs.hover) {
        // Radial reveal, centred on the cursor → brightest under the cursor,
        // fading toward the tile's far edges. A low flat tint keeps the whole
        // tile in its category colour so the light label stays legible even
        // when the cursor sits away from the tile centre.
        refs.hover.style.backgroundColor = `rgba(${group.deep}, ${0.42 * q})`;
        refs.hover.style.backgroundImage = `radial-gradient(circle ${revealRadius * 1.3}px at ${relX}px ${relY}px, rgba(${group.base},0.95) 0%, rgba(${group.base},0.62) 32%, rgba(${group.deep},0.34) 68%, rgba(${group.deep},0) 100%)`;
        refs.hover.style.opacity = `${q}`;
      }
      if (refs.shimmer) {
        refs.shimmer.style.opacity = `${q * 0.45}`;
        refs.shimmer.style.transform = `translateX(${(q - 0.5) * 70}%)`;
      }
      if (refs.label) {
        refs.label.style.opacity = `${q}`;
        refs.label.style.transform = `scale(${0.86 + q * 0.14})`;
      }
    };

    // Landing targets: the real tab boxes, in host coordinates.
    const measureTargets = () => {
      const host = hostRef.current;
      const stage = host?.parentElement;
      const targets: Partial<Record<GroupKey, { x: number; y: number; w: number; h: number }>> = {};
      if (!host || !stage) return targets;
      const hr = host.getBoundingClientRect();
      stage.querySelectorAll<HTMLElement>("[data-tab-target]").forEach((el) => {
        const r = el.getBoundingClientRect();
        targets[el.dataset.tabTarget as GroupKey] = {
          x: r.left - hr.left,
          y: r.top - hr.top,
          w: r.width,
          h: r.height,
        };
      });
      return targets;
    };

    // Place every tile along its flight from the mosaic to its tab.
    const applyFlight = (p: number) => {
      const targets = measureTargets();
      const activeKey = heroTransition.active;
      for (const key in cellConfig) {
        const refs = cellRefs.current.get(key);
        const g = geometry[key];
        const cfg = cellConfig[key];
        const target = targets[cfg.group];
        if (!refs?.flight || !g || !target) continue;
        const group = GROUPS[cfg.group];
        const isActive = cfg.group === activeKey;
        const row = Number(key.split("-")[1]);

        const dist = Math.abs(cfg.col - CENTRE_COL) / CENTRE_COL;
        const ignite = smoothstep(0, 1, (p - IGNITE_START - dist * IGNITE_SPREAD - row * FLIGHT_SPREAD_ROW) / IGNITE_DUR);
        const t = clamp01(
          (p - FLIGHT_START - dist * FLIGHT_SPREAD_COL - row * FLIGHT_SPREAD_ROW) / FLIGHT_DUR
        );

        // Rise first, then glide across: the vertical move leads and the
        // horizontal one trails, giving each tile a fluid curved path.
        const ey = easeInOutCubic(clamp01(t / 0.88));
        const ex = easeInOutCubic(clamp01((t - 0.12) / 0.88));
        const es = easeInOutCubic(clamp01((t - 0.2) / 0.8));
        const x = lerp(g.left, target.x, ex);
        const y = lerp(g.top, target.y, ey);
        const w = lerp(tile, target.w, es);
        const h = lerp(tile, target.h, es);

        // Skin: dark glass → vivid group colour (ignite) → the tab's resting
        // skin (neutral white, or group ink for the active tab) as it lands.
        const settle = smoothstep(0.45, 1, t);
        const base = rgb(group.base);
        const final = isActive ? rgb(group.ink) : WHITE;
        const fill = mix(base, final, settle);
        const fillA = lerp(0.92 * ignite, 1, settle);
        const finalBorder = isActive ? [...rgb(group.ink), 1] : NEUTRAL_BORDER;
        const borderRgb = mix(rgb(group.light), finalBorder.slice(0, 3), settle);
        const borderA = lerp(0.7 * ignite, finalBorder[3], settle);
        const glow = ignite * (1 - settle);

        const s = refs.flight.style;
        s.transform = `translate3d(${x}px, ${y}px, 0)`;
        s.width = `${w}px`;
        s.height = `${h}px`;
        s.borderRadius = `${lerp(8, TAB_RADIUS, smoothstep(0, 0.6, t))}px`;
        s.backgroundColor = `rgba(${fill.join(",")}, ${fillA})`;
        s.borderColor = `rgba(${borderRgb.join(",")}, ${borderA})`;
        s.boxShadow =
          glow > 0.01
            ? `0 0 ${24 * glow}px rgba(${group.base}, ${0.45 * glow}), 0 18px 34px -18px rgba(${group.deep}, ${0.8 * glow})`
            : "";
        // Non-leaders dissolve into the leader as the group lands; the leader
        // hands over to the real tab at the very end.
        s.opacity = cfg.leader
          ? `${1 - smoothstep(0.77, 0.84, p)}`
          : `${1 - smoothstep(0.72, 0.96, t)}`;
        if (refs.root) refs.root.style.opacity = `${1 - ignite}`;
        if (refs.chip) refs.chip.style.opacity = `${smoothstep(0.72, 1, t)}`;
      }
    };

    const loop = () => {
      if (!mounted) return;
      const p = heroTransition.p;
      if (p !== lastP) {
        applyFlight(p);
        lastP = p;
      }

      // Hover only while the hero is at rest.
      const head =
        p < 0.005 && heroTransition.mode === "hero" ? mouseRef.current : null;
      const keys = Object.keys(cellConfig);
      const next = new Set<string>();

      let wr = 0;
      let wg = 0;
      let wb = 0;
      let wtot = 0;

      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        const g = geometry[key];
        if (!g) continue;

        let reveal = 0;
        if (head) {
          const dx = head.x - g.cx;
          const dy = head.y - g.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          reveal = Math.max(0, Math.min(1, 1 - dist / revealRadius));
        }

        if (reveal > 0.02) {
          next.add(key);
          const cfg = cellConfig[key];
          applyCell(key, reveal, cfg, g);
          const n = GROUPS[cfg.group].n;
          wr += n[0] * reveal;
          wg += n[1] * reveal;
          wb += n[2] * reveal;
          wtot += reveal;
        } else if (activeRef.current.has(key)) {
          resetCell(key);
        }
      }

      activeRef.current.forEach((key) => {
        if (!next.has(key)) resetCell(key);
      });
      activeRef.current = next;

      if (wtot > 0.02) {
        heroGlow.targetR = wr / wtot;
        heroGlow.targetG = wg / wtot;
        heroGlow.targetB = wb / wtot;
        heroGlow.targetIntensity = Math.min(1, wtot / 2.2);
      } else {
        heroGlow.targetR = 96;
        heroGlow.targetG = 165;
        heroGlow.targetB = 250;
        heroGlow.targetIntensity = 0;
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
    };
  }, [tile, gridH, size.h, active, revealRadius, cellConfig, geometry]);

  // Tiles render once per size change — the loop then mutates DOM directly.
  const tiles = useMemo(() => {
    if (tile <= 0) return null;
    cellRefs.current = new Map();

    return Object.keys(geometry).map((key) => {
      const g = geometry[key];
      const cfg = cellConfig[key];
      const group = GROUPS[cfg.group];
      const [c, i] = key.split("-").map(Number);

      return (
        <div
          key={key}
          ref={setCellRef(key, "flight")}
          className="absolute left-0 top-0"
          style={{
            width: tile,
            height: tile,
            transform: `translate3d(${g.left}px, ${g.top}px, 0)`,
            borderRadius: 8,
            border: "1px solid transparent",
            willChange: "transform, width, height, opacity",
            zIndex: 1,
          }}
        >
          <div
            ref={setCellRef(key, "root")}
            className="absolute inset-0 overflow-hidden rounded-lg"
            style={{
              backgroundColor: BLUE.bg,
              border: `1px solid ${BLUE.border}`,
              transform: "translate3d(0,0,0) scale(1)",
              willChange: "transform, box-shadow, border-color, opacity",
              transition:
                "transform 320ms cubic-bezier(0.22,1,0.36,1), box-shadow 320ms ease, border-color 320ms ease",
            }}
          >
            <div
              className="absolute inset-0 tile-idle"
              style={{
                background: BLUE.fill,
                mixBlendMode: "screen",
                animationDelay: `${((c * 2 + i) % 9) * 0.24}s`,
              }}
            />

            <div
              ref={setCellRef(key, "hover")}
              className="absolute inset-0"
              style={{
                opacity: 0,
                transition: "opacity 200ms ease",
                willChange: "opacity, background-color, background-image",
              }}
            />

            <div
              ref={setCellRef(key, "shimmer")}
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(115deg, transparent 32%, rgba(255,255,255,0.65) 50%, transparent 68%)",
                opacity: 0,
                transform: "translateX(-30%)",
                mixBlendMode: "screen",
                transition:
                  "opacity 260ms ease, transform 460ms cubic-bezier(0.22,1,0.36,1)",
                willChange: "opacity, transform",
              }}
            />

            {/* Label — revealed only on hover */}
            <div
              ref={setCellRef(key, "label")}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                opacity: 0,
                transform: "scale(0.86)",
                transition: "opacity 220ms ease, transform 220ms ease",
                willChange: "opacity, transform",
              }}
            >
              <span
                className="font-semibold tracking-tight select-none whitespace-nowrap"
                style={{
                  fontSize: labelFontSize,
                  color: `rgb(${group.light})`,
                  textShadow: `0 0 10px rgba(${group.base},0.6)`,
                }}
              >
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Tab face — fades in as the group's leader tile lands. The same
              component as the real tab, so the hand-off is seamless. */}
          {cfg.leader && (
            <div
              ref={setCellRef(key, "chip")}
              className="absolute inset-0 select-none"
              style={{ opacity: 0 }}
            >
              <TabFace group={cfg.group} active={cfg.group === active} />
            </div>
          )}
        </div>
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tile, geometry, cellConfig, labelFontSize, active]);

  return (
    <div
      ref={hostRef}
      className="pointer-events-none absolute inset-x-0 bottom-0"
      style={{ height: gridH }}
    >
      {tiles}
    </div>
  );
}
