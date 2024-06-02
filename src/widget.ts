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
import { isLightTheme } from './tools';
import { Debouncer } from '@lumino/polling';
export class EChartsWidgetModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: EChartsWidgetModel.model_name,
      _model_module: EChartsWidgetModel.model_module,
      _model_module_version: EChartsWidgetModel.model_module_version,
      _view_name: EChartsWidgetModel.view_name,
      _view_module: EChartsWidgetModel.view_module,
      _view_module_version: EChartsWidgetModel.view_module_version,
      option: {}
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    option: { deserialize: unpack_models as any }
    // Add any extra serializers here
  };

  initialize(attributes: ObjectHash, options: IBackboneModelOptions): void {
    super.initialize(attributes, options);
    if (EChartsWidgetModel.updateManager) {
      EChartsWidgetModel.updateManager.registerModel(this);
    }
  }

  static updateManager: IUpdateManager | null = null;

  static model_name = 'EChartsWidgetModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'EChartsWidgetView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

export class EChartsWidgetView extends DOMWidgetView {
  initialize(
    parameters: WidgetView.IInitializeParameters<DOMWidgetModel>
  ): void {
    super.initialize(parameters);
    if (EChartsWidgetView.themeManager) {
      const themeManager = EChartsWidgetView.themeManager;
      themeManager.themeChanged.connect(() => {
        const currentTheme = isLightTheme() ? 'light' : 'dark';
        if (this._myChart) {
          this._myChart.dispose();
          this._myChart = echarts.init(this.el, currentTheme);
          this._myChart.setOption(this._createOptionDict());
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

  render() {
    super.render();

    const currentTheme = isLightTheme() ? 'light' : 'dark';

    const widget = this.luminoWidget;
    widget.addClass('echarts-widget');
    this._myChart = echarts.init(this.el, currentTheme);

    this._myChart.setOption(this._createOptionDict());
  }

  value_changed() {
    if (this._myChart) {
      this._myChart.setOption(this._createOptionDict());
    }
  }
  processLuminoMessage(msg: any) {
    if (msg['type'] === 'resize' || msg['type'] === 'after-attach') {
      window.dispatchEvent(new Event('resize'));
    }
  }

  _createOptionDict(): { [key: string]: any } {
    const option = this.model.get('option');
    const optionDict: { [key: string]: any } = option.toDict();

    const chartOption: { [key: string]: any } = {};
    for (const [key, val] of Object.entries(optionDict)) {
      if (!val) {
        continue;
      }
      if (val.toDict) {
        chartOption[key] = val.toDict();
      } else if (Array.isArray(val)) {
        const valArray = val.map(it => (it.toDict ? it.toDict() : it));
        chartOption[key] = valArray;
      } else {
        chartOption[key] = val;
      }
    }

    return chartOption;
  }

  static themeManager: IThemeManager | null = null;
  private _myChart?: echarts.ECharts;
}
