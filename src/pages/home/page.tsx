import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Solutions from "./components/Solutions";

export default function Home() {
  return (
    // overflow-x-clip (not hidden) so the sticky hero stage still pins to the
    // viewport.
    <main className="relative min-h-screen w-full bg-[#f6f5f1] font-sans overflow-x-clip">
      <Navbar />
      <Hero />
      <Solutions />
    </main>
  );
}
