const loadIcons = async (names: string[], icons: Record<string, any>) => {
  names.forEach((name) => {
    icons[name] = { svgDataUrl: `data:${name}`, width: 10, height: 10 };
  });
};
import { SvgIconManager } from './SvgIconManager';

describe('SvgIconManager', () => {
  it('reuses one panel-scoped cache and replaces entries on a new generation', async () => {
    const manager = new SvgIconManager(loadIcons);
    const cache = manager.cache;
    cache.set('stale', { id: 'stale' });

    await manager.resolve({ requiredIconNames: new Set(['router']), signature: 'first' });
    expect(manager.cache).toBe(cache);
    expect(manager.cache.has('stale')).toBe(false);

    cache.set('current', { id: 'current' });
    await manager.resolve({ requiredIconNames: new Set(['router']), signature: 'second' });
    expect(manager.cache).toBe(cache);
    expect(manager.cache.has('current')).toBe(false);
  });

  it('clears panel-owned entries on dispose and ignores stale requests', async () => {
    const manager = new SvgIconManager(loadIcons);
    await manager.resolve({ requiredIconNames: new Set(['router']), signature: 'first' });
    manager.cache.set('icon', { id: 'icon' });

    manager.dispose();

    expect(manager.cache.size).toBe(0);
    expect(manager.state.icons).toEqual({});
    expect(manager.state.signature).toBe('');
  });
});

it('returns one stable render snapshot until an accepted icon update or disposal', async () => {
  const manager = new SvgIconManager(async () => undefined);
  const initial = manager.state;
  expect(manager.state).toBe(initial);
  await manager.resolve({ requiredIconNames: new Set(), signature: 'ready' });
  const accepted = manager.state;
  expect(accepted).not.toBe(initial);
  expect(manager.state).toBe(accepted);
  expect(manager.state.icons).toBe(accepted.icons);
  await manager.resolve({ requiredIconNames: new Set(), signature: 'ready' });
  expect(manager.state).toBe(accepted);
  manager.dispose();
  expect(manager.state).not.toBe(accepted);
  expect(manager.state).toBe(manager.state);
});
