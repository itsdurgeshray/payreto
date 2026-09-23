import { useRef, useState } from "react";
import { useActiveGroup } from "./heroTransition";
import { GROUPS, ITEMS, type Group, type GroupKey, type Item } from "./solutionsData";

// Body of the expertise card, under the tabs. Left: the category's intro and
// its products as a list of rows. Right: a showcase graphic for the selected
// product, a floating UI card on the group's gradient.

const elementNumber = (item: Item) => ITEMS.indexOf(item) + 1;

// Ghost card peeking in from the edge of the showcase.
function GhostCard({ item, side }: { item: Item; side: "left" | "right" }) {
  return (
    <div
      aria-hidden
      className={`absolute top-[36%] hidden md:block w-[34%] rounded-2xl border border-white/30 bg-white/15 backdrop-blur-sm p-4 text-white ${
        side === "left" ? "-left-[22%]" : "-right-[22%]"
      }`}
    >
      <p className={`text-[13px] font-semibold truncate ${side === "left" ? "text-right" : ""}`}>
        {item.title}
      </p>
      <div className={`mt-3 flex gap-2 ${side === "left" ? "justify-end" : ""}`}>
        <span className="h-2 w-16 rounded-full bg-white/40" />
        <span className="h-2 w-8 rounded-full bg-white/25" />
      </div>
    </div>
  );
}

// Showcase for the selected product. A real photo (item.image) replaces the
// generated composition when provided.
function ProductShowcase({ item, group }: { item: Item; group: Group }) {
  const Icon = item.icon;
  const siblings = ITEMS.filter((i) => i.group === item.group && i !== item);
  const prev = siblings[0];
  const next = siblings[1] ?? siblings[0];

  return (
    <div
      className="visual-in relative h-[440px] md:h-[520px] overflow-hidden rounded-2xl"
      style={{
        background: `linear-gradient(180deg, rgba(${group.light},0.55) 0%, rgb(${group.base}) 42%, rgb(${group.deep}) 100%)`,
      }}
    >
      {item.image ? (
        <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <>
          {prev && <GhostCard item={prev} side="left" />}
          {next && next !== prev && <GhostCard item={next} side="right" />}

          {/* Main UI card */}
          <div className="absolute left-1/2 top-[46%] w-[78%] max-w-[440px] -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-[22px] border border-white/50 bg-white/25 p-2 backdrop-blur-md shadow-[0_40px_80px_-40px_rgba(0,0,0,0.55)]">
              <div className="rounded-2xl bg-white p-5 md:p-6 pb-14 md:pb-16">
                <p className="text-lg md:text-xl font-semibold tracking-tight text-neutral-900">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[14px] text-neutral-400">{group.name} operations</p>

                <div className="mt-5 flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="text-neutral-500">Managed by</span>
                  <span className="rounded-md bg-neutral-100 px-2 py-1 font-medium text-neutral-800">
                    Payreto specialists
                  </span>
                  <span className="text-neutral-500">for</span>
                  <span className="rounded-md bg-neutral-100 px-2 py-1 font-medium text-neutral-800">
                    your team
                  </span>
                </div>
              </div>
            </div>

            {/* Tilted element chip, overlapping the card's lower edge */}
            <div className="absolute left-[12%] -bottom-8 md:-bottom-9 w-[76%] -rotate-[5deg]">
              <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/85 p-3 backdrop-blur shadow-[0_24px_40px_-20px_rgba(0,0,0,0.5)]">
                <span
                  className="relative flex w-11 h-11 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: `rgb(${group.ink})` }}
                >
                  <span className="absolute left-1 top-0.5 text-[8px] font-semibold text-white/70 tabular-nums">
                    {elementNumber(item)}
                  </span>
                  <span className="text-[14px] font-bold tracking-tight">{item.code}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-neutral-900">
                    Element {elementNumber(item)}
                  </p>
                  <p className="truncate text-[12px] text-neutral-500">{group.name}</p>
                </div>
                <span
                  className="flex w-8 h-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: `rgba(${group.base},0.18)`, color: `rgb(${group.ink})` }}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                </span>
              </div>
            </div>
          </div>

          {/* Description, bottom-left */}
          <p className="absolute inset-x-5 md:inset-x-6 bottom-5 md:bottom-6 max-w-md text-[14px] font-normal leading-relaxed text-white/90">
            {item.description}
          </p>
        </>
      )}
    </div>
  );
}

