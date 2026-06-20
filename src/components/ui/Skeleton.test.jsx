import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { Skeleton } from './Skeleton.jsx';

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

function renderSkeleton(props) {
  act(() => {
    root.render(<Skeleton {...props} />);
  });
  return container.firstChild;
}

describe('Skeleton — card variant (default)', () => {
  it('renders without crashing with default variant', () => {
    const el = renderSkeleton({});
    expect(el).toBeTruthy();
  });

  it('default variant is card', () => {
    const el = renderSkeleton({});
    // Card variant has a rounded-card class
    expect(el.className).toContain('rounded-card');
  });

  it('card variant contains header band (border-b)', () => {
    renderSkeleton({ variant: 'card' });
    const header = container.querySelector('.border-b');
    expect(header).toBeTruthy();
  });

  it('card variant has animate-pulse', () => {
    const el = renderSkeleton({ variant: 'card' });
    expect(el.className).toContain('animate-pulse');
  });

  it('card variant has motion-reduce:animate-none', () => {
    const el = renderSkeleton({ variant: 'card' });
    expect(el.className).toContain('motion-reduce:animate-none');
  });

  it('has no text content (purely structural)', () => {
    renderSkeleton({ variant: 'card' });
    expect(container.textContent.trim()).toBe('');
  });
});

describe('Skeleton — line variant', () => {
  it('renders a single div for line variant', () => {
    const el = renderSkeleton({ variant: 'line' });
    expect(el).toBeTruthy();
    expect(el.tagName).toBe('DIV');
  });

  it('line variant has rounded-full shape', () => {
    const el = renderSkeleton({ variant: 'line' });
    expect(el.className).toContain('rounded-full');
  });

  it('line variant has animate-pulse', () => {
    const el = renderSkeleton({ variant: 'line' });
    expect(el.className).toContain('animate-pulse');
  });

  it('line variant has motion-reduce:animate-none', () => {
    const el = renderSkeleton({ variant: 'line' });
    expect(el.className).toContain('motion-reduce:animate-none');
  });
});

describe('Skeleton — block variant', () => {
  it('renders a div for block variant', () => {
    const el = renderSkeleton({ variant: 'block' });
    expect(el).toBeTruthy();
    expect(el.tagName).toBe('DIV');
  });

  it('block variant has animate-pulse', () => {
    const el = renderSkeleton({ variant: 'block' });
    expect(el.className).toContain('animate-pulse');
  });

  it('block variant has motion-reduce:animate-none', () => {
    const el = renderSkeleton({ variant: 'block' });
    expect(el.className).toContain('motion-reduce:animate-none');
  });
});

describe('Skeleton — className prop', () => {
  it('accepts extra className for card', () => {
    const el = renderSkeleton({ variant: 'card', className: 'my-test' });
    expect(el.className).toContain('my-test');
  });

  it('accepts extra className for line', () => {
    const el = renderSkeleton({ variant: 'line', className: 'my-test' });
    expect(el.className).toContain('my-test');
  });
});
