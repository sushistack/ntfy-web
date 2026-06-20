import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import StatePanel from './StatePanel.jsx';

let container;
let root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function renderStatePanel(props) {
  act(() => {
    root.render(<StatePanel {...props} />);
  });
  return container.firstChild;
}

describe('StatePanel — structure', () => {
  it('renders without crashing', () => {
    const el = renderStatePanel({ title: 'Test title' });
    expect(el).toBeTruthy();
  });

  it('renders title text', () => {
    renderStatePanel({ title: 'Hello' });
    expect(container.textContent).toContain('Hello');
  });

  it('renders desc when provided', () => {
    renderStatePanel({ title: 'T', desc: 'Some description' });
    expect(container.textContent).toContain('Some description');
  });

  it('does not render desc element when omitted', () => {
    renderStatePanel({ title: 'T' });
    const descEl = container.querySelector('.text-body-sm.text-muted');
    expect(descEl).toBeNull();
  });

  it('renders action slot', () => {
    renderStatePanel({ title: 'T', action: <button>Go</button> });
    expect(container.querySelector('button')).toBeTruthy();
    expect(container.querySelector('button').textContent).toBe('Go');
  });

  it('renders icon slot', () => {
    renderStatePanel({ title: 'T', icon: <span data-testid="icon">★</span> });
    const icon = container.querySelector('[data-testid="icon"]');
    expect(icon).toBeTruthy();
  });

  it('accepts extra className', () => {
    const el = renderStatePanel({ title: 'T', className: 'extra-class' });
    expect(el.className).toContain('extra-class');
  });

  it('carries zero hardcoded strings — no Korean or English user-facing text', () => {
    // StatePanel itself renders no hardcoded copy — all text comes from props
    renderStatePanel({});
    // Only empty/undefined content; no hardcoded string in the component
    expect(container.innerHTML).not.toContain('연결');
    expect(container.innerHTML).not.toContain('Error');
    expect(container.innerHTML).not.toContain('empty');
  });
});

describe('StatePanel — colorway variants', () => {
  it('muted colorway (default) uses muted token classes', () => {
    renderStatePanel({ title: 'T' });
    // icon tile should have muted classes
    const tile = container.firstChild.firstChild;
    expect(tile.className).toContain('bg-muted');
    expect(tile.className).toContain('text-muted');
  });

  it('coral colorway uses priority-max token classes', () => {
    renderStatePanel({ title: 'T', colorway: 'coral' });
    const tile = container.firstChild.firstChild;
    expect(tile.className).toContain('bg-priority-max');
    expect(tile.className).toContain('text-priority-max');
  });

  it('amber colorway uses priority-high token classes with animate-pulse', () => {
    renderStatePanel({ title: 'T', colorway: 'amber' });
    const tile = container.firstChild.firstChild;
    expect(tile.className).toContain('bg-priority-high');
    expect(tile.className).toContain('animate-pulse');
    expect(tile.className).toContain('motion-reduce:animate-none');
  });

  it('green colorway uses accent-text token classes', () => {
    renderStatePanel({ title: 'T', colorway: 'green' });
    const tile = container.firstChild.firstChild;
    expect(tile.className).toContain('bg-accent-text');
    expect(tile.className).toContain('text-accent-text');
  });

  it('coral, amber, green do NOT have animate-pulse on non-amber colorways (coral)', () => {
    renderStatePanel({ title: 'T', colorway: 'coral' });
    const tile = container.firstChild.firstChild;
    expect(tile.className).not.toContain('animate-pulse');
  });
});
