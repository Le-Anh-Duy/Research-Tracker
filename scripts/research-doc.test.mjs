import assert from 'node:assert/strict';
import { edgeMetadata, formatResearchDoc, linkedId, nodeMetadata, parseResearchDoc, reciprocalError } from '../research-doc.js';

const edge = { id: 'e_a_b', source: 'n_a', target: 'n_b', data: { kind: 'step', note: 'why' } };
const a = { id: 'n_a', data: { title: 'A', status: 'active' } };
const b = { id: 'n_b', data: { title: 'B', status: 'active' } };
const documents = [a, b].map((node) => ({ id: node.id, metadata: nodeMetadata(node, [edge]) }));

const saved = formatResearchDoc(documents[0].metadata, '# A\n');
assert.deepEqual(parseResearchDoc(saved), { metadata: documents[0].metadata, body: '# A\n' });
assert.equal(linkedId(edgeMetadata(edge).from, 'nodes'), 'n_a');
assert.equal(edgeMetadata(edge).note, undefined);
assert.equal(reciprocalError(documents, [edge]), '');
assert.match(reciprocalError([{ ...documents[0], metadata: { ...documents[0].metadata, to: [] } }, documents[1]], [edge]), /does not point/);
assert.match(reciprocalError([{ ...documents[0], metadata: { ...documents[0].metadata, to: ['[[edges/missing]]'] } }, documents[1]], []), /invalid outgoing/);

console.log('research-doc: all assertions passed');
