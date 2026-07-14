const LAYERS = [
  { num: 1, key: 'layer1', label: 'Topic' },
  { num: 2, key: 'layer2', label: 'Objectives' },
  { num: 3, key: 'layer3', label: 'Questions' },
];

export default function TopBar({ context, view, onSetView, onOpenCompass, onOpenReview, onOpenHelp }) {
  return (
    <header className="topbar">
      <div className="brand">Research <em>Navigator</em></div>
      <div className="layers">
        {LAYERS.map((layer) => (
          <button key={layer.num} type="button" className="layer-row" onClick={onOpenCompass} title="Open Research Compass">
            <span className="layer-label">{layer.label}</span>
            <span className={'layer-text' + (context[layer.key] ? '' : ' empty')}>
              {context[layer.key].replace(/\n/g, ' · ') || 'Not defined yet'}
            </span>
          </button>
        ))}
      </div>
      <nav className="view-tabs" aria-label="Primary views">
        <button className={'view-tab' + (view === 'map' ? ' active' : '')} onClick={() => onSetView('map')}>Map</button>
        <button className={'view-tab' + (view === 'compass' ? ' active' : '')} onClick={onOpenCompass}>Compass</button>
        <button className={'view-tab' + (view === 'review' ? ' active' : '')} onClick={onOpenReview}>Review</button>
        <button className={'help-button' + (view === 'help' ? ' active' : '')} aria-label="Open usage guide" title="Usage guide" onClick={onOpenHelp}>?</button>
      </nav>
    </header>
  );
}
