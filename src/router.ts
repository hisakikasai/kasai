import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'certs' }
  | { name: 'cert'; id: string }
  | { name: 'logs' }
  | { name: 'settings' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (parts[0]) {
    case 'certs':
      return parts[1] ? { name: 'cert', id: decodeURIComponent(parts[1]) } : { name: 'certs' };
    case 'logs':
      return { name: 'logs' };
    case 'settings':
      return { name: 'settings' };
    default:
      return { name: 'home' };
  }
}

export function href(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'certs':
      return '#/certs';
    case 'cert':
      return `#/certs/${encodeURIComponent(route.id)}`;
    case 'logs':
      return '#/logs';
    case 'settings':
      return '#/settings';
  }
}

export function navigate(route: Route) {
  window.location.hash = href(route);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
