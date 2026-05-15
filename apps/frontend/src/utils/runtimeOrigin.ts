export function isLocalRuntimeUrl(value?: string | null): boolean {
  if (!value) return true;

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();

    return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
  } catch {
    return true;
  }
}

export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
