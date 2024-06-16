// Copyright (c) Trung Le
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IUpdateManager, IUpdateManagerToken } from './types';
import { DOMWidgetModel } from '@jupyter-widgets/base';

const PLUGIN_ID = 'ipecharts:updateManager';

class UpdateManager implements IUpdateManager {
  constructor() {}

  sendUpdateSignal(model: DOMWidgetModel): void {
    const roots = this.findRoot(model);
    roots.forEach(m => {
      m.trigger('change');
    });
  }
  findRoot(model: DOMWidgetModel): DOMWidgetModel[] {
    const result: DOMWidgetModel[] = [];

    let parentAtThatlevel = this._modelMap.get(model) ?? new Set();
    parentAtThatlevel = new Set([...parentAtThatlevel]);
    while (parentAtThatlevel.size > 0) {
      const cloned = new Set([...parentAtThatlevel]);
      cloned.forEach(it => {
        parentAtThatlevel.delete(it);
        if (this._modelMap.has(it)) {
          const nextLevel = this._modelMap.get(it);
          nextLevel?.forEach(el => {
            parentAtThatlevel.add(el);
          });
        } else {
          result.push(it);
        }
      });
    }

    return result;
  }
  registerModel(model: DOMWidgetModel): void {
    const setParentId = (m: any) => {
      if (m?.['model_id']) {
        this.registerChildModel({ child: m, parent: model });
      } else if (Array.isArray(m)) {
        m.forEach(c => setParentId(c));
      }
    };
    Object.values(model.attributes).forEach(m => setParentId(m));
  }

  registerChildModel(options: {
    child: DOMWidgetModel;
    parent: DOMWidgetModel;
  }): void {
    const { child, parent } = options;
    if (child?.model_id && parent?.model_id) {
      if (this._modelMap.has(child)) {
        const currentSet = this._modelMap.get(child);
        currentSet?.add(parent);
      } else {
        this._modelMap.set(child, new Set([parent]));
      }
    }
  }

  unregisterModel(model: DOMWidgetModel): void {
    this._modelMap.delete(model);
  }
  private _modelMap = new WeakMap<DOMWidgetModel, Set<DOMWidgetModel>>();
}
/**
 * Activate the widget extension.
 */
function activate(app: JupyterFrontEnd): IUpdateManager {
  return new UpdateManager();
}

/**
 * The example plugin.
 */
export const updateManagerPlugin: JupyterFrontEndPlugin<IUpdateManager> = {
  id: PLUGIN_ID,
  description: 'A JupyterLab extension.',
  requires: [],
  provides: IUpdateManagerToken,
  activate: activate,
  autoStart: true
};
