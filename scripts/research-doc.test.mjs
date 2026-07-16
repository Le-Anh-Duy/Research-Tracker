import assert from 'node:assert/strict';
import { edgeMetadata, formatResearchDoc, linkedId, nodeMetadata, parseResearchDoc, relationshipError } from '../research-doc.js';

const edge = { id: 'e_a_b', source: 'n_a', target: 'n_b', data: { kind: 'step', note: 'why' } };
const a = { id: 'n_a', data: { title: 'A', status: 'active' } };
const b = { id: 'n_b', data: { title: 'B', status: 'active' } };
const documents = [a, b].map((node) => ({ id: node.id, metadata: nodeMetadata(node) }));

const saved = formatResearchDoc(documents[0].metadata, '# A\n');
assert.deepEqual(parseResearchDoc(saved), { metadata: documents[0].metadata, body: '# A\n' });
assert.equal(linkedId(edgeMetadata(edge).from, 'nodes'), 'n_a');
assert.equal(edgeMetadata(edge).note, undefined);
assert.equal(relationshipError(documents, [edge]), '');
assert.match(relationshipError(documents, [{ ...edge, target: 'missing' }]), /missing endpoint/);

console.log('research-doc: all assertions passed');
