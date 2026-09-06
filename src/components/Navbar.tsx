import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-[#f8f6f2]/95 backdrop-blur-md border-b border-[#e5e3df]' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-12">
        {/* Logo / Name */}
        <a
          href="#top"
          className="font-serif text-lg font-medium tracking-tight text-[#1a1a1a] transition-opacity hover:opacity-70"
        >
          Jashra Binte Haque
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-10 text-[11px] font-medium uppercase tracking-[0.18em] text-[#1a1a1a] lg:flex">
          <a href="#work" className="link-underline transition-opacity hover:opacity-60">
            Work
          </a>
          <a href="#about" className="link-underline transition-opacity hover:opacity-60">
            About
          </a>
          <a href="#contact" className="link-underline transition-opacity hover:opacity-60">
            Contact
          </a>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-full p-2 transition hover:bg-black/5 lg:hidden"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <nav className="border-t border-[#e5e3df] bg-[#f8f6f2] px-6 py-6 lg:hidden">
          <div className="flex flex-col gap-5">
            <a
              href="#work"
              onClick={() => setMenuOpen(false)}
              className="text-xs font-medium uppercase tracking-[0.18em] text-[#1a1a1a]"
            >
              Work
            </a>
            <a
              href="#about"
              onClick={() => setMenuOpen(false)}
              className="text-xs font-medium uppercase tracking-[0.18em] text-[#1a1a1a]"
            >
              About
            </a>
            <a
              href="#contact"
              onClick={() => setMenuOpen(false)}
              className="text-xs font-medium uppercase tracking-[0.18em] text-[#1a1a1a]"
            >
              Contact
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
