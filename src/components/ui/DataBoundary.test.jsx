import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

import DataBoundary from './DataBoundary.jsx';

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

function renderDB(props) {
  act(() => {
    root.render(<DataBoundary {...props} />);
  });
  return container;
}

describe('DataBoundary — error branch (highest priority)', () => {
  it('renders the i18n error key when error is truthy', () => {
    renderDB({ error: new Error('oops') });
    expect(container.textContent).toContain('data_boundary_error_generic');
  });

  it('renders errorAction when error is truthy', () => {
    renderDB({ error: 'some error', errorAction: <button>Retry</button> });
    expect(container.querySelector('button').textContent).toBe('Retry');
  });

  it('error branch wins over loading — does not show skeletons', () => {
    renderDB({ error: 'e', loading: true, hasCache: false });
    // No skeleton: the error branch fires first
    expect(container.querySelectorAll('.animate-pulse').length).toBe(0);
    expect(container.textContent).toContain('data_boundary_error_generic');
  });

  it('error branch wins over empty — does not show emptySlot', () => {
    renderDB({ error: 'e', empty: true, emptySlot: <div>Empty</div> });
    expect(container.textContent).not.toContain('Empty');
    expect(container.textContent).toContain('data_boundary_error_generic');
  });
});

describe('DataBoundary — loading, no cache (skeleton branch)', () => {
  it('renders default 5 skeletons when loading and no cache', () => {
    renderDB({ loading: true, hasCache: false });
    // Skeletons render with animate-pulse
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(5);
  });

  it('respects skeletonCount prop', () => {
    renderDB({ loading: true, hasCache: false, skeletonCount: 4 });
    expect(container.querySelectorAll('.animate-pulse').length).toBe(4);
  });

  it('skeletonCount 6 renders 6 skeletons', () => {
    renderDB({ loading: true, hasCache: false, skeletonCount: 6 });
    expect(container.querySelectorAll('.animate-pulse').length).toBe(6);
  });

  it('does not render children when loading without cache', () => {
    renderDB({ loading: true, hasCache: false, children: <div>Data</div> });
    expect(container.textContent).not.toContain('Data');
  });
});

describe('DataBoundary — loading, has cache (pass-through branch)', () => {
  it('renders children immediately when loading and hasCache is true', () => {
    renderDB({ loading: true, hasCache: true, children: <div>Cached data</div> });
    expect(container.textContent).toContain('Cached data');
  });

  it('does not render skeletons when loading with cache', () => {
    renderDB({ loading: true, hasCache: true, children: <div>Data</div> });
    expect(container.querySelectorAll('.animate-pulse').length).toBe(0);
  });
});

describe('DataBoundary — empty branch', () => {
  it('renders emptySlot when empty is true and not loading', () => {
    renderDB({ empty: true, emptySlot: <div>No items</div> });
    expect(container.textContent).toContain('No items');
  });

  it('does not render children when empty', () => {
    renderDB({ empty: true, emptySlot: <div>Empty</div>, children: <div>Data</div> });
    expect(container.textContent).not.toContain('Data');
  });
});

describe('DataBoundary — children (happy path)', () => {
  it('renders children when not loading, not empty, no error', () => {
    renderDB({ children: <div>Feed content</div> });
    expect(container.textContent).toContain('Feed content');
  });
});

describe('DataBoundary — defaults', () => {
  it('renders children with all defaults (no props except children)', () => {
    renderDB({ children: <span>default</span> });
    expect(container.textContent).toContain('default');
  });
});
