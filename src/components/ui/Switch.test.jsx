import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { Switch } from './Switch.jsx';

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

function renderSwitch(props) {
  act(() => {
    root.render(<Switch {...props} />);
  });
  return container.querySelector('button[role="switch"]');
}

describe('Switch', () => {
  it('renders a button with role=switch', () => {
    const el = renderSwitch({ 'aria-label': 'Test' });
    expect(el).toBeTruthy();
    expect(el.getAttribute('role')).toBe('switch');
  });

  it('reflects checked=true via aria-checked', () => {
    const el = renderSwitch({ checked: true, onCheckedChange: () => {}, 'aria-label': 'Toggle' });
    expect(el.getAttribute('aria-checked')).toBe('true');
  });

  it('reflects checked=false via aria-checked', () => {
    const el = renderSwitch({ checked: false, onCheckedChange: () => {}, 'aria-label': 'Toggle' });
    expect(el.getAttribute('aria-checked')).toBe('false');
  });

  it('calls onCheckedChange when clicked', () => {
    const handler = vi.fn();
    const el = renderSwitch({ checked: false, onCheckedChange: handler, 'aria-label': 'Toggle' });
    act(() => el.click());
    expect(handler).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled prop is set', () => {
    const el = renderSwitch({ disabled: true, 'aria-label': 'Toggle' });
    expect(el.disabled).toBe(true);
  });

  it('passes aria-label from caller through spread props', () => {
    const el = renderSwitch({ 'aria-label': 'my-custom-label' });
    expect(el.getAttribute('aria-label')).toBe('my-custom-label');
  });

  it('includes custom className', () => {
    const el = renderSwitch({ className: 'my-custom-class', 'aria-label': 'Toggle' });
    expect(el.className).toContain('my-custom-class');
  });

  it('has data-[state=checked] when checked', () => {
    const el = renderSwitch({ checked: true, onCheckedChange: () => {}, 'aria-label': 'Toggle' });
    expect(el.getAttribute('data-state')).toBe('checked');
  });

  it('has data-[state=unchecked] when not checked', () => {
    const el = renderSwitch({ checked: false, onCheckedChange: () => {}, 'aria-label': 'Toggle' });
    expect(el.getAttribute('data-state')).toBe('unchecked');
  });
});