// A product row in the left list.
function ProductRow({
  item,
  group,
  selected,
  onSelect,
}: {
  item: Item;
  group: Group;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-controls="product-visual"
      onClick={onSelect}
      className="group flex w-full items-center gap-4 border-b border-neutral-900/[0.08] py-3.5 text-left cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm"
      style={{ outlineColor: `rgb(${group.ink})` }}
    >
      <span
        className={`flex w-9 h-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${
          selected ? "text-white" : "bg-neutral-100 text-neutral-500 group-hover:text-neutral-800"
        }`}
        style={selected ? { backgroundColor: `rgb(${group.ink})` } : undefined}
      >
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.9} />
      </span>
      <span
        className={`flex-1 text-[15px] tracking-tight transition-colors duration-300 ${
          selected
            ? "font-semibold text-neutral-900"
            : "font-medium text-neutral-600 group-hover:text-neutral-900"
        }`}
      >
        {item.title}
      </span>
      <i
        className={`ri-arrow-right-line text-lg transition-[transform,color] duration-300 ${
          selected ? "translate-x-0" : "-translate-x-1 text-neutral-400 group-hover:translate-x-0"
        }`}
        style={selected ? { color: `rgb(${group.ink})` } : undefined}
      />
    </button>
  );
}

export default function ExpertiseDetail() {
  const active = useActiveGroup();
  // Selected product per category, remembered while switching tabs.
  const [selected, setSelected] = useState<Partial<Record<GroupKey, string>>>({});
  const visualRef = useRef<HTMLDivElement>(null);

  const group = GROUPS[active];
  const items = ITEMS.filter((it) => it.group === active);
  const current = items.find((it) => it.code === selected[active]) ?? items[0];

  const selectProduct = (item: Item) => {
    setSelected((s) => ({ ...s, [item.group]: item.code }));
    // Stacked layout: the showcase sits above the list, so bring it into view.
    const visual = visualRef.current;
    if (visual && window.innerWidth < 1024) {
      const top = visual.getBoundingClientRect().top + window.scrollY - 150;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div
      id="expertise-panel"
      role="tabpanel"
      aria-labelledby={`tab-${active}`}
      className="grid gap-6 lg:gap-10 p-4 md:p-6 lg:p-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start text-left"
    >
      {/* Left, category intro + products */}
      <div key={active} className="sol-in order-2 lg:order-none lg:pt-2">
        <h3 className="text-2xl md:text-[28px] font-semibold tracking-tight text-neutral-900">
          {group.name}
        </h3>
        <p className="mt-3 max-w-md text-[14px] font-normal leading-relaxed text-neutral-600">
          {group.blurb}
        </p>
        <a
          href="#"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-neutral-700"
        >
          View {group.name} overview
        </a>

        <div className="mt-6 border-t border-neutral-900/[0.08]">
          {items.map((item, i) => (
            <div key={item.code} className="sol-in" style={{ animationDelay: `${60 + i * 35}ms` }}>
              <ProductRow
                item={item}
                group={group}
                selected={item === current}
                onSelect={() => selectProduct(item)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right, showcase for the selected product (stays in view while a
          long list scrolls past on desktop) */}
      <div
        ref={visualRef}
        id="product-visual"
        aria-live="polite"
        className="order-1 lg:order-none lg:sticky lg:top-[120px]"
      >
        <ProductShowcase key={`${current.group}-${current.code}`} item={current} group={group} />
      </div>
    </div>
  );
}
