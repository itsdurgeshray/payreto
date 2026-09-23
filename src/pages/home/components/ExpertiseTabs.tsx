import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { GROUPS, GROUP_ORDER, type GroupKey } from "./solutionsData";
import { setActiveGroup, useActiveGroup } from "./heroTransition";
import { TAB_RADIUS } from "./mosaicGeometry";

// The six expertise tabs. Inactive tabs are quiet, neutral boxes; only the
// active tab carries its group colour, on an indicator that glides between
// tabs. The landing tiles in the hero mosaic render the same <TabFace>, so
// the hand-off from tile to tab is seamless.

export function TabFace({ group, active }: { group: GroupKey; active: boolean }) {
  const g = GROUPS[group];
  const Icon = g.icon;
  return (
    <span className="relative flex h-full w-full flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2.5 px-2 md:px-3">
      <span
        className={`flex shrink-0 items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-[10px] transition-colors duration-300 ${
          active ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"
        }`}
      >
        <Icon className="w-4 h-4" strokeWidth={2} />
      </span>
      <span
        className={`text-[12.5px] md:text-[14px] font-semibold tracking-tight whitespace-nowrap transition-colors duration-300 ${
          active ? "text-white" : "text-neutral-700"
        }`}
      >
        {g.name}
      </span>
    </span>
  );
}

type Indicator = { x: number; y: number; w: number; h: number } | null;

export default function ExpertiseTabs({
  compact = false,
  onSelect,
}: {
  // Compact: the slim bar that pins under the nav while reading the list.
  compact?: boolean;
  onSelect?: (key: GroupKey) => void;
}) {
  const active = useActiveGroup();
  const listRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Partial<Record<GroupKey, HTMLButtonElement | null>>>({});
  const [ind, setInd] = useState<Indicator>(null);

  // Keep the indicator glued to the active tab.
  useLayoutEffect(() => {
    const measure = () => {
      const b = btnRefs.current[active];
      if (!b) return;
      setInd({ x: b.offsetLeft, y: b.offsetTop, w: b.offsetWidth, h: b.offsetHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (listRef.current) ro.observe(listRef.current);
    return () => ro.disconnect();
  }, [active]);

  const ag = GROUPS[active];

  const select = (key: GroupKey) => {
    setActiveGroup(key);
    onSelect?.(key);
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Areas of expertise"
      className={
        compact
          ? "relative flex gap-1.5 overflow-x-auto no-scrollbar p-1.5"
          : "relative grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3"
      }
    >
      {/* Sliding active indicator */}
      {ind && (
        <span
          aria-hidden
          className="absolute left-0 top-0 transition-[transform,width,height,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: `translate3d(${ind.x}px, ${ind.y}px, 0)`,
            width: ind.w,
            height: ind.h,
            borderRadius: compact ? 999 : TAB_RADIUS,
            backgroundColor: `rgb(${ag.ink})`,
            boxShadow: `0 14px 30px -14px rgba(${ag.deep},0.85), inset 0 1px 0 rgba(255,255,255,0.22)`,
          }}
        >
          {/* Soft top sheen */}
          <span
            className="absolute inset-0"
            style={{
              borderRadius: "inherit",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 55%)",
            }}
          />
        </span>
      )}

      {GROUP_ORDER.map((key) => {
        const isActive = key === active;
        const g = GROUPS[key];
        return (
          <button
            key={key}
            ref={(el) => {
              btnRefs.current[key] = el;
            }}
            type="button"
            role="tab"
            id={compact ? undefined : `tab-${key}`}
            aria-selected={isActive}
            aria-controls="expertise-panel"
            data-tab-target={compact ? undefined : key}
            onClick={() => select(key)}
            className={`group relative cursor-pointer border transition-[background-color,border-color,box-shadow,transform] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              compact ? "h-10 shrink-0 rounded-full" : "h-[68px] md:h-14"
            } ${
              isActive
                ? "bg-transparent border-transparent"
                : "bg-white border-neutral-900/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:border-neutral-900/15 hover:shadow-[0_10px_24px_-14px_rgba(0,0,0,0.25)]"
            }`}
            style={
              {
                borderRadius: compact ? 999 : TAB_RADIUS,
                outlineColor: `rgb(${g.ink})`,
              } as CSSProperties
            }
          >
            {compact ? (
              <span
                className={`relative flex items-center gap-2 px-3.5 text-[13px] font-semibold tracking-tight whitespace-nowrap transition-colors duration-300 ${
                  isActive ? "text-white" : "text-neutral-600"
                }`}
              >
                <g.icon className="w-4 h-4" strokeWidth={2} />
                {g.name}
              </span>
            ) : (
              <TabFace group={key} active={isActive} />
            )}
          </button>
        );
      })}
    </div>
  );
}
