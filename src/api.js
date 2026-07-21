const json = async (r) => {
  const data = await r.json();
  if (r.ok) return data;
  const error = new Error(data.error || 'HTTP ' + r.status);
  error.status = r.status;
  error.data = data;
  throw error;
};
const put = (url, body) =>
  fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json);
const post = (url, body) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json);

export const getGraph = () => fetch('/api/graph').then(json);
export const putGraph = (graph, expectedRevision) => put('/api/graph', { nodes: graph.nodes, edges: graph.edges, expectedRevision });
export const getTimeline = () => fetch('/api/timeline').then(json);
export const putTimeline = (timeline) => put('/api/timeline', timeline);
export const getQuestions = () => fetch('/api/questions').then(json);
export const putQuestions = (questions) => put('/api/questions', questions);
export const getTeam = () => fetch('/api/team').then(json);
export const putTeam = (team) => put('/api/team', team);
export const getNode = (id) => fetch(`/api/node/${id}`).then(json);
export const putNode = (id, content) => put(`/api/node/${id}`, { content });
export const deleteNode = (id) => fetch(`/api/node/${id}`, { method: 'DELETE' }).then(json);
export const getResearchFiles = () => fetch('/api/research/files').then(json);
export const getResearchFile = (path) => fetch(`/api/research/file?path=${encodeURIComponent(path)}`).then(json);
export const putResearchFile = (path, content, expectedVersion) => put(`/api/research/file?path=${encodeURIComponent(path)}`, { content, expectedVersion });
export const getContext = () => fetch('/api/context').then(json);
export const putContext = (layer, content) => put(`/api/context/${layer}`, { content });
export const createChangeReport = (change) => fetch('/api/change-reports', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(change),
}).then(json);
export const summarize = (nodeId) =>
  fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodeId }),
  }).then(json);
export const researchState = () => fetch('/api/research/state').then(json);
export const previewProject = (input) => post('/api/research/init/preview', input);
export const initializeProject = (input) => post('/api/research/init', input);
export const applyResearchOperation = (operation) => post('/api/research/apply', operation);
export const getPlanExport = () => fetch('/api/research/export').then(json);
export const gitActivity = () => fetch('/api/git/activity').then(json);
export const gitSnapshot = (ref) => fetch(`/api/git/snapshot/${encodeURIComponent(ref)}`).then(json);
