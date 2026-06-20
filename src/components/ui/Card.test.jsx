import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { Card } from './Card.jsx';

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

function renderCard(props, children = 'Content') {
  act(() => {
    root.render(<Card {...props}>{children}</Card>);
  });
  return container.querySelector('div');
}

describe('Card', () => {
  it('renders a <div> element', () => {
    const el = renderCard({});
    expect(el).toBeTruthy();
    expect(el.tagName).toBe('DIV');
  });

  it('applies rounded-card class', () => {
    const el = renderCard({});
    expect(el.className).toContain('rounded-card');
  });

  it('applies bg-surface class', () => {
    const el = renderCard({});
    expect(el.className).toContain('bg-surface');
  });

  it('applies border and border-border classes', () => {
    const el = renderCard({});
    expect(el.className).toContain('border');
    expect(el.className).toContain('border-border');
  });

  it('applies shadow-elev-1 resting shadow', () => {
    const el = renderCard({});
    expect(el.className).toContain('shadow-elev-1');
  });

  it('applies md:hover:shadow-elev-2 hover elevation', () => {
    const el = renderCard({});
    expect(el.className).toContain('md:hover:shadow-elev-2');
  });

  it('merges custom className', () => {
    const el = renderCard({ className: 'custom-class' });
    expect(el.className).toContain('custom-class');
  });

  it('spreads extra props onto the div', () => {
    const el = renderCard({ 'data-testid': 'my-card', role: 'article' });
    expect(el.getAttribute('data-testid')).toBe('my-card');
    expect(el.getAttribute('role')).toBe('article');
  });

  it('renders children', () => {
    renderCard({}, 'Hello Card');
    expect(container.textContent).toContain('Hello Card');
  });
});
