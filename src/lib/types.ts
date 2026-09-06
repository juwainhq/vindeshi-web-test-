export interface Project {
  id: string;
  slug: string;
  title: string;
  category: string;
  year: string;
  description: string;
  coverImage: string;
  heroImage: string;
  images: string[];
  info: {
    client?: string;
    role?: string;
    timeline?: string;
    deliverables?: string;
  };
  process: string;
  result: string;
}

export interface Profile {
  name: string;
  title: string;
  location: string;
  bio: string;
  email: string;
  instagram: string;
  dribbble: string;
  availability: string;
  skills: string[];
  experience: Experience[];
  profileImage: string;
}

export interface Experience {
  role: string;
  company: string;
  period: string;
}
