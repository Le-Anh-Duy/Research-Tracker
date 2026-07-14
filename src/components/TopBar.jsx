import { useState } from 'react';

const LAYERS = [
  { num: 1, key: 'layer1', label: 'Topic' },
  { num: 2, key: 'layer2', label: 'Objectives' },
  { num: 3, key: 'layer3', label: 'Questions' },
];

export default function TopBar({ context, onSave, view, onSetView, onOpenCompass, onOpenReview, onOpenHelp }) {
  const [editing, setEditing] = useState(null); // layer num
  const [draft, setDraft] = useState('');

  const startEdit = (layer) => {
    // Questions are edited on the Compass screen (questions.json is the source of
    // truth); clicking the compass line jumps there instead of inline editing.
    if (layer.num === 3) {
      onOpenCompass();
      return;
    }
    setEditing(layer.num);
    setDraft(context[layer.key]);
  };
  const finishEdit = (num) => {
    onSave(num, draft);
    setEditing(null);
  };

  return (
    <header className="topbar">
      <div className="brand">
        Research <em>Navigator</em>
      </div>
      <div className="layers">
        {LAYERS.map((layer) =>
          editing === layer.num ? (
            <textarea
              key={layer.num}
              className="layer-edit"
              rows={3}
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => finishEdit(layer.num)}
            />
          ) : (
            <div
              key={layer.num}
              className="layer-row"
              onClick={() => startEdit(layer)}
              title={layer.num === 3 ? 'Open Compass' : 'Click to edit'}
            >
              <span className="layer-label">{layer.label}</span>
              <span className={'layer-text' + (context[layer.key] ? '' : ' empty')}>
                {context[layer.key].replace(/\n/g, ' · ') || 'click to write…'}
              </span>
            </div>
          )
        )}
      </div>
      <div className="view-tabs">
        <button className={'view-tab' + (view === 'map' ? ' active' : '')} onClick={() => onSetView('map')}>
          Map
        </button>
        <button
          className={'view-tab' + (view === 'compass' ? ' active' : '')}
          onClick={onOpenCompass}
        >
          Compass
        </button>
        <button
          className={'view-tab' + (view === 'review' ? ' active' : '')}
          onClick={onOpenReview}
        >
          Review
        </button>
        <button
          className={'help-button' + (view === 'help' ? ' active' : '')}
          aria-label="Open usage guide"
          title="Usage guide"
          onClick={onOpenHelp}
        >
          ?
        </button>
      </div>
    </header>
  );
}
