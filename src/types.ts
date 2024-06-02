import { DOMWidgetModel } from '@jupyter-widgets/base';
import { Token } from '@lumino/coreutils';

export interface IUpdateManager {
  findRoot(modeId: DOMWidgetModel): DOMWidgetModel[];
  sendUpdateSignal(modeId: DOMWidgetModel): void;
  registerModel(model: DOMWidgetModel): void;
  unregisterModel(model: DOMWidgetModel): void;
}

export const IUpdateManagerToken = new Token<IUpdateManager>(
  'ipechartUpdateManager'
);
