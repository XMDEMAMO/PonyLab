import { describe, expect, it } from 'vitest';

import {
  filterProjects,
  getProjectTypeCounts,
  sortProjects,
} from '../../src/utils/projects';

const fixtures = [
  { slug: 'notes', type: 'tool', featured: false, order: 2 },
  { slug: 'ponylab', type: 'web', featured: true, order: 4 },
  { slug: 'motion', type: 'experiment', featured: false, order: 1 },
  { slug: 'archive', type: 'web', featured: false, order: 3 },
] as const;

describe('project showcase utilities', () => {
  it('keeps empty project data safe for static rendering', () => {
    expect(filterProjects([], 'all')).toEqual([]);
    expect(getProjectTypeCounts([])).toEqual([]);
    expect(sortProjects([])).toEqual([]);
  });

  it('keeps all projects for the progressive-enhancement default', () => {
    expect(filterProjects(fixtures, 'all')).toEqual(fixtures);
  });

  it('filters by the explicit project type without mutating the source', () => {
    expect(filterProjects(fixtures, 'web').map((project) => project.slug)).toEqual([
      'ponylab',
      'archive',
    ]);
    expect(fixtures.map((project) => project.slug)).toEqual([
      'notes',
      'ponylab',
      'motion',
      'archive',
    ]);
  });

  it('counts project types in first-seen order', () => {
    expect(getProjectTypeCounts(fixtures)).toEqual([
      { type: 'tool', count: 1 },
      { type: 'web', count: 2 },
      { type: 'experiment', count: 1 },
    ]);
  });

  it('places featured projects first and then respects explicit order', () => {
    expect(sortProjects(fixtures).map((project) => project.slug)).toEqual([
      'ponylab',
      'motion',
      'notes',
      'archive',
    ]);
  });
});
