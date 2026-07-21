const STATIC_ROUTES = {
  home: '/',
  objectives: '/objectives',
  compass: '/compass',
  evidence: '/evidence',
  review: '/review',
  journey: '/journey',
  settings: '/settings',
  help: '/help',
};

const decodeParts = (value) => {
  try { return value.split('/').filter(Boolean).map(decodeURIComponent); }
  catch { return []; }
};

export function readRoute(pathname = '/') {
  const parts = decodeParts(pathname);
  if (parts[0] === 'map') return { view: 'map', nodeId: parts.length === 2 ? parts[1] : null, documentPath: null };
  if (parts[0] === 'workspace') return { view: 'workspace', nodeId: null, documentPath: parts.slice(1).join('/') || null };
  const view = Object.entries(STATIC_ROUTES).find(([, route]) => route === pathname)?.[0] || 'home';
  return { view, nodeId: null, documentPath: null };
}

export function routePath(view, { nodeId = null, documentPath = null } = {}) {
  if (view === 'map') return nodeId ? `/map/${encodeURIComponent(nodeId)}` : '/map';
  if (view === 'workspace') {
    const encoded = documentPath?.split('/').map(encodeURIComponent).join('/');
    return encoded ? `/workspace/${encoded}` : '/workspace';
  }
  return STATIC_ROUTES[view] || '/';
}
