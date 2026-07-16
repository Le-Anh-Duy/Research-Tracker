import { Handle, Position } from '@xyflow/react';

const FINDING_MARK = { positive: '+', negative: '−', neutral: '~' };

export default function ResearchNode({ data }) {
  const isSynthesis = data.role === 'synthesis' || data.kind === 'synthesis';
  const isModule = data.role === 'module' || data.kind === 'module';
  const showDetail = data.detailLevel === 'detail';
  const showFooter = data.detailLevel !== 'overview';
  const hasCustomColor = Boolean(data.color);
  const cls = [
    'rnode',
    's-' + data.status,
    data.anchor ? 'anchor' : '',
    data.role === 'research-question' ? 'question' : '',
    isSynthesis ? 'synthesis' : '',
    isModule ? 'module' : '',
    hasCustomColor ? 'custom-color' : '',
    data.isSelected ? 'sel' : '',
    data.focusState,
    'level-' + data.importance,
    'zoom-' + data.detailLevel,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls} style={data.color ? { '--node-color': data.color } : undefined}>
      <Handle type="target" position={Position.Top} />
      {data.detailLevel !== 'overview' && <div className="rnode-role">{data.role}</div>}
      <div className="rnode-title">
        {isSynthesis && <span className="rnode-kind">◆ </span>}
        {data.title}
      </div>
      {data.foldSummary && <div className="rnode-fold">{data.foldSummary.total} folded · {data.foldSummary.merged} merged · {data.foldSummary.dead} dead</div>}
      {showDetail && data.outcome && <div className="rnode-outcome">{data.outcome}</div>}
      {showFooter && <div className="rnode-footer">
        <span className="rnode-status">{data.status}</span>
        {data.anchor && data.met && <span className="rnode-met">✓ met</span>}
        {data.rq && (
          <span className={'rnode-rq' + (data.finding ? ' f-' + data.finding : '')}>
            {data.finding ? FINDING_MARK[data.finding] : ''}
            {data.rq}
          </span>
        )}
        {showDetail && (data.tags || []).map((t) => (
          <span key={t} className="rnode-tag">
            {t}
          </span>
        ))}
      </div>}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
