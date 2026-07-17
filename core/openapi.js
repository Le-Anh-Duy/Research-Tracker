const jsonBody = (schema) => ({ required: true, content: { 'application/json': { schema } } });

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Research Navigator API',
    version: '1.0.0',
    description: 'Local-first semantic API for agents and scripts working with a Research Navigator roadmap.',
  },
  servers: [{ url: 'http://localhost:3001', description: 'Local server' }],
  tags: [{ name: 'Research actions', description: 'High-level graph and Markdown actions for agent workflows.' }],
  paths: {
    '/api/research/state': {
      get: { tags: ['Research actions'], summary: 'Read the complete roadmap state', responses: { 200: { description: 'Graph, timeline, questions, and context.' } } },
    },
    '/api/research/nodes': {
      post: {
        tags: ['Research actions'], summary: 'Create a node',
        description: 'Omit parentId to create a floating node. Include parentId to create a node and step link together.',
        requestBody: jsonBody({ $ref: '#/components/schemas/CreateNode' }),
        responses: { 201: { description: 'Node created.' }, 400: { description: 'Invalid request.' } },
      },
    },
    '/api/research/links': {
      post: {
        tags: ['Research actions'], summary: 'Link two existing nodes',
        requestBody: jsonBody({ $ref: '#/components/schemas/CreateLink' }),
        responses: { 201: { description: 'Link created.' }, 409: { description: 'Link already exists.' } },
      },
    },
    '/api/research/log': {
      post: {
        tags: ['Research actions'], summary: 'Append a Markdown lab note',
        requestBody: jsonBody({ $ref: '#/components/schemas/LogEntry' }),
        responses: { 200: { description: 'Note appended.' }, 404: { description: 'Node not found.' } },
      },
    },
    '/api/research/dead-end': {
      post: {
        tags: ['Research actions'], summary: 'Mark a node as a dead end',
        requestBody: jsonBody({ $ref: '#/components/schemas/DeadEnd' }),
        responses: { 200: { description: 'Node marked dead.' }, 404: { description: 'Node not found.' } },
      },
    },
    '/api/research/merge': {
      post: {
        tags: ['Research actions'], summary: 'Merge a node and record its evidence contribution',
        requestBody: jsonBody({ $ref: '#/components/schemas/MergeEntry' }),
        responses: { 200: { description: 'Node merged.' }, 404: { description: 'Node not found.' } },
      },
    },
    '/api/change-reports': {
      post: {
        tags: ['Research actions'], summary: 'Save a structural-change review report',
        requestBody: jsonBody({ type: 'object', required: ['type', 'title', 'affected'], properties: {
          type: { type: 'string', example: 'objective' }, title: { type: 'string', example: 'Update objective' },
          before: { type: 'string' }, after: { type: 'string' },
          affected: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' } } } },
        } }),
        responses: { 201: { description: 'Report saved.' }, 400: { description: 'Invalid request.' } },
      },
    },
  },
  components: {
    schemas: {
      CreateNode: {
        type: 'object', required: ['title'], properties: {
          title: { type: 'string', example: 'Test detector vocabulary' },
          parentId: { type: 'string', example: 'n_o1', description: 'Optional. Omit to create a floating node.' },
          role: { type: 'string', example: 'experiment' }, kind: { type: 'string', example: 'synthesis' },
          status: { type: 'string', enum: ['active', 'merged', 'dead'], default: 'active' },
          outcome: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } },
          position: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } } },
          content: { type: 'string', description: 'Initial Markdown note.' },
        },
      },
      CreateLink: {
        type: 'object', required: ['source', 'target'], properties: {
          source: { type: 'string', example: 'n_exp_1' }, target: { type: 'string', example: 'n_syn_1' },
          kind: { type: 'string', enum: ['step', 'merge'], default: 'step' }, note: { type: 'string' },
        },
      },
      LogEntry: { type: 'object', required: ['nodeId', 'note'], properties: { nodeId: { type: 'string' }, note: { type: 'string' }, date: { type: 'string', example: '2026-07-14' } } },
      DeadEnd: { type: 'object', required: ['nodeId'], properties: { nodeId: { type: 'string' }, reason: { type: 'string' } } },
      MergeEntry: {
        type: 'object', required: ['nodeId'], properties: {
          nodeId: { type: 'string' }, title: { type: 'string' }, outcome: { type: 'string' }, rq: { type: 'string', example: 'RQ1' },
          finding: { type: 'string', enum: ['positive', 'negative', 'neutral'] }, contribution: { type: 'string' },
        },
      },
    },
  },
};
