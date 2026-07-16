import React from 'react';
import { observer } from 'mobx-react-lite';
import { Tooltip as CoreTooltip } from '@mapgl/panel-core/components';

import { useRootStore } from '../../utils';

const ObservedCoreTooltip = observer(CoreTooltip);

const Tooltip = (props) => {
  const { pointStore, pId } = useRootStore();

  return (
    <ObservedCoreTooltip
      {...props}
      pointStore={pointStore}
      pId={pId}
    />
  );
};

const ObservedTooltip = observer(Tooltip);
export { ObservedTooltip as Tooltip };
