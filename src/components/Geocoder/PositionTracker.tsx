import { Icon, useStyles2 } from '@grafana/ui';
import React, { useCallback, useRef } from 'react';
import { useRootStore } from '../../utils';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

export const PositionTracker = ({ isLogic }: { isLogic: boolean }) => {
    const s = useStyles2(getStyles);
    const { pointStore } = useRootStore();
    const { getSelCoord } = pointStore;

    const coordinatesRef = useRef<HTMLSpanElement | null>(null);
    const lonRef = useRef<HTMLSpanElement | null>(null);
    const latRef = useRef<HTMLSpanElement | null>(null);

    const selectNode = useCallback((el: HTMLElement | null) => {
        if (!el) {
            return;
        }
        const range = document.createRange();
        range.selectNodeContents(el); // or selectNode(el) if you prefer including the element wrapper
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
    }, []);

    const coords =
        getSelCoord?.coordinates?.length
            ? getSelCoord
            : { coordinates: [' ', ' '], type: 'Point' };

    return (
        <div className={s.posTracker}>
            <div>
        <span onDoubleClick={() => selectNode(coordinatesRef.current)}>
          {!isLogic && (
              <CopyToClipboard text={JSON.stringify(getSelCoord)}>
                  <Icon name="copy" size="xs" title="Copy GeoJSON" />
              </CopyToClipboard>
          )}
            &nbsp;
            <span ref={coordinatesRef}>
            [
            <span
                onClick={(e) => {
                    e.stopPropagation();
                    selectNode(lonRef.current);
                }}
            >
              <span ref={lonRef}>{coords.coordinates?.[0]}</span>
            </span>
            ,
            <span
                onClick={(e) => {
                    e.stopPropagation();
                    selectNode(latRef.current);
                }}
            >
              <span ref={latRef}>{coords.coordinates?.[1]}</span>
            </span>
            ]
          </span>
            &nbsp;{isLogic ? 'x,y' : 'lon,lat'}
        </span>
            </div>
        </div>
    );
};

const getStyles = (theme: GrafanaTheme2) => ({
    posTracker: css`
        margin-right: ${theme.spacing(1)};
        z-index: 1;
        font-size: x-small;
    `,
});
