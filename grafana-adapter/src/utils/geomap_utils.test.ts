import { notifyPanelEditor } from './geomap_utils';

function layer(name: string) {
  return {
    getName: () => name,
  } as any;
}

function panel() {
  return {
    panelContext: {
      onInstanceStateChange: jest.fn(),
    },
  } as any;
}

describe('notifyPanelEditor', () => {
  const layers = [layer('basemap'), layer('first'), layer('second')];

  it('preserves the selected data layer across refresh notifications', () => {
    const mapPanel = panel();

    notifyPanelEditor(mapPanel, layers, 2);
    notifyPanelEditor(mapPanel, layers);

    expect(mapPanel.panelContext.onInstanceStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ selected: 2 })
    );
  });

  it('selects the first displayed data layer for the initial notification', () => {
    const mapPanel = panel();

    notifyPanelEditor(mapPanel, layers);

    expect(mapPanel.panelContext.onInstanceStateChange).toHaveBeenCalledWith(expect.objectContaining({ selected: 2 }));
  });
});
