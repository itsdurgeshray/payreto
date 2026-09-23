import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import HeroMosaic from "./HeroMosaic";
import { mosaicMetrics } from "./mosaicGeometry";
import HeroShader from "./HeroShader";
import ExpertiseTabs from "./ExpertiseTabs";
import ExpertiseDetail from "./ExpertiseDetail";
import {
  easeInOutCubic,
  heroTransition,
  onHeroProgress,
  playForward,
  playReverse,
  smoothstep,
  useHeroMode,
} from "./heroTransition";

// Space reserved at the top for the fixed, floating navbar.
const NAV_CLEARANCE = 96;
// Breathing room between the copy and the tiles.
const COPY_MARGIN = 20;
// Widest the copy ever gets (matches max-w-4xl).
const COPY_MAX_W = 896;
// Desktop: the headline is set as two fixed lines at 64px.
const DESKTOP_MIN_W = 1024;
const DESKTOP_COPY_MAX_W = 1100;

type CopyProps = {
  width: number;
  // Explicit headline size for the small-screen valley layout; otherwise
  // the responsive Tailwind sizes apply.
  h1Size?: number;
  hidden?: boolean;
  onCta?: () => void;
};

function HeroCopy({ width, h1Size, hidden, onCta }: CopyProps) {
  return (
    <div
      className="flex flex-col items-center text-center"
      style={{ width }}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      <h1
        data-roll-out
        className={`font-serif font-normal leading-[1.06] tracking-tight text-white ${
          h1Size ? "" : "text-[2.5rem] md:text-[4rem]"
        }`}
        style={h1Size ? { fontSize: h1Size } : undefined}
      >
        {/* Two fixed lines on desktop; free wrapping on smaller screens. */}
        <span className="block lg:whitespace-nowrap">Trusted Turnkey Partner In</span>{" "}
        <span className="block lg:whitespace-nowrap text-[#4d8dff]">
          <span data-line2>Financial Services, Tech &amp; Operations</span>
        </span>
      </h1>

      <p
        data-roll-out
        className="mt-5 md:mt-6 max-w-xl text-[14px] font-normal leading-relaxed text-neutral-400"
      >
        Payreto helps scale complex operations through specialised teams and
        tech-enabled solutions across payments, onboarding, finance, contact,
        data, and talent.
      </p>

      <a
        data-roll-out
        href="#solutions"
        onClick={(e) => {
          e.preventDefault();
          onCta?.();
        }}
        tabIndex={hidden ? -1 : undefined}
        className="group relative mt-9 md:mt-11 inline-flex items-center gap-3 pl-8 pr-2.5 py-2.5 rounded-full text-white overflow-hidden whitespace-nowrap cursor-pointer shadow-[0_14px_44px_-12px_rgba(59,130,246,0.75)] transition-transform duration-300 hover:-translate-y-0.5"
      >
        {/* Gradient base */}
        <span className="absolute inset-0 bg-gradient-to-r from-[#2563eb] via-[#3b82f6] to-[#2563eb] transition-[filter] duration-300 group-hover:brightness-110" />
        {/* Shine sweep */}
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-out bg-gradient-to-r from-transparent via-white/35 to-transparent" />
        {/* Hairline edge */}
        <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/20" />

        <span className="relative z-10 text-[15px] font-semibold tracking-tight">
          Discover Our Solutions
        </span>
        <span className="relative z-10 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center transition-colors duration-300 group-hover:bg-white group-hover:text-[#2563eb]">
          <i className="ri-arrow-right-line text-xl"></i>
        </span>
      </a>
    </div>
  );
}

