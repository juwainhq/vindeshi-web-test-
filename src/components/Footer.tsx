import { Instagram, Dribbble, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-[#E6E2DA] bg-[#F9F8F6]">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
        <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
          {/* Left */}
          <div>
            <p className="font-serif text-4xl font-medium tracking-tight text-[#1C1C1A] lg:text-5xl">
              Jashra Binte Haque
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#8C8A85]">
              Designer & Art Director
            </p>
          </div>

          {/* Right — Social Links */}
          <div className="flex items-center gap-6">
            <a
              href="mailto:hello@jashrabintehaque.com"
              aria-label="Email"
              className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[#1C1C1A] transition-opacity hover:opacity-60"
            >
              <Mail size={16} strokeWidth={1.5} />
              Email
            </a>
            <a
              href="https://instagram.com/jashrabintehaque"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[#1C1C1A] transition-opacity hover:opacity-60"
            >
              <Instagram size={16} strokeWidth={1.5} />
              Instagram
            </a>
            <a
              href="https://dribbble.com/jashrabintehaque"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Dribbble"
              className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[#1C1C1A] transition-opacity hover:opacity-60"
            >
              <Dribbble size={16} strokeWidth={1.5} />
              Dribbble
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 flex flex-col justify-between gap-3 border-t border-[#E6E2DA] pt-8 text-[10px] uppercase tracking-[0.12em] text-[#8C8A85] sm:flex-row">
          <span>© {new Date().getFullYear()} Jashra Binte Haque</span>
          <span>Designed & built with intention</span>
        </div>
      </div>
    </footer>
  );
}