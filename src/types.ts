// Copyright (c) Trung Le
// Distributed under the terms of the Modified BSD License.

import { DOMWidgetModel } from '@jupyter-widgets/base';
import { Token } from '@lumino/coreutils';

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
