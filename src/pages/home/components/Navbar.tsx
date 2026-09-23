import { useState, useSyncExternalStore } from "react";
import { heroTransition, onHeroProgress } from "./heroTransition";

const navItems = ["Services", "Why Payreto", "Resources", "Careers"];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  // Switch to the light treatment once the hero has washed to light.
  const light = useSyncExternalStore(onHeroProgress, () => heroTransition.p > 0.45);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full px-4 md:px-6 pt-4 md:pt-6">
      <nav className={`relative mx-auto w-full max-w-6xl flex items-center justify-between gap-4 rounded-full border px-3 md:px-4 py-2.5 overflow-hidden backdrop-blur-xl transition-colors duration-500 ${
          light
            ? "border-neutral-900/10 bg-white/70 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)]"
            : "border-white/15 bg-white/[0.07]"
        }`}>
        {/* Frosted glass gradient + top hairline highlight */}
        <span className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.14] via-white/[0.05] to-white/[0.02] transition-opacity duration-500 ${light ? "opacity-0" : ""}`} />
        <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        <span className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Logo — text wordmark */}
        <a href="#" className="relative flex items-center pl-3 shrink-0 cursor-pointer">
          <span className={`text-[19px] font-bold tracking-tight transition-colors duration-500 ${light ? "text-neutral-900" : "text-white"}`}>
            Payreto
          </span>
        </a>

        {/* Desktop links */}
        <div className="relative hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item}
              href="#"
              className={`px-4 py-2 text-sm rounded-full transition-colors whitespace-nowrap cursor-pointer ${
                light
                  ? "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-900/5"
                  : "text-neutral-200 hover:text-white hover:bg-white/10"
              }`}
            >
              {item}
            </a>
          ))}
        </div>

        {/* CTA + mobile toggle */}
        <div className="relative flex items-center gap-2">
          <span className={`pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2 hidden sm:block w-32 h-16 rounded-full bg-[#3b82f6]/35 blur-2xl transition-opacity duration-500 ${light ? "opacity-0" : ""}`} />
          <a
            href="#"
            className={`relative hidden sm:inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full whitespace-nowrap cursor-pointer transition-colors ${
              light
                ? "bg-neutral-900 text-white hover:bg-neutral-700"
                : "bg-white text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            Contact Us
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className={`relative md:hidden w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              light ? "text-neutral-900 hover:bg-neutral-900/5" : "text-white hover:bg-white/10"
            }`}
          >
            <i className={open ? "ri-close-line text-xl" : "ri-menu-line text-xl"}></i>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden mx-auto w-full max-w-6xl mt-2 rounded-2xl border border-white/15 bg-neutral-950/70 backdrop-blur-xl p-3">
          <div className="flex flex-col">
            {navItems.map((item) => (
              <a
                key={item}
                href="#"
                onClick={() => setOpen(false)}
                className="px-4 py-3 text-sm text-neutral-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
              >
                {item}
              </a>
            ))}
            <a
              href="#"
              onClick={() => setOpen(false)}
              className="mt-1 mx-1 text-center bg-white text-neutral-900 text-sm font-semibold px-5 py-3 rounded-full whitespace-nowrap cursor-pointer hover:bg-neutral-100 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      )}
    </header>
  );
}