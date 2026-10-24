import { PanelController } from '@vaduga/mapgl-core/runtime';
import { defViewState } from '@vaduga/mapgl-core/types';
import { GrafanaRuntimeSubscriptions } from './subscriptions';
import { viewportBinding } from './viewportBinding';

it('applies only viewport commands and releases replaced and disposed bindings without duplicates', () => {
  const owner = new GrafanaRuntimeSubscriptions([]);
  const first = new PanelController();
  const next = new PanelController();
  const applyViewport = jest.fn();
  const release = owner.bindPanel(viewportBinding({ controller: first, applyViewport }));
  expect(owner.bindPanel(viewportBinding({ controller: first, applyViewport }))).toBe(release);

  first.select(undefined);
  first.setViewport({ ...defViewState, zoom: 1 }, 'host');
  expect(applyViewport).not.toHaveBeenCalled();
  const firstView = { ...defViewState, zoom: 2 };
  first.setViewport(firstView);
  expect(applyViewport).toHaveBeenCalledTimes(1);
  expect(applyViewport).toHaveBeenCalledWith(firstView);

  const applyNextViewport = jest.fn();
  owner.bindPanel(viewportBinding({ controller: next, applyViewport: applyNextViewport }));
  release();
  first.setViewport({ ...defViewState, zoom: 3 });
  expect(applyViewport).toHaveBeenCalledTimes(1);
  const nextView = { ...defViewState, zoom: 4 };
  next.setViewport(nextView);
  expect(applyNextViewport).toHaveBeenCalledTimes(1);
  expect(applyNextViewport).toHaveBeenCalledWith(nextView);

  owner.dispose();
  next.setViewport({ ...defViewState, zoom: 5 });
  expect(applyNextViewport).toHaveBeenCalledTimes(1);
  first.dispose();
  next.dispose();
});
