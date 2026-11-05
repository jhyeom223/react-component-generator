import { useState } from 'react';
import type { GeneratedComponent } from '../types';
import { LivePreview } from './LivePreview';
import { CodeView } from './CodeView';

interface ComponentCardProps {
  component: GeneratedComponent;
  onRemove: (id: string) => void;
  onRegenerate: (prompt: string) => void;
  isLoading: boolean;
}

type Tab = 'preview' | 'code';

export function ComponentCard({ component, onRemove, onRegenerate, isLoading }: ComponentCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [previewKey, setPreviewKey] = useState(0);
  const createdAt = component.createdAt.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article className="window component-window">
      <div className="titlebar">
        <button
          className="close-box"
          onClick={() => onRemove(component.id)}
          title="삭제"
          aria-label="이 컴포넌트 삭제"
        />
        <h3 className="titlebar-text">{createdAt}에 생성</h3>
      </div>

      <div className="component-toolbar">
        <p className="component-prompt">{component.prompt}</p>
        <div className="component-actions">
          <div className="segmented" role="tablist" aria-label="보기 방식">
            <button
              role="tab"
              aria-selected={activeTab === 'preview'}
              className="segmented-item"
              onClick={() => setActiveTab('preview')}
            >
              미리보기
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'code'}
              className="segmented-item"
              onClick={() => setActiveTab('code')}
            >
              코드
            </button>
          </div>
          <div className="component-buttons">
            {activeTab === 'preview' && (
              <button className="btn" onClick={() => setPreviewKey((k) => k + 1)}>
                다시 재생
              </button>
            )}
            <button
              className="btn"
              onClick={() => onRegenerate(component.prompt)}
              disabled={isLoading}
            >
              {isLoading ? '생성 중...' : '재생성'}
            </button>
          </div>
        </div>
      </div>

      <div className="component-content">
        {activeTab === 'preview' ? (
          <LivePreview key={previewKey} code={component.code} />
        ) : (
          <CodeView code={component.code} />
        )}
      </div>
    </article>
  );
}
