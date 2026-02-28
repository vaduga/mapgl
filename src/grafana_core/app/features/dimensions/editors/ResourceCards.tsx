import { css, cx } from '@emotion/css';
import * as React from 'react';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { CellComponentProps, Grid } from 'react-window';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { ResourceItem } from './FolderPickerTab';
import { SanitizedSVG } from '../../../../components/SVG/SanitizedSVG';

interface CellDataProps {
    cards: ResourceItem[];
    columnCount: number;
    onChange: (value: string) => void;
    selected?: string;
}

type CellProps = CellComponentProps<CellDataProps>;

function Cell(props: CellProps): React.ReactElement | null {
    const { columnIndex, rowIndex, style, cards, columnCount, onChange, selected, ariaAttributes } = props;
    const singleColumnIndex = columnIndex + rowIndex * columnCount;
    const card = cards[singleColumnIndex];
    const styles = useStyles2(getStyles);

    return (
        <div style={style} {...ariaAttributes}>
            {card && (
                <div
                    key={card.value}
                    className={selected === card.value ? cx(styles.card, styles.selected) : styles.card}
                    onClick={() => onChange(card.value)}
                    onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') {
                            onChange(card.value);
                        }
                    }}
                    role="button"
                    tabIndex={0}
                >
                    {card.imgUrl.endsWith('.svg') ? (
                        <SanitizedSVG src={card.imgUrl} className={styles.img} />
                    ) : (
                        <img src={card.imgUrl} alt="" className={styles.img} />
                    )}
                    <span className={styles.text}>{card.label.slice(0, -4)}</span>
                </div>
            )}
        </div>
    );
}

interface CardProps {
    onChange: (value: string) => void;
    cards: ResourceItem[];
    value?: string;
}

export const ResourceCards = (props: CardProps) => {
    const { onChange, cards, value } = props;
    const styles = useStyles2(getStyles);

    return (
        <AutoSizer
            renderProp={({ width, height }) => {
                const cardWidth = 90;
                const cardHeight = 90;
                const safeWidth = width ?? 680;
                const safeHeight = height ?? 300;
                const columnCount = Math.max(1, Math.floor(safeWidth / cardWidth));
                const rowCount = Math.ceil(cards.length / columnCount);
                return (
                    <Grid
                        style={{ width: safeWidth, height: safeHeight }}
                        defaultWidth={680}
                        defaultHeight={300}
                        columnCount={columnCount}
                        columnWidth={cardWidth}
                        rowCount={rowCount}
                        rowHeight={cardHeight}
                        cellProps={{ cards, columnCount, onChange, selected: value }}
                        cellComponent={Cell}
                        className={styles.grid}
                    />
                );
            }}
        />
    );
};

const getStyles = (theme: GrafanaTheme2) => ({
  card: css({
    display: 'inline-block',
    width: '90px',
    height: '90px',
    margin: '0.75rem',
    marginLeft: '15px',
    textAlign: 'center',
    cursor: 'pointer',
    position: 'relative',
    backgroundColor: 'transparent',
    border: '1px solid transparent',
    borderRadius: theme.shape.radius.default,
    paddingTop: '6px',
    ':hover': {
      borderColor: theme.colors.action.hover,
      boxShadow: theme.shadows.z2,
    },
  }),
  selected: css({
    border: `2px solid ${theme.colors.primary.main}`,
    ':hover': {
      borderColor: theme.colors.primary.main,
    },
  }),
  img: css({
    width: '40px',
    height: '40px',
    objectFit: 'cover',
    verticalAlign: 'middle',
    fill: theme.colors.text.primary,
  }),
  text: css({
    ...theme.typography.h6,
    color: theme.colors.text.primary,
    whiteSpace: 'nowrap',
    fontSize: '12px',
    textOverflow: 'ellipsis',
    display: 'block',
    overflow: 'hidden',
  }),
  grid: css({
    border: `1px solid ${theme.colors.border.medium}`,
  }),
});
