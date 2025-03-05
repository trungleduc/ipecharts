// Copyright (c) Trung Le
// Distributed under the terms of the Modified BSD License.

import { DOMWidgetModel } from '@jupyter-widgets/base';
import { Token } from '@lumino/coreutils';

export interface IDict<T = any> {
  [key: string]: T;
}
export interface IUpdateManager {
  findRoot(modeId: DOMWidgetModel): DOMWidgetModel[];
  sendUpdateSignal(modeId: DOMWidgetModel): void;
  registerModel(model: DOMWidgetModel): void;
  registerChildModel(options: {
    child: DOMWidgetModel;
    parent: DOMWidgetModel;
  }): void;
  unregisterModel(model: DOMWidgetModel): void;
}

export const IUpdateManagerToken = new Token<IUpdateManager>(
  'ipechartUpdateManager'
);

export interface IRegisterEventMsg {
  action: 'register_event';
  payload: { event: string; query: string | IDict; handler_id: string };
}

export interface IUnregisterEventMsg {
  action: 'unregister_event';
  payload: { event: string; id_to_remove?: string[] };
}

export interface IDispatchActionMsg {
  action: 'dispatch_action';
  payload: echarts.Payload;
}

export type IKernelMsg =
  | IRegisterEventMsg
  | IUnregisterEventMsg
  | IDispatchActionMsg;

export interface IEventHandlerParams {
  action: 'event_handler_params';
  payload: {
    event: string;
    handlerId: string;
    params?: any;
  };
}

export interface IWidgetInitMessage {
  action: 'widget_init';
}

export type IFrontendMsg = IEventHandlerParams | IWidgetInitMessage;
