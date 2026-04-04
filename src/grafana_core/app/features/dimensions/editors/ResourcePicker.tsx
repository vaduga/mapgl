import { css } from '@emotion/css';
import React, { useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
//import { t, Trans } from '@grafana/i18n';
import {
  Button,
  IconButton,
  LinkButton,
  Popover,
  PopoverController,
  useStyles2,
  useTheme2,
} from '@grafana/ui';

import { getPublicOrAbsoluteUrl } from '../resource';
import { MediaType, ResourceFolderName, ResourcePickerSize } from '../types';
import { closePopover } from '../../../../ui/src/utils/closePopover';
import { SanitizedSVG } from '../../../../components/SVG/SanitizedSVG';
import { ResourcePickerPopover } from './ResourcePickerPopover';

interface Props {
  onChange: (value?: string) => void;
  mediaType: MediaType;
  folderName: ResourceFolderName;
  size: ResourcePickerSize;
  onClear?: (event: React.MouseEvent) => void;
  value?: string; //img/icons/unicons/0-plus.svg
  src?: string;
  name?: string;
  placeholder?: string;
  color?: string;
  maxFiles?: number;
}

export const ResourcePicker = (props: Props) => {
  const { value, src, name, placeholder, onChange, onClear, mediaType, folderName, size, color, maxFiles } = props;

  const styles = useStyles2(getStyles);
  const theme = useTheme2();

  const pickerTriggerRef = useRef<HTMLDivElement>(null);
  const hidePopperRef = useRef<(() => void) | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const closePickerPopover = () => {
    setIsPopoverOpen(false);
    hidePopperRef.current?.();
  };
  const popoverElement = (
    <LazyResourcePickerPopover
      isOpen={isPopoverOpen}
      onChange={onChange}
      value={value}
      mediaType={mediaType}
      folderName={folderName}
      maxFiles={maxFiles}
      hidePopper={closePickerPopover}
    />
  );

  let sanitizedSrc = src;
  if (!sanitizedSrc && value) {
    sanitizedSrc = getPublicOrAbsoluteUrl(value);
  }

  const colorStyle = color && {
    fill: theme.visualization.getColorByName(color),
  };

  const renderSmallResourcePicker = () => {
    if (value && sanitizedSrc) {
      return <SanitizedSVG src={sanitizedSrc} className={styles.icon} style={{ ...colorStyle }} />;
    } else {
      return (
        <LinkButton variant="primary" fill="text" size="sm">
          Set icon
          {/*<Trans i18nKey="dimensions.resource-picker.render-small-resource-picker.set-icon">Set icon</Trans>*/}
        </LinkButton>
      );
    }
  };

  const renderNormalResourcePicker = () => (
    <div className={styles.trigger}>
      <div className={styles.triggerMain}>
        {sanitizedSrc ? (
          <SanitizedSVG src={sanitizedSrc} className={styles.icon} style={{ ...colorStyle }} />
        ) : (
          <div className={styles.iconPlaceholder} />
        )}
        <span className={styles.triggerText}>{getDisplayName(src, name) ?? placeholder}</span>
      </div>
      <IconButton
        name="times"
        tooltip="Clear value"
        className={styles.clearButton}
        onClick={(event) => {
          event.stopPropagation();
          onClear?.(event);
        }}
      />
    </div>
  );

  return (
    <PopoverController content={popoverElement}>
      {(showPopper, hidePopper, popperProps) => {
        hidePopperRef.current = hidePopper;
        const openPopover = () => {
          setIsPopoverOpen(true);
          showPopper();
        };

        return (
          <>
            {pickerTriggerRef.current && isPopoverOpen && (
              <Popover
                {...popperProps}
                referenceElement={pickerTriggerRef.current}
                onKeyDown={(event) => {
                  closePopover(event, () => {
                    setIsPopoverOpen(false);
                    hidePopper();
                  });
                }}
              />
            )}

            <div
              ref={pickerTriggerRef}
              className={styles.pointer}
              onClick={openPopover}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter') {
                  openPopover();
                }
              }}
              role="button"
              tabIndex={0}
            >
              {size === ResourcePickerSize.SMALL && renderSmallResourcePicker()}
              {size === ResourcePickerSize.NORMAL && renderNormalResourcePicker()}
            </div>
          </>
        );
      }}
    </PopoverController>
  );
};

type LazyResourcePickerPopoverProps = {
  isOpen: boolean;
  value?: string;
  onChange: (value?: string) => void;
  mediaType: MediaType;
  folderName: ResourceFolderName;
  maxFiles?: number;
  hidePopper?: () => void;
};

const LazyResourcePickerPopover = ({ isOpen, ...props }: LazyResourcePickerPopoverProps) => {
  if (!isOpen) {
    return <div />;
  }

  return <ResourcePickerPopover {...props} />;
};

// strip the SVG off icons in the icons folder
function getDisplayName(src?: string, name?: string): string | undefined {
  if (src?.startsWith('public/build/img/icons')) {
    const idx = name?.lastIndexOf('.svg') ?? 0;
    if (idx > 0) {
      return name!.substring(0, idx);
    }
  }
  return name;
}

const getStyles = (theme: GrafanaTheme2) => {
  const iconWidth = theme.spacing(2.25);
  const iconHeight = theme.spacing(1.75);

  return {
  pointer: css({
    cursor: 'pointer',
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',

  }),
  trigger: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',
    height: theme.spacing(4),
    minHeight: theme.spacing(4),
    padding: `0 ${theme.spacing(0.5)}`,
    border: `1px solid ${theme.components.input.borderColor}`,
    borderRadius: theme.shape.radius.default,
    background: theme.components.input.background,
    boxSizing: 'border-box',
  }),
  triggerMain: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    flex: '1 1 auto',
    minWidth: 0,
    overflow: 'hidden',
  }),
  triggerText: css({
    flex: '1 1 auto',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: theme.typography.size.sm,
    lineHeight: 1.25,
  }),
  clearButton: css({
    flex: '0 0 auto',
    padding: 0,
    margin: 0,
  }),
  iconPlaceholder: css({
    width: iconWidth,
    height: iconHeight,
    flex: '0 0 auto',
  }),
  icon: css({
    verticalAlign: 'middle',
    display: 'inline-block',
    fill: 'currentColor',
    width: iconWidth,
    height: iconHeight,
    flex: '0 0 auto',
  }),
  };
};
