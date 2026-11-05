import { useState, useEffect } from 'react';
import { PromptInput } from './components/PromptInput';
import { ComponentCard } from './components/ComponentCard';
import { useComponentGenerator } from './hooks/useComponentGenerator';
import type { Provider } from './types';
import { loadHistory, loadProvider, saveHistory, saveProvider } from './utils/storage';
import { addToHistory } from './utils/promptHistory';
import './App.css';

const PROVIDER_CONFIG = {
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...' },
  google: { label: 'Google', placeholder: 'AIza...' },
} as const;

function App() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  // API 키는 메모리에만 두고, provider와 히스토리만 localStorage에 유지한다.
  const [provider, setProvider] = useState<Provider>(loadProvider);
  const [history, setHistory] = useState<string[]>(loadHistory);
  const [envKeys, setEnvKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    google: false,
  });
  const { components, isLoading, error, generate, removeComponent, clearAll } =
    useComponentGenerator();

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setEnvKeys(data.envKeys))
      .catch(() => {});
  }, []);

  useEffect(() => {
    saveProvider(provider);
  }, [provider]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const hasEnvKey = envKeys[provider];
  const keyReady = hasEnvKey || apiKey.trim().length > 0;

  const handleGenerate = (prompt: string) => {
    if (!apiKey.trim() && !hasEnvKey) {
      alert(`${PROVIDER_CONFIG[provider].label} API 키를 입력하거나 .env에 설정해주세요.`);
      return;
    }
    setHistory((prev) => addToHistory(prev, prompt));
    generate(prompt, apiKey || undefined, provider);
  };

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
    setApiKey('');
  };

  const activeProvider = PROVIDER_CONFIG[provider].label;

  return (
    <div className="app">
      <header className="menubar">
        <div className="menubar-brand">
          <span className="brand-mark" aria-hidden="true">
            RC
          </span>
          <span>React 컴포넌트 생성기</span>
        </div>
        <div className="menubar-status" aria-label="현재 작업 상태">
          <span className={`status-lamp ${keyReady ? 'status-lamp--on' : ''}`}>
            {activeProvider} {keyReady ? '연결됨' : '키 필요'}
          </span>
          <span>컴포넌트 {components.length}개</span>
        </div>
      </header>

      <main className="desk">
        <div className="workspace">
          <section className="window window--hero" aria-labelledby="prompt-title">
            <div className="titlebar">
              <h2 id="prompt-title" className="titlebar-text">새 컴포넌트</h2>
            </div>
            <div className="window-body">
              <PromptInput onGenerate={handleGenerate} isLoading={isLoading} history={history} />
            </div>
          </section>

          <aside className="window" aria-labelledby="settings-title">
            <div className="titlebar">
              <h2 id="settings-title" className="titlebar-text">실행 설정</h2>
            </div>
            <div className="window-body settings-body">
              <div className="field">
                <label htmlFor="provider">AI 제공자</label>
                <select
                  id="provider"
                  value={provider}
                  onChange={(e) => handleProviderChange(e.target.value as Provider)}
                >
                  {Object.entries(PROVIDER_CONFIG).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="api-key">API 키</label>
                <div className="api-key-field">
                  <input
                    id="api-key"
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      hasEnvKey
                        ? '서버 키 사용 중'
                        : PROVIDER_CONFIG[provider].placeholder
                    }
                  />
                  <button
                    className="btn"
                    onClick={() => setShowKey(!showKey)}
                    type="button"
                  >
                    {showKey ? '숨기기' : '보기'}
                  </button>
                </div>
                <p className="field-hint">
                  {hasEnvKey
                    ? '.env의 서버 키를 사용합니다. 직접 입력하면 이 키가 우선합니다.'
                    : '키를 직접 입력하거나 서버 .env에 설정하세요.'}
                </p>
              </div>
            </div>
          </aside>
        </div>

        {error && (
          <div className="window alert" role="alert">
            <span className="alert-icon" aria-hidden="true">!</span>
            <p>{error}</p>
          </div>
        )}

        <section className="results" aria-label="생성된 컴포넌트">
          {components.length > 0 && (
            <div className="results-header">
              <h2>생성된 컴포넌트</h2>
              <button className="btn" onClick={clearAll}>
                전체 삭제
              </button>
            </div>
          )}

          {isLoading && (
            <div className="window progress-dialog" role="status">
              <p>컴포넌트를 생성하고 있습니다</p>
              <div className="progress-bar" aria-hidden="true">
                <span />
              </div>
            </div>
          )}

          {components.length === 0 && !isLoading && (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true" />
              <p className="empty-title">아직 만든 컴포넌트가 없습니다</p>
              <p className="empty-hint">원하는 UI를 설명하고 생성을 누르면 여기에 창으로 열립니다.</p>
            </div>
          )}

          <div className="results-grid">
            {components.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                onRemove={removeComponent}
                onRegenerate={handleGenerate}
                isLoading={isLoading}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
