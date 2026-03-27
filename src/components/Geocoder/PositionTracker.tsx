import { Icon } from '@grafana/ui';
import React, { useCallback, useRef } from 'react';
import { useRootStore } from '../../utils';
import { CopyToClipboard } from 'react-copy-to-clipboard';

export const PositionTracker = ({ isLogic }: { isLogic: boolean }) => {
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

  const coords = getSelCoord?.coordinates?.length ? getSelCoord : { coordinates: [' ', ' '], type: 'Point' };

  const formatCoordinate = (value: unknown) => {
    if (typeof value === 'number') {
      return value.toFixed(6);
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed.toFixed(6) : value;
    }

    return value;
  };

  const formattedLon: any = formatCoordinate(coords.coordinates?.[0]);
  const formattedLat: any = formatCoordinate(coords.coordinates?.[1]);

  return (
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
            <span ref={lonRef}>{formattedLon}</span>
          </span>
          ,
          <span
            onClick={(e) => {
              e.stopPropagation();
              selectNode(latRef.current);
            }}
          >
            <span ref={latRef}>{formattedLat}</span>
          </span>
          ]
        </span>
        &nbsp;{isLogic ? 'x,y' : 'lon,lat'}
      </span>
    </div>
  );
};
