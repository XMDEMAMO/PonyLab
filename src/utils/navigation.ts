import type { NavigationItem } from '../config/site';
import type { PathHelpers } from './paths';

function ensureTrailingSlash(pathname: string): string {
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

export function isNavigationActive(
  currentPath: string,
  navigationPath: NavigationItem['href'],
  paths: PathHelpers,
): boolean {
  const normalizedCurrentPath = ensureTrailingSlash(currentPath);
  const targetPath = paths.page(navigationPath);

  return navigationPath === '/'
    ? normalizedCurrentPath === targetPath
    : normalizedCurrentPath === targetPath ||
        normalizedCurrentPath.startsWith(targetPath);
}
