import { useEffect, useState } from "react";
import ExpertiseTabs from "./ExpertiseTabs";
import { useHeroMode } from "./heroTransition";

// Below the expertise card (which lives in the hero stage, where the tiles
// land): a compact copy of the tabs that pins under the nav once the card's
// own tab strip has scrolled away, plus the page's closing space.

export default function Solutions() {
  const mode = useHeroMode();
  const [pinned, setPinned] = useState(false);

  const shown = mode === "expertise" || mode === "leaving";

  // Pin the compact tabs once the card's tab strip has scrolled away.
  useEffect(() => {
    if (!shown) {
      setPinned(false);
      return;
    }
    const tabs = document.getElementById("expertise-tabs");
    if (!tabs) return;
    const io = new IntersectionObserver(
      ([entry]) => setPinned(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { rootMargin: "-80px 0px 0px 0px" }
    );
    io.observe(tabs);
    return () => io.disconnect();
  }, [shown]);

  // Switching from the pinned bar brings the card's content into view.
  const revealPanel = () => {
    const panel = document.getElementById("expertise-panel");
    if (!panel) return;
    const top = panel.getBoundingClientRect().top + window.scrollY - 150;
    if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <>
      {/* Compact pinned tabs */}
      <div
        className={`fixed left-1/2 top-[84px] md:top-[92px] z-40 w-[calc(100%-32px)] max-w-fit -translate-x-1/2 transition-[opacity,transform] duration-300 ${
          pinned
            ? "opacity-100 translate-y-0"
            : "pointer-events-none opacity-0 -translate-y-2"
        }`}
        aria-hidden={!pinned || undefined}
      >
        <div className="rounded-full border border-neutral-900/[0.08] bg-white/80 backdrop-blur-xl shadow-[0_12px_32px_-16px_rgba(0,0,0,0.3)]">
          <ExpertiseTabs compact onSelect={revealPanel} />
        </div>
      </div>

      <section
        id="solutions"
        aria-hidden
        className="bg-[#f6f5f1] h-24 md:h-32"
        style={{ display: shown ? "block" : "none" }}
      />
    </>
  );
}
