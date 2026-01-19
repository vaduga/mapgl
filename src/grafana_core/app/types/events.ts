import { AnnotationQuery, BusEventBase, BusEventWithPayload, eventFactory } from '@grafana/data';
import { IconName, ButtonVariant } from '@grafana/ui';
import { HistoryEntryView } from '../core/components/AppChrome/types';

/**
 * Event Payloads
 */

export interface ShowDashSearchPayload {
    query?: string;
}

export interface LocationChangePayload {
    href: string;
}

export interface ShowModalPayload {
    model?: any;
    modalClass?: string;
    src?: string;
    templateHtml?: string;
    backdrop?: any;
    scope?: any;
}

export interface ShowModalReactPayload {
    component: React.ComponentType<any>;
    props?: any;
}

export interface ShowConfirmModalPayload {
    title?: string;
    text?: string;
    text2?: string;
    text2htmlBind?: boolean;
    confirmText?: string;
    altActionText?: string;
    yesText?: string;
    noText?: string;
    icon?: IconName;
    yesButtonVariant?: ButtonVariant;

    onDismiss?: () => void;
    onConfirm?: () => void;
    onAltAction?: () => void;
}

export interface ToggleKioskModePayload {
    exit?: boolean;
}

export interface GraphClickedPayload {
    pos: any;
    panel: any;
    item: any;
}

export interface ThresholdChangedPayload {
    threshold: any;
    handleIndex: number;
}

export class PanelQueriesChangedEvent extends BusEventBase {
    static type = 'panel-queries-changed';
}

/**
 * Used for syncing transformations badge count in panel edit transform tab
 * Think we can get rid of this soon
 */
export class PanelTransformationsChangedEvent extends BusEventBase {
    static type = 'panel-transformations-changed';
}

/**
 * Used by panel editor to know when panel plugin itself trigger option updates
 */
export class PanelOptionsChangedEvent extends BusEventBase {
    static type = 'panels-options-changed';
}



export class RenderEvent extends BusEventBase {
    static type = 'render';
}



interface PasteTimeEventPayload {
    updateUrl?: boolean;
}

export class PasteTimeEvent extends BusEventWithPayload<PasteTimeEventPayload> {
    static type = 'paste-time';
}

interface AbsoluteTimeEventPayload {
    updateUrl: boolean;
}


