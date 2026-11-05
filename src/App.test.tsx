import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { loadHistory, loadProvider, saveProvider } from './utils/storage';

function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => ({
      ok: true,
      json: async () =>
        url === '/api/config'
          ? { envKeys: { anthropic: false, google: true } }
          : { code: 'render(<div />)' },
    })),
  );
}

beforeEach(() => {
  localStorage.clear();
  stubFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App 영속화', () => {
  it('localStorage에 저장된 provider로 시작한다', () => {
    saveProvider('anthropic');
    render(<App />);
    expect(screen.getByRole('combobox', { name: 'AI 제공자' })).toHaveValue('anthropic');
  });

  it('provider를 바꾸면 localStorage에 저장된다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'AI 제공자' }), 'anthropic');

    expect(loadProvider()).toBe('anthropic');
  });

  it('생성을 요청하면 프롬프트가 히스토리에 저장되고 최근 프롬프트에 표시된다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => expect(screen.getByText(/Google 연결됨/)).toBeInTheDocument());

    await user.type(screen.getByRole('textbox', { name: '만들 컴포넌트 설명' }), '로그인 폼');
    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));

    expect(loadHistory()).toEqual(['로그인 폼']);
    expect(screen.getByRole('list', { name: '최근 프롬프트' })).toHaveTextContent('로그인 폼');
  });

  it('입력한 API 키는 localStorage에 저장되지 않는다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('API 키'), 'sk-secret-123');

    const stored = Object.keys(localStorage).map((k) => localStorage.getItem(k)).join('|');
    expect(stored).not.toContain('sk-secret-123');
  });
});
