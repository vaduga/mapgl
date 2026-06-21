import React from 'react';
import { observer } from 'mobx-react-lite';
import { Tooltip as CoreTooltip } from '@mapgl/panel-core/components';
import { selectGotoHandler } from '@mapgl/panel-core/utils';
import { toRgbaString } from '@mapgl/panel-core/deckLayers/utils';

import { useRootStore } from '../../utils';

const ObservedCoreTooltip = observer(CoreTooltip);

const Tooltip = (props) => {
  const { pointStore, pId } = useRootStore();

  return (
    <ObservedCoreTooltip
      {...props}
      pointStore={pointStore}
      pId={pId}
      selectGotoHandler={selectGotoHandler}
      toRgbaString={toRgbaString}
    />
  );
};

const ObservedTooltip = observer(Tooltip);
export { ObservedTooltip as Tooltip };
