import { Handle, Position } from '@xyflow/react';

export default function ResearchNode({ data }) {
  const cls = [
    'rnode',
    's-' + data.status,
    data.anchor ? 'anchor' : '',
    data.isSelected ? 'sel' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls}>
      <Handle type="target" position={Position.Top} />
      <div className="rnode-title">{data.title}</div>
      {data.outcome && <div className="rnode-outcome">{data.outcome}</div>}
      <div className="rnode-status">{data.status}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
