import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { profile } from '../lib/content';
import { TopFloralAccent } from './public/TopFloralAccent';

export function Hero() {
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
    <section
      id="top"
      ref={sectionRef}
      className="min-h-screen pt-24 lg:pt-32"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Top floral accent */}
        <div className="reveal mb-8 flex justify-center">
          <TopFloralAccent />
        </div>

        {/* Availability indicator */}
        <div className="reveal mb-16 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#b86b4c]" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C8A85]">
            {profile.availability}
          </span>
        </div>

        {/* Main hero layout */}
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Left — Name & Info */}
          <div>
            <h1 className="reveal font-serif text-6xl leading-[0.95] tracking-tight text-[#1C1C1A] sm:text-7xl lg:text-8xl">
              {profile.name}
            </h1>

            <p className="reveal animate-fade-in-delay-1 mt-6 text-lg font-medium text-[#8C8A85] sm:text-xl">
              {profile.title}
            </p>

            <hr className="reveal animate-fade-in-delay-2 my-10 divider" />

            <p className="reveal animate-fade-in-delay-2 max-w-lg text-base leading-8 text-[#1C1C1A] lg:text-lg">
              {profile.bio}
            </p>

            {/* Location */}
            <div className="reveal animate-fade-in-delay-3 mt-10 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#8C8A85]">
              <MapPin size={13} strokeWidth={1.5} />
              {profile.location}
            </div>
          </div>

          {/* Right — Profile Image */}
          <div className="reveal animate-fade-in-delay-3 relative">
            <div className="overflow-hidden">
              <img
                src={profile.profileImage}
                alt={profile.name}
                className="h-[480px] w-full object-cover object-top grayscale-[8%] lg:h-[600px] img-hover"
              />
            </div>
            {/* Accent line */}
            <div className="absolute -bottom-4 -right-4 h-32 w-32 border-r-2 border-b-2 border-[#b86b4c]" />
          </div>
        </div>
      </div>
    </section>
  );
}
