// Copyright (c) Trung Le
// Distributed under the terms of the Modified BSD License.
import {
  DOMWidgetModel,
  DOMWidgetView,
  WidgetView
} from '@jupyter-widgets/base';
import { IThemeManager } from '@jupyterlab/apputils';
import { Debouncer } from '@lumino/polling';
import * as echarts from 'echarts';
import 'echarts-gl';
import { isLightTheme } from './tools';
import { MODULE_NAME, MODULE_VERSION } from './version';
export class EChartsRawWidgetModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: EChartsRawWidgetModel.model_name,
      _model_module: EChartsRawWidgetModel.model_module,
      _model_module_version: EChartsRawWidgetModel.model_module_version,
      _view_name: EChartsRawWidgetModel.view_name,
      _view_module: EChartsRawWidgetModel.view_module,
      _view_module_version: EChartsRawWidgetModel.view_module_version,
      option: {}
    };
  }

  static model_name = 'EChartsRawWidgetModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'EChartsRawWidgetView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

export class EChartsRawWidgetView extends DOMWidgetView {
  initialize(
    parameters: WidgetView.IInitializeParameters<DOMWidgetModel>
  ): void {
    super.initialize(parameters);
    if (EChartsRawWidgetView.themeManager) {
      const themeManager = EChartsRawWidgetView.themeManager;
      themeManager.themeChanged.connect(() => {
        const currentTheme = isLightTheme() ? 'light' : 'dark';
        if (this._myChart) {
          this._myChart.dispose();
          this._myChart = echarts.init(this.el, currentTheme);
          this._myChart.setOption(this.model.get('option'));
        }
      });
    }
    const resizeChart = () => this._myChart?.resize();
    const debouncer = new Debouncer(resizeChart, 100);
    window.addEventListener('resize', () => {
      debouncer.invoke();
    });
  }

  render() {
    super.render();

    const currentTheme = isLightTheme() ? 'light' : 'dark';
    const chartOption = this.model.get('option');

    const widget = this.luminoWidget;
    widget.addClass('echarts-widget');
    this._myChart = echarts.init(this.el, currentTheme);
    this._myChart.setOption(chartOption);
  }

  processLuminoMessage(msg: any) {
    if (msg['type'] === 'resize' || msg['type'] === 'after-attach') {
      window.dispatchEvent(new Event('resize'));
    }
  }
  static themeManager: IThemeManager | null = null;
  private _myChart?: echarts.ECharts;
}
