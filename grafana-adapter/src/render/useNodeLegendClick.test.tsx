import { act, renderHook } from '@testing-library/react';
import { Graph } from '@vaduga/mapgl-core/graph/main';
import { GraphScene } from '@vaduga/mapgl-core/runtime';
import { createGroupLegend } from './runtime';
import { useNodeLegendClick } from './useNodeLegendClick';

it('toggles the annotation overlay independently from node groups', () => {
  const scene = new GraphScene();
  scene.visibility.setActiveGroups(new Uint8Array([1, 1]));
  const legend = () =>
    createGroupLegend(
      new Graph('root'),
      [
        { label: 'A', color: 'red', groupIdx: 0 },
        { label: 'B', color: 'blue', groupIdx: 1 },
      ],
      scene.visibility.getActiveGroups(),
      true,
      true,
      scene.visibility.annotationsVisible
    );
  const entries = legend();
  expect(entries.at(-1)!.data.annotationToggle).toBe(true);
  const { result } = renderHook(() => useNodeLegendClick({ scene }));
  const toggle = (index: number) => act(() => result.current(entries[index]));
  toggle(0);
  expect([...scene.visibility.getActiveGroups()]).toEqual([1, 0]);
  toggle(1);
  expect([...scene.visibility.getActiveGroups()]).toEqual([1, 1]);
  toggle(2);
  expect(scene.visibility.annotationsVisible).toBe(false);
  expect([...scene.visibility.getActiveGroups()]).toEqual([1, 1]);
  expect(legend().at(-1)?.disabled).toBe(true);
  toggle(0);
  expect([...scene.visibility.getActiveGroups()]).toEqual([0, 1]);
  toggle(2);
  expect(scene.visibility.annotationsVisible).toBe(true);
  expect([...scene.visibility.getActiveGroups()]).toEqual([0, 1]);
  const beforeReset = scene.visibility.getActiveGroups();
  toggle(1);
  expect(scene.visibility.getActiveGroups()).not.toBe(beforeReset);
  expect(scene.visibility.selectedGroups.size).toBe(0);
  expect([...scene.visibility.getActiveGroups()]).toEqual([1, 1]);
  expect(legend().every((entry) => !entry.disabled)).toBe(true);
});
