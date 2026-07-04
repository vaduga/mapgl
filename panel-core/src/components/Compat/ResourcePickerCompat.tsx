import React, { useCallback, useRef, useState } from 'react';

import type { SelectableValue } from '@grafana/data';
import * as GrafanaUI from '@grafana/ui';

import { ComboboxCompat } from './ComboboxCompat';

export const classNamePrefix = 'folder-picker-select';

const legacyReactSelectClassNameFragments = [
  `${classNamePrefix}__menu`,
  `${classNamePrefix}__menu-portal`,
  `${classNamePrefix}__option`,
  `${classNamePrefix}__control`,
  `${classNamePrefix}__input`,
  `${classNamePrefix}__value-container`,
  '__menu-portal',
];

type FolderPickerSelectCompatProps<T = string> = {
  options: Array<SelectableValue<T>>;
  value?: SelectableValue<T> | T | null;
  onChange: (value: SelectableValue<T> | null) => void;
  'aria-label'?: string;
};

export const FolderPickerSelectCompat = <T = string,>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
}: FolderPickerSelectCompatProps<T>) => {
  const Select = (GrafanaUI as any).Select;

  if (Select) {
    return (
      <Select
        options={options}
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        menuShouldPortal={true}
        menuPosition="fixed"
        classNamePrefix={classNamePrefix}
      />
    );
  }

  return (
    <ComboboxCompat
      options={options}
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
      menuShouldPortal={true}
      menuPosition="fixed"
      classNamePrefix={classNamePrefix}
    />
  );
};

export const useResourcePickerPopoverControllerCompat = () => {
  const hidePopperRef = useRef<(() => void) | null>(null);
  const [isPickerPopoverOpen, setIsPickerPopoverOpen] = useState(false);

  const setPickerPopoverHide = useCallback((hidePopper: () => void) => {
    hidePopperRef.current = hidePopper;
  }, []);

  const closePickerPopover = useCallback(() => {
    setIsPickerPopoverOpen(false);
    hidePopperRef.current?.();
  }, []);

  const openPickerPopover = useCallback((showPopper: () => void) => {
    setIsPickerPopoverOpen(true);
    showPopper();
  }, []);

  return {
    isPickerPopoverOpen,
    openPickerPopover,
    closePickerPopover,
    setPickerPopoverHide,
  };
};

export const shouldCloseOnInteractOutside = (element: Element): boolean => {
  const getPortalContainer = (GrafanaUI as any).getPortalContainer as (() => HTMLElement | undefined) | undefined;
  const portalContainer = getPortalContainer?.();

  if (typeof document !== 'undefined' && portalContainer && portalContainer !== document.body && portalContainer.contains(element)) {
    return false;
  }

  return !isFolderPickerSelectMenuElement(element);
};

const isFolderPickerSelectMenuElement = (element: Element): boolean => {
  return hasClassNameFragment(element, legacyReactSelectClassNameFragments) || isListboxElement(element);
};

const hasClassNameFragment = (element: Element, fragments: string[]): boolean => {
  let current: Element | null = element;

  while (current) {
    const className = current.getAttribute('class') ?? '';

    if (fragments.some((fragment) => className.includes(fragment))) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
};

const isListboxElement = (element: Element): boolean => {
  return element.getAttribute('role') === 'option' || element.closest('[role="listbox"]') != null;
};
