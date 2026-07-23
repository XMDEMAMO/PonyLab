export type HttpUrl = `http://${string}` | `https://${string}`;

export function isSafeExternalUrl(
  value: string | null | undefined,
): value is HttpUrl {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
