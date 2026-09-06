import { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { projects, getProjectBySlug, getAdjacentProjects } from '../lib/content';

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const project = getProjectBySlug(slug || '');
  const { prev, next } = getAdjacentProjects(slug || '');
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

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F8F6]">
        <p className="text-lg text-[#8C8A85]">Project not found.</p>
      </div>
    );
  }

  return (
    <section ref={sectionRef} className="pt-32 pb-28 lg:pt-40 lg:pb-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Navigation */}
        <div className="reveal mb-12 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#1C1C1A] transition-opacity hover:opacity-60"
          >
            <ArrowLeft size={14} /> Back to work
          </Link>
          <div className="flex items-center gap-4">
            {prev && (
              <Link
                to={`/work/${prev.slug}`}
                className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#1C1C1A] transition-opacity hover:opacity-60"
              >
                Previous <ArrowRight size={14} className="rotate-180" />
              </Link>
            )}
            {next && (
              <Link
                to={`/work/${next.slug}`}
                className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#1C1C1A] transition-opacity hover:opacity-60"
              >
                Next <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>

        {/* Hero */}
        <div className="reveal mb-20 grid gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <h1 className="font-serif text-5xl font-medium leading-[1.05] tracking-tight text-[#1C1C1A] lg:text-7xl">
              {project.title}
            </h1>

            <div className="mt-6 flex items-center gap-4">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#b86b4c]">
                {project.category}
              </span>
              <span className="h-px w-6 bg-[#E6E2DA]" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#8C8A85]">
                {project.year}
              </span>
            </div>

            <p className="mt-8 text-base leading-8 text-[#8C8A85] lg:text-lg">
              {project.description}
            </p>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden bg-[#E6E2DA]">
              <img
                src={project.heroImage}
                alt={project.title}
                className="h-full w-full object-cover img-hover"
              />
            </div>
          </div>
        </div>

        {/* Project Info Grid */}
        <div className="reveal grid gap-12 border-t border-[#E6E2DA] pt-20 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h3 className="font-serif text-xl font-medium tracking-tight text-[#1C1C1A]">
              Project Info
            </h3>
          </div>

          <div className="lg:col-span-2">
            <div className="grid gap-8 lg:grid-cols-2">
              {project.info.client && (
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#8C8A85]">
                    Client
                  </p>
                  <p className="text-sm text-[#1C1C1A]">{project.info.client}</p>
                </div>
              )}
              {project.info.role && (
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#8C8A85]">
                    Role
                  </p>
                  <p className="text-sm text-[#1C1C1A]">{project.info.role}</p>
                </div>
              )}
              {project.info.timeline && (
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#8C8A85]">
                    Timeline
                  </p>
                  <p className="text-sm text-[#1C1C1A]">{project.info.timeline}</p>
                </div>
              )}
              {project.info.deliverables && (
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#8C8A85]">
                    Deliverables
                  </p>
                  <p className="text-sm text-[#1C1C1A]">{project.info.deliverables}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Process */}
        <div className="reveal mt-20 grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h3 className="font-serif text-xl font-medium tracking-tight text-[#1C1C1A]">
              Process
            </h3>
          </div>
          <div className="lg:col-span-2">
            <p className="text-base leading-8 text-[#8C8A85]">{project.process}</p>
          </div>
        </div>

        {/* Result */}
        <div className="reveal mt-20 grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <h3 className="font-serif text-xl font-medium tracking-tight text-[#1C1C1A]">
              Result
            </h3>
          </div>
          <div className="lg:col-span-2">
            <p className="text-base leading-8 text-[#8C8A85]">{project.result}</p>
          </div>
        </div>

        {/* Additional Images */}
        {project.images.length > 1 && (
          <div className="reveal mt-32 grid gap-8 lg:grid-cols-2">
            {project.images.slice(1).map((image, index) => (
              <div key={index} className="aspect-[4/3] overflow-hidden bg-[#E6E2DA]">
                <img
                  src={image}
                  alt={`${project.title} detail ${index + 2}`}
                  className="h-full w-full object-cover img-hover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="reveal mt-32 flex items-center justify-between border-t border-[#E6E2DA] pt-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#1C1C1A] transition-opacity hover:opacity-60"
          >
            <ArrowLeft size={14} /> Back to work
          </Link>
          <div className="flex items-center gap-8">
            {prev && (
              <Link
                to={`/work/${prev.slug}`}
                className="group flex items-center gap-3"
              >
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-[#1C1C1A] transition-opacity group-hover:opacity-60">
                  Previous
                </span>
                <div className="h-px w-12 bg-[#E6E2DA] transition-all group-hover:w-16" />
                <ArrowRight size={14} className="rotate-180" />
              </Link>
            )}
            {next && (
              <Link
                to={`/work/${next.slug}`}
                className="group flex items-center gap-3"
              >
                <ArrowRight size={14} />
                <div className="h-px w-12 bg-[#E6E2DA] transition-all group-hover:w-16" />
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-[#1C1C1A] transition-opacity group-hover:opacity-60">
                  Next
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}