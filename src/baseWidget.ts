// Copyright (c) Trung Le
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  IBackboneModelOptions,
  ISerializers,
  WidgetView,
  unpack_models
} from '@jupyter-widgets/base';
import * as echarts from 'echarts';
import 'echarts-gl';
import { MODULE_NAME, MODULE_VERSION } from './version';
import { IUpdateManager } from './types';
import { ObjectHash } from 'backbone';
import { IThemeManager } from '@jupyterlab/apputils';
import { Debouncer } from '@lumino/polling';

export class BaseEChartsWidgetModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),

      _model_module: BaseEChartsWidgetModel.model_module,
      _model_module_version: BaseEChartsWidgetModel.model_module_version,

      _view_module: BaseEChartsWidgetModel.view_module,
      _view_module_version: BaseEChartsWidgetModel.view_module_version,

      option: {},
      style: {}
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    option: { deserialize: unpack_models as any }
  };

  initialize(attributes: ObjectHash, options: IBackboneModelOptions): void {
    super.initialize(attributes, options);
    if (BaseEChartsWidgetModel.updateManager) {
      BaseEChartsWidgetModel.updateManager.registerModel(this);
    }
    this.listenTo(this, 'change', this.valueChanged);
  }

  valueChanged(m: BaseEChartsWidgetModel): void {
    if (m?.changed) {
      Object.values(m.changed).forEach(it => {
        if (Array.isArray(it)) {
          it.forEach(subModel => {
            if (subModel?.model_id) {
              BaseEChartsWidgetModel.updateManager?.registerChildModel({
                child: subModel,
                parent: m
              });
            }
          });
        } else {
          if (it?.model_id) {
            BaseEChartsWidgetModel.updateManager?.registerChildModel({
              child: it,
              parent: m
            });
          }
        }
      });
    }
  }
  static updateManager: IUpdateManager | null = null;

  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

export abstract class BaseEChartsWidgetView extends DOMWidgetView {
  initialize(
    parameters: WidgetView.IInitializeParameters<DOMWidgetModel>
  ): void {
    super.initialize(parameters);
    if (BaseEChartsWidgetView.themeManager) {
      const themeManager = BaseEChartsWidgetView.themeManager;
      themeManager.themeChanged.connect(() => {
        if (this._myChart) {
          this._myChart.dispose();
          this.initEcharts();
        }
      });
    }
    this.model.on('change', this.value_changed, this);
    const resizeChart = () => this._myChart?.resize();
    const debouncer = new Debouncer(resizeChart, 100);
    window.addEventListener('resize', () => {
      debouncer.invoke();
    });
  }

  protected abstract initEcharts(): void;

  abstract value_changed(): void;

  render() {
    super.render();

    const widget = this.luminoWidget;
    widget.addClass('echarts-widget');
    this.initEcharts();
    this.setStyle();
  }

  processLuminoMessage(msg: any) {
    if (msg['type'] === 'resize' || msg['type'] === 'after-attach') {
      window.dispatchEvent(new Event('resize'));
    }
  }
  setStyle(): void {
    const style: { [key: string]: string } = this.model.get('style');
    if (!style) {
      return;
    }
    for (const [key, value] of Object.entries(style)) {
      const fixedKey = key
        .split(/(?=[A-Z])/)
        .map(s => s.toLowerCase())
        .join('-');

      if (this.el.style) {
        this.el.style.setProperty(fixedKey, value);
      }
    }
    if (this._myChart) {
      this._myChart.resize();
    }
  }
  update_classes(old_classes: string[], new_classes: string[]): void {
    super.update_classes(old_classes, new_classes);
    if (this._myChart) {
      this._myChart.resize();
    }
  }
  static themeManager: IThemeManager | null = null;
  protected _myChart?: echarts.ECharts;
}
