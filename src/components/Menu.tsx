import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { css } from '@emotion/css';
import { useStyles2, InlineFieldRow, InlineField, Tooltip } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import { selectGotoHandler } from '@mapgl/panel-core/utils';

import { ReactSelectSearch } from '@mapgl/panel-core/components';
import { useRootStore } from '../utils';

const Menu = ({ eventBus, options, data, panel }) => {
  const rootStore = useRootStore();
  const { pointStore } = rootStore;
  const { getSelectedNode } = pointStore;

  const s = useStyles2(getStyles);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isSearchVisible = isSearchOpen || Boolean(getSelectedNode);



  return (
    <div className={s.myMenu}>
      <InlineFieldRow className={s.inlineRow}>
        <InlineField>
          <div className={s.searchField}>
            <div className={s.searchButtonOuter}>
              <Tooltip content="search nodes">
                <button
                  className={s.searchButton}
                  type="button"
                  aria-label="search nodes"
                  onClick={() => setIsSearchOpen((value) => !value)}
                >
                  <span className={s.searchIcon} />
                </button>
              </Tooltip>
            </div>
            {isSearchVisible && (
              <ReactSelectSearch
                isMainLocSearch={true}
                eventBus={eventBus}
                data={data}
                options={options}
                rootStore={rootStore}
                selectGotoHandler={selectGotoHandler}
              />
            )}
          </div>
        </InlineField>
      </InlineFieldRow>
    </div>
  );
};

export default observer(Menu);

const getStyles = (theme: GrafanaTheme2) => {
const searchIconMask =
  "url(\"data:image/svg+xml,%3Csvg%20viewBox%3D'0%200%2024%2024'%20xmlns%3D'http://www.w3.org/2000/svg'%3E%3Cpath%20fill%3D'black'%20d%3D'M9.5%203a6.5%206.5%200%200%201%205.16%2010.45l5.44%205.44-1.41%201.41-5.44-5.44A6.5%206.5%200%201%201%209.5%203zm0%202a4.5%204.5%200%201%200%200%209%204.5%204.5%200%200%200%200-9z'/%3E%3C/svg%3E\")";

return {
  searchButtonOuter: css`
    width: var(--button-size, ${theme.spacing(3.5)});
    height: var(--button-size, ${theme.spacing(3.5)});
    background: var(--button-stroke, ${theme.colors.background.secondary});
    border-radius: var(--button-corner-radius, ${theme.shape.radius.default});
    box-shadow: var(--button-shadow, ${theme.shadows.z2});
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  `,
  searchButton: css`
    width: calc(var(--button-size, ${theme.spacing(3.5)}) - ${theme.spacing(0.25)});
    height: calc(var(--button-size, ${theme.spacing(3.5)}) - ${theme.spacing(0.25)});
    box-sizing: border-box;
    background: var(--button-background, ${theme.colors.background.primary});
    border: var(--button-inner-stroke, ${theme.spacing(0.125)} solid ${theme.colors.border.weak});
    border-radius: calc(var(--button-corner-radius, ${theme.shape.radius.default}) - ${theme.spacing(0.125)});
    color: var(--button-icon-idle, ${theme.colors.text.secondary});
    padding: 0;
    appearance: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    outline: none;

    &:hover,
    &:focus {
      background: var(--button-background, ${theme.colors.background.primary});
      color: var(--button-icon-hover, ${theme.colors.text.primary});
    }
  `,
  searchIcon: css`
    width: 100%;
    height: 100%;
    display: block;
    background-color: currentColor;
    mask: ${searchIconMask} center / 95% 95% no-repeat;
    -webkit-mask: ${searchIconMask} center / 95% 95% no-repeat;
  `,
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
  searchField: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(0.5)};
    margin-right: ${theme.spacing(1)};
    pointer-events: all;
  `,
};
};
