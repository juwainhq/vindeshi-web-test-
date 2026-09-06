import type { Profile, Project } from './types';

export const profile: Profile = {
  name: 'Jashra Binte Haque',
  title: 'Designer & Art Director',
  location: 'Dhaka, Bangladesh',
  bio: 'I craft thoughtful digital experiences with a strong editorial eye. With over 8 years of experience working with studios and independent clients, I specialize in brand identity, web design, and visual systems that age beautifully.',
  email: 'hello@jashrabintehaque.com',
  instagram: '@jashrabintehaque',
  dribbble: 'jashrabintehaque',
  availability: 'Open to new work',
  profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
  skills: [
    'Brand Identity',
    'Art Direction',
    'Web Design',
    'Typography',
    'Visual Systems',
    'Editorial Design',
  ],
  experience: [
    {
      role: 'Senior Designer',
      company: 'Studio North',
      period: '2021 – Present',
    },
    {
      role: 'Designer',
      company: 'Atelier Studio',
      period: '2019 – 2021',
    },
    {
      role: 'Freelance Designer',
      company: 'Independent',
      period: '2016 – 2019',
    },
  ],
};

export const projects: Project[] = [
  {
    id: '1',
    slug: 'the-editorial-magazine',
    title: 'The Editorial Magazine',
    category: 'Editorial Design',
    year: '2024',
    description: 'A complete editorial redesign for an independent arts publication. The project involved reimagining the visual language while maintaining the publication\'s established voice and readership.',
    coverImage: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1400&q=80',
    images: [
      'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1400&q=80',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1400&q=80',
      'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=1400&q=80',
    ],
    info: {
      client: 'The Editorial Group',
      role: 'Art Director & Designer',
      timeline: '6 months',
      deliverables: 'Brand identity, print layout system, digital guidelines',
    },
    process: 'The project began with extensive research into the publication\'s heritage and reader expectations. I developed multiple concept directions, refining the typographic system and grid structure through several rounds of feedback with the editorial team.',
    result: 'The redesigned publication launched to positive reader feedback, with increased newsstand sales and a refreshed visual presence that better reflects the quality of the writing.',
  },
  {
    id: '2',
    slug: 'lumina-cosmetics',
    title: 'Lumina Cosmetics',
    category: 'Brand Identity',
    year: '2023',
    description: 'Brand identity and packaging design for a luxury skincare line. The brief called for a visual language that conveys efficacy, purity, and understated elegance.',
    coverImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1400&q=80',
    images: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1400&q=80',
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1400&q=80',
      'https://images.unsplash.com/photo-1571875257727-256c39da42af?w=1400&q=80',
    ],
    info: {
      client: 'Lumina Beauty',
      role: 'Brand Designer',
      timeline: '4 months',
      deliverables: 'Logo, packaging system, brand guidelines',
    },
    process: 'Starting with mood boarding and competitive analysis, I developed a visual direction centered on botanical illustration and refined typography. The packaging system was designed to work across various product sizes while maintaining consistency.',
    result: 'Lumina launched successfully in select retailers, with the brand receiving recognition for its distinctive visual identity in a crowded market segment.',
  },
  {
    id: '3',
    slug: 'aether-and-co',
    title: 'Aether & Co.',
    category: 'Web Design',
    year: '2023',
    description: 'Website design and development for a boutique architecture studio. The project required balancing visual impact with functional clarity for a professional audience.',
    coverImage: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1400&q=80',
    images: [
      'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1400&q=80',
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&q=80',
      'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=1400&q=80',
    ],
    info: {
      client: 'Aether Architecture',
      role: 'Designer & Developer',
      timeline: '3 months',
      deliverables: 'Website design, front-end development, CMS integration',
    },
    process: 'Working closely with the architecture team, I developed a site structure that prioritizes their portfolio work while providing clear pathways to project details and contact information. The design uses generous whitespace and large imagery.',
    result: 'The new website has significantly improved inquiry rates and time-on-site metrics, with clients reporting they appreciate the clarity and ease of navigation.',
  },
  {
    id: '4',
    slug: 'verdant-exhibition',
    title: 'Verdant Exhibition',
    category: 'Art Direction',
    year: '2022',
    description: 'Art direction and visual identity for a contemporary art exhibition exploring themes of nature and technology. The project encompassed signage, printed materials, and digital presence.',
    coverImage: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&q=80',
    heroImage: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1400&q=80',
    images: [
      'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1400&q=80',
      'https://images.unsplash.com/photo-1545989253-02cc26577f88?w=1400&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&q=80',
    ],
    info: {
      client: 'Verdant Foundation',
      role: 'Art Director',
      timeline: '2 months',
      deliverables: 'Exhibition identity, signage system, catalogue, digital materials',
    },
    process: 'The exhibition\'s theme of nature meeting technology informed every visual decision. I developed a visual language that uses organic forms alongside precise geometric elements, creating tension that mirrors the exhibition\'s conceptual framework.',
    result: 'The exhibition ran to full capacity, with the visual identity receiving coverage in several design publications.',
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getAdjacentProjects(currentSlug: string): { prev: Project | null; next: Project | null } {
  const index = projects.findIndex((p) => p.slug === currentSlug);
  return {
    prev: index > 0 ? projects[index - 1] : null,
    next: index < projects.length - 1 ? projects[index + 1] : null,
  };
}