// Turns scroll/touch/key intent into the timed transition. While it plays,
// input is swallowed, so the in-between frames can't be scrubbed or held.
function useTransitionTriggers() {
  useEffect(() => {
    let lastWheel = 0;
    // After a transition, keep swallowing the same wheel gesture (trackpad
    // momentum) until it pauses, so it doesn't spill into the page.
    let gestureLock = false;
    let atTopSince = window.scrollY <= 0 ? performance.now() : 0;
    let touchY: number | null = null;

    const busy = () => {
      const m = heroTransition.mode;
      return m === "toExpertise" || m === "leaving" || m === "toHero";
    };
    const run = (fn: () => Promise<void>) => {
      gestureLock = true;
      void fn();
    };
    const canReverse = () =>
      heroTransition.mode === "expertise" &&
      window.scrollY <= 0 &&
      performance.now() - atTopSince > 300;

    const onScroll = () => {
      if (window.scrollY > 0) atTopSince = 0;
      else if (!atTopSince) atTopSince = performance.now();
    };

    const onWheel = (e: WheelEvent) => {
      const now = performance.now();
      const gap = now - lastWheel;
      lastWheel = now;
      if (gestureLock) {
        if (gap < 180 || busy()) {
          e.preventDefault();
          return;
        }
        gestureLock = false;
      }
      if (busy()) {
        e.preventDefault();
        return;
      }
      if (heroTransition.mode === "hero") {
        e.preventDefault();
        if (e.deltaY > 2) run(playForward);
        return;
      }
      if (e.deltaY < -2 && canReverse() && (gap > 150 || e.deltaY <= -40)) {
        e.preventDefault();
        run(playReverse);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (busy()) {
        e.preventDefault();
        return;
      }
      const y = e.touches[0]?.clientY;
      if (touchY === null || y === undefined) return;
      if (heroTransition.mode === "hero") {
        e.preventDefault();
        if (touchY - y > 24) {
          touchY = null;
          run(playForward);
        }
      } else if (heroTransition.mode === "expertise" && window.scrollY <= 0 && y - touchY > 50) {
        e.preventDefault();
        touchY = null;
        run(playReverse);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable]")) return;
      if (busy()) {
        if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"].includes(e.key))
          e.preventDefault();
        return;
      }
      if (
        heroTransition.mode === "hero" &&
        ["ArrowDown", "PageDown", " ", "End"].includes(e.key)
      ) {
        e.preventDefault();
        void playForward();
      } else if (
        heroTransition.mode === "expertise" &&
        window.scrollY <= 0 &&
        ["ArrowUp", "PageUp", "Home"].includes(e.key)
      ) {
        e.preventDefault();
        void playReverse();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
}

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const raysRef = useRef<HTMLDivElement>(null);
  const washRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const wideRef = useRef<HTMLDivElement>(null);
  const narrowRef = useRef<HTMLDivElement>(null);
  const mode = useHeroMode();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [copyH, setCopyH] = useState({
    wide: 0,
    narrow: 0,
    // Desktop placement needs the parts of the wide copy separately.
    h1H: 0,
    pBottom: 0,
    line2W: 0,
    pW: 0,
  });

  useTransitionTriggers();

  // The hero always lays out against the viewport (the stage collapses to
  // the expertise header once the transition completes), and tracks the
  // natural height of the copy in both layouts, measured off-screen.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const wide = wideRef.current;
    const narrow = narrowRef.current;
    if (!section || !wide || !narrow) return;
    const update = () => {
      setSize({ w: section.clientWidth, h: window.innerHeight });
      const h1 = wide.querySelector("h1");
      const para = wide.querySelector("p");
      const line2 = wide.querySelector<HTMLElement>("[data-line2]");
      setCopyH({
        wide: wide.offsetHeight,
        narrow: narrow.offsetHeight,
        h1H: h1?.offsetHeight ?? 0,
        pBottom: para ? para.offsetTop + para.offsetHeight : 0,
        line2W: line2?.offsetWidth ?? 0,
        pW: para?.offsetWidth ?? 0,
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(section);
    ro.observe(wide);
    ro.observe(narrow);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const { tile, gap, gridH, floorH, valleyW, innerW, midH } = mosaicMetrics(size.w);

  const desktop = size.w >= DESKTOP_MIN_W;
  const wideW = Math.max(
    0,
    Math.min(desktop ? DESKTOP_COPY_MAX_W : COPY_MAX_W, size.w - 48)
  );
  const narrowW = Math.max(0, valleyW - 2 * COPY_MARGIN);
  // Type stays at its fixed H1 size on tablet/desktop (64px). Only on small
  // landscape phones is the headline derived from the valley width.
  const h1Size =
    size.w < 768 ? Math.round(Math.min(40, Math.max(24, narrowW * 0.085))) : undefined;

  // Placement.
  let useWide: boolean;
  let copyTop: number;
  let scale = 1;
  const valleyTop = size.h - floorH - gap - COPY_MARGIN;

  if (desktop) {
    // Desktop: always the two-line headline. Each part of the copy may sink
    // into the mosaic only as far as the gap around it is wide enough:
    //  · the headline, between the tallest edge columns (or above the band);
    //  · the paragraph, into the valley if it fits, else above the mid ones;
    //  · the button, down to the valley floor.
    // Within those limits it sits centred between the nav and the floor.
    useWide = true;
    const midTop = size.h - midH;
    const h1Limit =
      (copyH.line2W + 2 * COPY_MARGIN <= innerW ? midTop : size.h - gridH) - COPY_MARGIN;
    const pLimit = (copyH.pW + 2 * COPY_MARGIN <= valleyW ? valleyTop + COPY_MARGIN : midTop) - COPY_MARGIN;
    const centred = NAV_CLEARANCE + (valleyTop - NAV_CLEARANCE - copyH.wide) / 2;
    copyTop = Math.min(
      centred,
      h1Limit - copyH.h1H,
      pLimit - copyH.pBottom,
      valleyTop - copyH.wide
    );
    if (copyTop < NAV_CLEARANCE && copyH.wide > 0) {
      // Very short screens only: shrink just enough to respect every limit.
      const room = (limit: number, h: number) => (h > 0 ? (limit - NAV_CLEARANCE) / h : 1);
      scale = Math.max(
        0.5,
        Math.min(1, room(h1Limit, copyH.h1H), room(pLimit, copyH.pBottom), room(valleyTop, copyH.wide))
      );
      copyTop = NAV_CLEARANCE;
    }
  } else {
    // Tablet / phone: prefer the copy above the whole mosaic; otherwise drop
    // it into the valley, narrowed to the valley width, scaling if needed.
    const aboveBottom = size.h - gridH - COPY_MARGIN;
    useWide = aboveBottom - NAV_CLEARANCE >= copyH.wide;
    const floor = useWide ? aboveBottom : valleyTop;
    const natural = useWide ? copyH.wide : copyH.narrow;
    const available = floor - NAV_CLEARANCE;
    scale = natural > 0 && available > 0 ? Math.min(1, available / natural) : 1;
    copyTop = NAV_CLEARANCE + Math.max(0, (available - natural * scale) / 2);
  }

  const copyMounted = tile > 0;

  // Choreography, driven by the timed progress p (0 → 1):
  //  · the hero copy rolls out and the rays dim
  //  · a light wash rises from the tiles and floods the stage (0.02 → 0.78)
  //  · from its half-way point the tiles ignite and fly, landing as the
  //    wash completes (HeroMosaic)
  //  · the expertise heading rolls in, line by line
  //  · the real tabs take over from the landed tiles
  useEffect(
    () =>
      onHeroProgress((p) => {
        const section = sectionRef.current;
        if (washRef.current && section) {
          const r =
            easeInOutCubic(smoothstep(0.02, 0.78, p)) *
            Math.hypot(section.clientWidth, window.innerHeight) *
            1.4;
          // Feathered edge, so the light blooms in rather than wiping.
          const feather = Math.max(1, r * 0.35);
          const mask = `radial-gradient(circle at 50% 100%, #000 ${Math.max(0, r - feather)}px, transparent ${r}px)`;
          washRef.current.style.maskImage = mask;
          washRef.current.style.webkitMaskImage = mask;
        }
        if (raysRef.current) {
          raysRef.current.style.opacity = `${1 - smoothstep(0.02, 0.36, p)}`;
        }
        if (copyRef.current) {
          copyRef.current
            .querySelectorAll<HTMLElement>("[data-roll-out]")
            .forEach((el, i) => {
              const k = smoothstep(0.02 + i * 0.05, 0.26 + i * 0.05, p);
              el.style.opacity = `${1 - k}`;
              el.style.transform = `translateY(${-32 * k}px)`;
              el.style.filter = k > 0 ? `blur(${6 * k}px)` : "";
            });
          copyRef.current.style.visibility = p >= 0.4 ? "hidden" : "visible";
        }
        if (headerRef.current) {
          headerRef.current
            .querySelectorAll<HTMLElement>("[data-roll-in]")
            .forEach((el, i) => {
              const k = easeInOutCubic(smoothstep(0.52 + i * 0.06, 0.82 + i * 0.06, p));
              el.style.opacity = `${k}`;
              el.style.transform = `translateY(${36 * (1 - k)}px)`;
              el.style.filter = k < 1 ? `blur(${8 * (1 - k)}px)` : "";
            });
        }
        if (tabsRef.current) {
          const k = smoothstep(0.75, 0.82, p);
          tabsRef.current.style.opacity = `${k}`;
          tabsRef.current.style.visibility = k > 0 ? "visible" : "hidden";
        }
      }),
    // Re-apply once the copy has mounted (it waits for the first measure).
    [copyMounted]
  );

  const measurer: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    visibility: "hidden",
    pointerEvents: "none",
  };

  // Full-viewport stage for the hero and the flight; once settled it
  // collapses to the expertise header so the list follows directly.
  const settled = mode === "expertise" || mode === "leaving";

  return (
    <section
      ref={sectionRef}
      className={`relative w-full overflow-clip ${settled ? "bg-[#f6f5f1]" : "bg-neutral-950"}`}
      style={{ height: settled ? "auto" : size.h || "100vh" }}
    >
      {/* Shader light rays fill the stage behind the copy, they start at the
          very top, so they glow behind the transparent nav too, and recolour
          to whichever tile group is hovered. */}
      <div ref={raysRef} className="absolute inset-0 pointer-events-none">
        <HeroShader />
      </div>

      {/* Light wash, rises out of the mosaic and floods the stage. */}
      <div
        ref={washRef}
        className="absolute inset-0 bg-[#f6f5f1] pointer-events-none"
        style={{ maskImage: "radial-gradient(circle, transparent 0, transparent 0)" }}
      />

      {/* Off-screen measurers for both copy layouts. */}
      <div ref={wideRef} style={measurer}>
        <HeroCopy width={wideW} hidden />
      </div>
      <div ref={narrowRef} style={measurer}>
        <HeroCopy width={narrowW} h1Size={h1Size} hidden />
      </div>

      {tile > 0 && (
        <div
          ref={copyRef}
          className="absolute inset-x-0 z-10 flex justify-center"
          style={{ top: copyTop }}
        >
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}>
            {useWide ? (
              <HeroCopy width={wideW} onCta={playForward} />
            ) : (
              <HeroCopy width={narrowW} h1Size={h1Size} onCta={playForward} />
            )}
          </div>
        </div>
      )}

      {/* Bottom mosaic: 39 square tiles, full-bleed, pinned to the bottom.
          On transition they fly up and become the expertise tabs. */}
      <HeroMosaic />

      {/* Expertise header, in flow, so the stage collapses to it once the
          transition settles. */}
      <div
        ref={headerRef}
        className="relative z-20 w-full px-4 md:px-6 pt-[132px] md:pt-[176px] pb-8 md:pb-10"
        style={{ pointerEvents: settled ? "auto" : "none" }}
        aria-hidden={mode === "hero" || undefined}
      >
        <div className="mx-auto w-full max-w-6xl text-center">
          <p
            data-roll-in
            className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500"
            style={{ opacity: 0 }}
          >
            Areas of expertise
          </p>
          <h2
            data-roll-in
            className="mt-4 font-serif text-[2rem] md:text-[3rem] leading-[1.08] tracking-tight text-neutral-900"
            style={{ opacity: 0 }}
          >
            Our Expertise Embedded in{" "}
            <span className="text-[#2563eb]">Banking Operations</span>
          </h2>
          <p
            data-roll-in
            className="mx-auto mt-5 md:mt-6 max-w-2xl text-[14px] font-normal leading-relaxed text-neutral-600"
            style={{ opacity: 0 }}
          >
            Discover our consolidated areas of expertise through the{" "}
            Periodic Table of Operational Excellence{" "}
            by clicking each box.
          </p>

          {/* The expertise card, tab strip and product detail as one
              component. It forms around the tiles as they land on the tabs. */}
          <div
            ref={tabsRef}
            className="mx-auto mt-9 md:mt-12 w-full max-w-6xl overflow-clip rounded-[28px] border border-neutral-900/[0.07] bg-white shadow-[0_30px_80px_-48px_rgba(0,0,0,0.35)]"
            style={{ opacity: 0, visibility: "hidden" }}
          >
            <div id="expertise-tabs" className="p-3 md:p-4 pb-0 md:pb-0">
              <ExpertiseTabs />
            </div>
            <ExpertiseDetail />
          </div>
        </div>
      </div>
    </section>
  );
}
