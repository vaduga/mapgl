import { observer } from 'mobx-react-lite';
import React from 'react';
import {isVisible, useRootStore} from '../utils';
import {css} from "@emotion/css";
import {
    useStyles2,
    InlineFieldRow,
    InlineField, Select, Tooltip, Switch
} from "@grafana/ui";
import {GrafanaTheme2} from "@grafana/data";

import ReactSelectSearch from "./Selects/ReactSelectSearch";
import Checkbox from "./Checkboxes/Checkbox";
import {Graph} from 'mapLib'
import {colTypes} from "mapLib/utils";

const Menu = ({ eventBus, options, data, panel}) => {
    const s = useStyles2(getStyles);

    return  (
      <div className={s.myMenu}>
          <InlineFieldRow className={s.inlineRow}>
              <InlineField>
                  <ReactSelectSearch isMainLocSearch={true} eventBus={eventBus} data={data} options={options}/>
              </InlineField>

          </InlineFieldRow>
          {/*<LayerSelect/>*/}

      <InlineFieldRow>
          <br/>
      </InlineFieldRow>

      </div>
    )};

export default observer(Menu);

const getStyles = (theme: GrafanaTheme2) => ({
    inlineRow: css`
      display: flex;
      align-items: center;
      pointer-events: all;
    `,

    myMenu: css`
      color: grey;
      font-size: 0.9em;
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      z-index: 2;
      top: ${theme.spacing(1)};
      left: ${theme.spacing(1)};
      width: auto;
      // min-width: 15%;
      background: none;
      pointer-events: none;

      > div,button, ul, input, p  {
        margin-top: 3px;
      }
    `,
    drawerBtn: css`
      pointer-events: all;
    `,
    field: css`
      margin-top: ${theme.spacing(0.1)};
      margin-right: ${theme.spacing(1.5)};
    `
})
