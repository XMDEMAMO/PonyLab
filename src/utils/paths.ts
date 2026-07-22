export interface PathEnvironment {
  baseUrl: string;
  siteUrl?: string;
}

export interface PathHelpers {
  readonly baseUrl: string;
  page: (pathname?: string) => string;
  asset: (pathname: string) => string;
  absolutePage: (pathname?: string) => string;
  absoluteAsset: (pathname: string) => string;
}

const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+.-]*:/i;

function assertInternalPath(pathname: string): void {
  if (ABSOLUTE_URL_PATTERN.test(pathname) || /^\/\/[^/]/.test(pathname)) {
    throw new TypeError(`Expected an internal path, received "${pathname}".`);
  }
}

function splitSuffix(pathname: string): [path: string, suffix: string] {
  const queryIndex = pathname.indexOf('?');
  const hashIndex = pathname.indexOf('#');
  const indexes = [queryIndex, hashIndex].filter((index) => index >= 0);
  const suffixIndex = indexes.length > 0 ? Math.min(...indexes) : -1;

  return suffixIndex >= 0
    ? [pathname.slice(0, suffixIndex), pathname.slice(suffixIndex)]
    : [pathname, ''];
}

function normalizeRelativePath(pathname: string): string {
  return pathname
    .replaceAll('\\', '/')
    .split('/')
    .filter(Boolean)
    .join('/');
}

export function normalizeBasePath(basePath: string): string {
  assertInternalPath(basePath);
  const normalized = normalizeRelativePath(basePath.trim());
  return normalized.length > 0 ? `/${normalized}/` : '/';
}

export function createPathHelpers({
  baseUrl,
  siteUrl,
}: PathEnvironment): PathHelpers {
  const normalizedBase = normalizeBasePath(baseUrl);

  const page = (pathname = '/'): string => {
    assertInternalPath(pathname);
    const [path, suffix] = splitSuffix(pathname.trim());
    const relativePath = normalizeRelativePath(path);
    const pagePath =
      relativePath.length > 0
        ? `${normalizedBase}${relativePath}/`
        : normalizedBase;

    return `${pagePath}${suffix}`;
  };

  const asset = (pathname: string): string => {
    assertInternalPath(pathname);
    const [path, suffix] = splitSuffix(pathname.trim());
    const relativePath = normalizeRelativePath(path);

    if (relativePath.length === 0) {
      throw new TypeError('Expected an internal asset path, received an empty path.');
    }

    return `${normalizedBase}${relativePath}${suffix}`;
  };

  const absolute = (pathname: string): string => {
    if (!siteUrl) {
      throw new Error('A site URL is required to build an absolute URL.');
    }

    return new URL(pathname, siteUrl).toString();
  };

  return {
    baseUrl: normalizedBase,
    page,
    asset,
    absolutePage: (pathname = '/') => absolute(page(pathname)),
    absoluteAsset: (pathname) => absolute(asset(pathname)),
  };
}

export const sitePaths = createPathHelpers({
  baseUrl: import.meta.env.BASE_URL,
  siteUrl: import.meta.env.SITE,
});
