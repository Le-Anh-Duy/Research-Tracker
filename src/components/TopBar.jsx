import { useState } from 'react';

const LAYERS = [
  { num: 1, key: 'layer1', label: 'Topic' },
  { num: 2, key: 'layer2', label: 'Objectives' },
  { num: 3, key: 'layer3', label: 'Questions' },
];

export default function TopBar({ context, onSave }) {
  const [editing, setEditing] = useState(null); // layer num
  const [draft, setDraft] = useState('');

  const startEdit = (layer) => {
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
            <div key={layer.num} className="layer-row" onClick={() => startEdit(layer)} title="Click to edit">
              <span className="layer-label">{layer.label}</span>
              <span className={'layer-text' + (context[layer.key] ? '' : ' empty')}>
                {context[layer.key].replace(/\n/g, ' · ') || 'click to write…'}
              </span>
            </div>
          )
        )}
      </div>
    </header>
  );
}
