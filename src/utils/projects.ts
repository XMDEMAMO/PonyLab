export interface ProjectFilterItem<TType extends string = string> {
  type: TType;
}

export interface ProjectSortItem extends ProjectFilterItem {
  featured: boolean;
  order: number;
}

export function filterProjects<TProject extends ProjectFilterItem>(
  projects: readonly TProject[],
  type: 'all' | TProject['type'],
): TProject[] {
  return type === 'all'
    ? [...projects]
    : projects.filter((project) => project.type === type);
}

export function getProjectTypeCounts<TProject extends ProjectFilterItem>(
  projects: readonly TProject[],
): Array<{ type: TProject['type']; count: number }> {
  const counts = new Map<TProject['type'], number>();

  for (const project of projects) {
    counts.set(project.type, (counts.get(project.type) ?? 0) + 1);
  }

  return [...counts].map(([type, count]) => ({ type, count }));
}

export function sortProjects<TProject extends ProjectSortItem>(
  projects: readonly TProject[],
): TProject[] {
  return [...projects].sort((left, right) => {
    const featuredDifference = Number(right.featured) - Number(left.featured);
    return featuredDifference || left.order - right.order;
  });
}
