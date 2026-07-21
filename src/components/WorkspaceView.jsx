import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../api';

export default function WorkspaceView({ documentPath, onOpenFile }) {
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState('');
  const contentRef = useRef('');
  const pathRef = useRef(null);
  const dirtyRef = useRef(false);
  const readOnlyPaths = useRef(new Set());
  const versions = useRef(new Map());
  const saveTimer = useRef(null);
  const saveChain = useRef(Promise.resolve());

  const loadFiles = useCallback(() => {
    api.getResearchFiles()
      .then((result) => {
        const next = result.files || [];
        readOnlyPaths.current = new Set(next.filter((file) => file.readOnly).map((file) => file.path));
        setFiles(next);
      })
      .catch((cause) => setError(`Could not list Markdown files: ${cause.message}`));
  }, []);

  useEffect(() => {
    loadFiles();
  }, []);

  const save = useCallback((filePath = pathRef.current, value = contentRef.current) => {
    clearTimeout(saveTimer.current);
    if (!filePath || readOnlyPaths.current.has(filePath)) return saveChain.current;
    saveChain.current = saveChain.current.catch(() => {}).then(async () => {
      const result = await api.putResearchFile(filePath, value, versions.current.get(filePath));
      versions.current.set(filePath, result.version);
      if (pathRef.current === filePath && contentRef.current === value) {
        setDirty(false);
        dirtyRef.current = false;
        setSavedAt(new Date());
        setError('');
        loadFiles();
      }
    }).catch((cause) => {
      if (pathRef.current === filePath) setError(cause.status === 409 ? 'This file changed elsewhere. Reload it before saving again.' : `Could not save: ${cause.message}`);
    });
    return saveChain.current;
  }, [loadFiles]);

  useEffect(() => {
    clearTimeout(saveTimer.current);
    if (!documentPath) {
      pathRef.current = null;
      contentRef.current = '';
      setContent('');
      setDirty(false);
      setReadOnly(false);
      dirtyRef.current = false;
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    setSavedAt(null);
    pathRef.current = documentPath;
    contentRef.current = '';
    dirtyRef.current = false;
    setContent('');
    setDirty(false);
    setReadOnly(false);
    api.getResearchFile(documentPath).then((result) => {
      if (cancelled) return;
      pathRef.current = documentPath;
      contentRef.current = result.content;
      versions.current.set(documentPath, result.version);
      if (result.readOnly) readOnlyPaths.current.add(documentPath);
      setContent(result.content);
      setDirty(false);
      setReadOnly(result.readOnly);
      dirtyRef.current = false;
    }).catch((cause) => {
      if (!cancelled) setError(`Could not open file: ${cause.message}`);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
      clearTimeout(saveTimer.current);
      if (pathRef.current === documentPath && dirtyRef.current) save(documentPath, contentRef.current);
    };
  }, [documentPath]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const warn = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const visibleFiles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? files.filter((file) => `${file.title} ${file.path} ${JSON.stringify(file.metadata)}`.toLowerCase().includes(needle)) : files;
  }, [files, query]);

  const changeContent = (value) => {
    setContent(value);
    contentRef.current = value;
    setDirty(true);
    dirtyRef.current = true;
    setError('');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(documentPath, value), 1000);
  };

  const reload = () => {
    if (!documentPath) return;
    api.getResearchFile(documentPath).then((result) => {
      pathRef.current = documentPath;
      contentRef.current = result.content;
      versions.current.set(documentPath, result.version);
      if (result.readOnly) readOnlyPaths.current.add(documentPath);
      setContent(result.content);
      setDirty(false);
      setReadOnly(result.readOnly);
      dirtyRef.current = false;
      setError('');
    }).catch((cause) => setError(`Could not reload: ${cause.message}`));
  };

  return (
    <main className="workspace-view">
      <aside className="file-explorer">
        <header><strong>Markdown files</strong><small>{visibleFiles.length} / {files.length}</small></header>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter files…" aria-label="Filter Markdown files" />
        <nav aria-label="Research Markdown files">
          {visibleFiles.map((file) => (
              <button key={file.path} className={file.path === documentPath ? 'active' : ''} onClick={() => onOpenFile(file.path)}>
                <span>{file.title}</span>
                <small>{file.path}{file.readOnly ? ' · read-only' : ''}</small>
              </button>
          ))}
        </nav>
      </aside>
      <section className="markdown-editor">
        {!documentPath ? (
          <div className="workspace-empty"><h1>Markdown Workspace</h1><p>Choose a file from the explorer to read or edit it.</p></div>
        ) : (
          <>
            <header className="editor-head">
              <div><h1>{documentPath.split('/').at(-1)}</h1><small>{documentPath}</small></div>
              <div className="editor-actions">
                <span>{error || (loading ? 'Loading…' : readOnly ? 'Generated · read-only' : dirty ? 'Unsaved changes' : savedAt ? `Saved ${savedAt.toLocaleTimeString()}` : 'Saved')}</span>
                {error?.includes('changed elsewhere') && <button className="btn ghost" onClick={reload}>Reload</button>}
                {!readOnly && <button className="btn primary" disabled={loading || !dirty} onClick={() => save()}>Save</button>}
              </div>
            </header>
            <textarea
              className="markdown-source"
              value={content}
              readOnly={readOnly}
              disabled={loading}
              onChange={(event) => changeContent(event.target.value)}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                  event.preventDefault();
                  save();
                }
              }}
              spellCheck="false"
              aria-label={`Markdown content for ${documentPath}`}
            />
          </>
        )}
      </section>
    </main>
  );
}
