import React, { type ReactNode } from 'react';
import { tooltipSkin } from './tooltipSkin';

export interface TooltipProperty {
  readonly key: string;
  readonly label: string;
  readonly text: string;
  readonly highlight?: boolean;
}

export interface TooltipLink {
  readonly key: string;
  readonly label: string;
  readonly href: string;
  readonly target?: string;
  readonly onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export interface TooltipContent {
  readonly properties?: readonly TooltipProperty[];
  readonly links?: readonly TooltipLink[];
}

export function tooltipValue(value: unknown): string {
  if (value === undefined) {
    return '—';
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value) ?? '—';
    } catch {
      return '[unavailable]';
    }
  }
  return String(value);
}

/** Only explicitly supplied values are exposed; renderer objects are never enumerated. */
export function tooltipProperties(
  values: ReadonlyArray<readonly [key: string, value: unknown, label?: string]>
): TooltipProperty[] {
  return values.map(([key, value, label]) => ({ key, label: label ?? key, text: tooltipValue(value) }));
}

export function TooltipPropertyTable({
  properties = [],
  links = [],
  renderLink,
}: TooltipContent & { renderLink?: (link: TooltipLink) => ReactNode }) {
  if (!properties.length && !links.length) {
    return null;
  }
  return (
    <table className={`${tooltipSkin} mapgl-tooltip-properties`}>
      <tbody>
        {properties.map((property) => (
          <tr key={property.key} data-field={property.key} data-highlight={property.highlight || undefined}>
            <th>{property.label}</th>
            <td>
              {/^https?:\/\/\S+$/.test(property.text) ? (
                <a href={property.text} target="_blank" rel="noreferrer">
                  {property.text}
                </a>
              ) : (
                property.text
              )}
            </td>
          </tr>
        ))}
        {links.map((link) => (
          <tr key={link.key}>
            <th>Link</th>
            <td colSpan={2}>
              {renderLink ? (
                renderLink(link)
              ) : (
                <a href={link.href} target={link.target} onClick={link.onClick} rel="noreferrer">
                  {link.label}
                </a>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
