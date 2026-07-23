export type ProjectType = 'web' | 'tool' | 'experiment';
export type ProjectStatus = 'active' | 'complete' | 'concept' | 'paused';

export interface ProjectRecord {
  slug: string;
  name: string;
  description: string;
  cover: ImageMetadata;
  coverAlt: string;
  status: ProjectStatus;
  type: ProjectType;
  stack: readonly string[];
  github: HttpUrl | null;
  demo: HttpUrl | null;
  featured: boolean;
  order: number;
  objectPosition?: string;
  isPlaceholder?: boolean;
}

export type HobbyType = 'works' | 'characters' | 'games';

export interface HobbyRecord {
  slug: string;
  type: HobbyType;
  name: string;
  image: ImageMetadata;
  imageAlt: string;
  summary: string;
  objectPosition?: string;
  isPlaceholder?: boolean;
}
import type { HttpUrl } from '../utils/links';
