import { observer } from 'mobx-react-lite';
import React from 'react';
import { css } from '@emotion/css';
import { useStyles2, InlineFieldRow, InlineField } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';

import ReactSelectSearch from './Selects/ReactSelectSearch';

const Menu = ({ eventBus, options, data, panel }) => {
  const s = useStyles2(getStyles);

  return (
    <div className={s.myMenu}>
      <InlineFieldRow className={s.inlineRow}>
        <InlineField>
          <ReactSelectSearch isMainLocSearch={true} eventBus={eventBus} data={data} options={options} />
        </InlineField>
      </InlineFieldRow>
    </div>
  );
};

export default observer(Menu);

const getStyles = (theme: GrafanaTheme2) => ({
  inlineRow: css`
    display: flex;
    align-items: center;
    pointer-events: all;
  `,

  myMenu: css`
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.bodySmall.fontSize};
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    z-index: ${theme.zIndex.dropdown};
    top: ${theme.spacing(1)};
    left: ${theme.spacing(1)};
    width: auto;
    // min-width: 15%;
    background: none;
    pointer-events: none;
  `,
  drawerBtn: css`
    pointer-events: all;
  `,
  field: css`
    margin-top: ${theme.spacing(0.25)};
    margin-right: ${theme.spacing(1.5)};
  `,
});
