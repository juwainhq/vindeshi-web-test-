import { useEffect, useRef } from 'react';
import { profile } from '../lib/content';

export function About() {
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
    <section id="about" ref={sectionRef} className="py-28 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section Label */}
        <div className="reveal mb-20 flex items-center gap-4">
          <span className="h-px w-12 bg-[#b86b4c]" />
          <span className="text-[10px] uppercase tracking-[0.28em] text-[#8C8A85]">
            About
          </span>
        </div>

        <div className="grid gap-20 lg:grid-cols-12 lg:gap-24">
          {/* Skills */}
          <div className="lg:col-span-4">
            <h3 className="reveal font-serif text-3xl font-medium tracking-tight text-[#1C1C1A] lg:text-4xl">
              Craft & Expertise
            </h3>

            <div className="reveal mt-10 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="border border-[#E6E2DA] px-4 py-2 text-xs text-[#1C1C1A]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="lg:col-span-8">
            <h3 className="reveal font-serif text-3xl font-medium tracking-tight text-[#1C1C1A] lg:text-4xl">
              Experience
            </h3>

            <div className="reveal mt-10 space-y-0">
              {profile.experience.map((exp, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1 border-t border-[#E6E2DA] py-8 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <p className="text-base font-medium text-[#1C1C1A]">{exp.role}</p>
                    <p className="mt-1 text-sm text-[#8C8A85]">{exp.company}</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.12em] text-[#8C8A85] sm:mt-1">
                    {exp.period}
                  </span>
                </div>
              ))}
              <div className="h-px border-t border-[#E6E2DA] pt-8" />
            </div>

            {/* Email CTA */}
            <div className="reveal mt-12">
              <p className="text-sm leading-7 text-[#8C8A85]">
                Interested in working together?{' '}
                <a
                  href="mailto:hello@jashrabintehaque.com"
                  className="border-b border-[#b86b4c] pb-0.5 text-[#b86b4c] transition-opacity hover:opacity-70"
                >
                  Get in touch
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
