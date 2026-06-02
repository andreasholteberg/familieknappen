const AUTH_ROUTES = new Set(['auth-callback', 'invite']);

const routeFromUrl = (path: string): string | null => {
  const url = new URL(path, 'familieknappen://app');

  if (AUTH_ROUTES.has(url.hostname) && (!url.pathname || url.pathname === '/')) {
    return `/${url.hostname}${url.search}${url.hash}`;
  }

  const route = url.pathname.replace(/^\//, '');
  if (AUTH_ROUTES.has(route)) {
    return `${url.pathname}${url.search}${url.hash}`;
  }

  return null;
};

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    return routeFromUrl(path) ?? path;
  } catch {
    return path;
  }
}
