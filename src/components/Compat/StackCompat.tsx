import React from 'react';
import * as GrafanaUI from '@grafana/ui';

type StackCompatProps = React.PropsWithChildren<{
  direction?: 'row' | 'column';
  gap?: number | string;
  width?: string | number;
  className?: string;
}>;

export const StackCompat = ({ children, direction = 'row', gap, width, className }: StackCompatProps) => {
  const Stack = (GrafanaUI as any).Stack;
  const wrapperStyle = {
    width,
    minWidth: width ? 0 : undefined,
  };

  if (Stack) {
    return (
      <div className={className} style={wrapperStyle}>
        <Stack direction={direction} gap={gap}>
          {children}
        </Stack>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        ...wrapperStyle,
        display: 'flex',
        flexDirection: direction,
        gap,
      }}
    >
      {children}
    </div>
  );
};
