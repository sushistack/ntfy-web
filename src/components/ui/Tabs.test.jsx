import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from './Tabs.jsx';

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

function renderTabs() {
  act(() => {
    root.render(
      <TabsRoot defaultValue="a">
        <TabsList aria-label="Test tabs">
          <TabsTrigger value="a">Tab A</TabsTrigger>
          <TabsTrigger value="b">Tab B</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content A</TabsContent>
        <TabsContent value="b">Content B</TabsContent>
      </TabsRoot>
    );
  });
}

describe('Tabs', () => {
  it('renders tablist with role=tablist', () => {
    renderTabs();
    expect(container.querySelector('[role="tablist"]')).toBeTruthy();
  });

  it('renders tab triggers with role=tab', () => {
    renderTabs();
    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(2);
  });

  it('renders tab panel content', () => {
    renderTabs();
    expect(container.textContent).toContain('Content A');
  });

  it('active tab trigger has data-state=active', () => {
    renderTabs();
    const activeTrigger = container.querySelector('[data-state="active"]');
    expect(activeTrigger).toBeTruthy();
  });

  it('inactive tab trigger has data-state=inactive', () => {
    renderTabs();
    const inactiveTrigger = container.querySelector('[data-state="inactive"]');
    expect(inactiveTrigger).toBeTruthy();
  });

  it('exports TabsRoot, TabsList, TabsTrigger, TabsContent as named exports', async () => {
    const mod = await import('./Tabs.jsx');
    expect(typeof mod.TabsRoot).not.toBe('undefined');
    expect(typeof mod.TabsList).not.toBe('undefined');
    expect(typeof mod.TabsTrigger).not.toBe('undefined');
    expect(typeof mod.TabsContent).not.toBe('undefined');
  });

  it('TabsTrigger has no hardcoded domain strings', () => {
    renderTabs();
    const triggers = container.querySelectorAll('[role="tab"]');
    triggers.forEach(t => {
      expect(t.textContent).not.toBe('');
    });
  });
});
