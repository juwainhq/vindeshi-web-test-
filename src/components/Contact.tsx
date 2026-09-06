import { useEffect, useRef } from 'react';
import { Instagram, Dribbble, Mail } from 'lucide-react';

export function Contact() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const reveals = sectionRef.current?.querySelectorAll('.reveal');
    reveals?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section id="contact" ref={sectionRef} className="py-28 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section Label */}
        <div className="reveal mb-20 flex items-center gap-4">
          <span className="h-px w-12 bg-[#b86b4c]" />
          <span className="text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">
            Contact
          </span>
        </div>

        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Left — Heading */}
          <div>
            <h2 className="reveal font-serif text-5xl font-medium leading-[1.05] tracking-tight text-[#1a1a1a] lg:text-7xl">
              Let's work<br />
              <em className="not-italic">together.</em>
            </h2>

            <p className="reveal mt-8 max-w-sm text-base leading-7 text-[#8a8a8a]">
              I'm currently open to select freelance projects and collaborations.
              If you have something in mind, I'd love to hear from you.
            </p>
          </div>

          {/* Right — Contact Details */}
          <div className="reveal flex flex-col justify-end gap-10">
            {/* Email */}
            <div>
              <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a]">
                Email
              </p>
              <a
                href="mailto:hello@jashrabintehaque.com"
                className="font-serif text-2xl font-medium text-[#1a1a1a] transition-opacity hover:opacity-60 lg:text-3xl"
              >
                hello@jashrabintehaque.com
              </a>
            </div>

            {/* Social */}
            <div>
              <p className="mb-4 text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a]">
                Find me on
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="https://instagram.com/jashrabintehaque"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-sm text-[#1a1a1a] transition-opacity hover:opacity-60"
                >
                  <Instagram size={16} strokeWidth={1.5} />
                  @jashrabintehaque
                </a>
                <a
                  href="https://dribbble.com/jashrabintehaque"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-sm text-[#1a1a1a] transition-opacity hover:opacity-60"
                >
                  <Dribbble size={16} strokeWidth={1.5} />
                  Dribbble
                </a>
              </div>
            </div>

            {/* Availability */}
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#b86b4c]" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a]">
                Currently available for new projects
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
