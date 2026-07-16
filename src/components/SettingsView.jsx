const FONTS = [
  ['be-vietnam', 'Be Vietnam Pro'],
  ['inter', 'Inter'],
  ['segoe', 'Segoe UI'],
  ['system', 'System'],
  ['arial', 'Arial'],
  ['tahoma', 'Tahoma'],
];

export default function SettingsView({ preferences, onChange }) {
  return (
    <div className="settings-view">
      <div className="settings-inner">
        <header className="screen-header">
          <div>
            <p className="screen-kicker">RESEARCH NAVIGATOR / SETTINGS</p>
            <h1>Settings</h1>
            <p className="screen-lead">Personalize this browser without changing your research files.</p>
          </div>
        </header>

        <section className="settings-section">
          <div>
            <h2>Main font</h2>
            <p>Choose a font with complete Vietnamese character support.</p>
          </div>
          <select value={preferences.font} onChange={(event) => onChange({ ...preferences, font: event.target.value })}>
            {FONTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </section>

        <section className="settings-section">
          <div>
            <h2>Theme</h2>
            <p>Use a light, dark, or operating-system theme.</p>
          </div>
          <select value={preferences.theme} onChange={(event) => onChange({ ...preferences, theme: event.target.value })}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </section>
      </div>
    </div>
  );
}
