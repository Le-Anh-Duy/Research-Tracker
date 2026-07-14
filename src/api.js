const json = (r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)));
const put = (url, body) =>
  fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json);

export const getGraph = () => fetch('/api/graph').then(json);
export const putGraph = (graph) => put('/api/graph', graph);
export const getNode = (id) => fetch(`/api/node/${id}`).then(json);
export const putNode = (id, content) => put(`/api/node/${id}`, { content });
export const getContext = () => fetch('/api/context').then(json);
export const putContext = (layer, content) => put(`/api/context/${layer}`, { content });
export const summarize = (nodeId) =>
  fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodeId }),
  }).then(json);
