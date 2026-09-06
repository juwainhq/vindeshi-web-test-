import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { projects } from '../lib/content';
import { Link } from 'react-router-dom';

export function Work() {
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
      { threshold: 0.05 }
    );

    const reveals = sectionRef.current?.querySelectorAll('.reveal');
    reveals?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section id="work" ref={sectionRef} className="py-28 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section Header */}
        <div className="reveal mb-20 flex items-end justify-between">
          <div className="flex items-center gap-4">
            <span className="h-px w-12 bg-[#b86b4c]" />
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#8a8a8a]">
              Selected Work
            </span>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="space-y-20 lg:space-y-32">
          {projects.map((project, index) => (
            <article
              key={project.id}
              className={`reveal group grid gap-8 lg:grid-cols-2 lg:gap-16 ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Image */}
              <Link
                to={`/work/${project.slug}`}
                className={`block overflow-hidden ${
                  index % 2 === 1 ? 'lg:order-2' : ''
                }`}
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#e5e3df]">
                  <img
                    src={project.coverImage}
                    alt={project.title}
                    className="h-full w-full object-cover img-hover"
                  />
                </div>
              </Link>

              {/* Info */}
              <div
                className={`flex flex-col justify-center gap-4 ${
                  index % 2 === 1 ? 'lg:order-1' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#b86b4c]">
                    {project.category}
                  </span>
                  <span className="h-px w-6 bg-[#e5e3df]" />
                  <span className="text-[10px] uppercase tracking-[0.18em] text-[#8a8a8a]">
                    {project.year}
                  </span>
                </div>

                <h3 className="font-serif text-4xl font-medium tracking-tight text-[#1a1a1a] lg:text-5xl">
                  {project.title}
                </h3>

                <p className="text-sm leading-7 text-[#8a8a8a]">
                  {project.description}
                </p>

                <Link
                  to={`/work/${project.slug}`}
                  className="mt-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#1a1a1a] transition-all group-hover:gap-4"
                >
                  View project <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
