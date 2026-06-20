import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { Meter } from './Meter.jsx';

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

function getMeterEl() {
  return container.querySelector('[role="meter"]');
}

function renderMeter(props) {
  act(() => {
    root.render(<Meter {...props} />);
  });
}

describe('Meter — safeMeterValue graceful degradation', () => {
  it('renders without crashing for value=75', () => {
    renderMeter({ value: 75 });
    expect(getMeterEl()).toBeTruthy();
  });

  it('renders empty track (0%) for null', () => {
    renderMeter({ value: null });
    const fill = getMeterEl().querySelector('div');
    expect(fill.style.width).toBe('0%');
  });

  it('renders empty track (0%) for undefined', () => {
    renderMeter({ value: undefined });
    const fill = getMeterEl().querySelector('div');
    expect(fill.style.width).toBe('0%');
  });

  it('renders empty track (0%) for NaN', () => {
    renderMeter({ value: NaN });
    const fill = getMeterEl().querySelector('div');
    expect(fill.style.width).toBe('0%');
  });

  it('renders empty track (0%) for empty string', () => {
    renderMeter({ value: '' });
    const fill = getMeterEl().querySelector('div');
    expect(fill.style.width).toBe('0%');
  });

  it('renders empty track (0%) for Infinity', () => {
    renderMeter({ value: Infinity });
    const fill = getMeterEl().querySelector('div');
    expect(fill.style.width).toBe('0%');
  });

  it('clamps negative value to 0%', () => {
    renderMeter({ value: -10 });
    const fill = getMeterEl().querySelector('div');
    expect(fill.style.width).toBe('0%');
  });

  it('clamps value > 100 to 100%', () => {
    renderMeter({ value: 150 });
    const fill = getMeterEl().querySelector('div');
    expect(fill.style.width).toBe('100%');
  });

  it('coerces string "85" to 85%', () => {
    renderMeter({ value: '85' });
    const fill = getMeterEl().querySelector('div');
    expect(fill.style.width).toBe('85%');
  });
});

describe('Meter — ARIA attributes', () => {
  it('has role=meter on wrapper', () => {
    renderMeter({ value: 50 });
    expect(getMeterEl().getAttribute('role')).toBe('meter');
  });

  it('sets aria-valuenow to safe clamped value', () => {
    renderMeter({ value: 50 });
    expect(getMeterEl().getAttribute('aria-valuenow')).toBe('50');
  });

  it('sets aria-valuemin=0', () => {
    renderMeter({ value: 50 });
    expect(getMeterEl().getAttribute('aria-valuemin')).toBe('0');
  });

  it('sets aria-valuemax=100', () => {
    renderMeter({ value: 50 });
    expect(getMeterEl().getAttribute('aria-valuemax')).toBe('100');
  });
});

describe('Meter — threshold fill colors', () => {
  it('uses bg-meter-ok class for value < 65', () => {
    renderMeter({ value: 50 });
    const fill = getMeterEl().querySelector('div');
    expect(fill.className).toContain('bg-meter-ok');
  });

  it('uses bg-meter-warning class for value = 65', () => {
    renderMeter({ value: 65 });
    const fill = getMeterEl().querySelector('div');
    expect(fill.className).toContain('bg-meter-warning');
  });

  it('uses bg-meter-warning class for value = 89', () => {
    renderMeter({ value: 89 });
    const fill = getMeterEl().querySelector('div');
    expect(fill.className).toContain('bg-meter-warning');
  });

  it('uses bg-meter-critical class for value = 90', () => {
    renderMeter({ value: 90 });
    const fill = getMeterEl().querySelector('div');
    expect(fill.className).toContain('bg-meter-critical');
  });

  it('uses bg-meter-critical class for value = 100', () => {
    renderMeter({ value: 100 });
    const fill = getMeterEl().querySelector('div');
    expect(fill.className).toContain('bg-meter-critical');
  });
});

describe('Meter — label', () => {
  it('renders label text when provided', () => {
    renderMeter({ value: 50, label: '50%' });
    expect(container.textContent).toContain('50%');
  });

  it('does not render label span when label is undefined', () => {
    renderMeter({ value: 50 });
    expect(container.querySelectorAll('span').length).toBe(0);
  });

  it('label tints text-meter-critical at value >= 90', () => {
    renderMeter({ value: 95, label: '95%' });
    const span = container.querySelector('span');
    expect(span.className).toContain('text-meter-critical');
  });

  it('label tints text-muted below critical', () => {
    renderMeter({ value: 50, label: '50%' });
    const span = container.querySelector('span');
    expect(span.className).toContain('text-muted');
  });
});
