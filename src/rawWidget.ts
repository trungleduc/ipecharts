// Copyright (c) Trung Le
// Distributed under the terms of the Modified BSD License.
import * as echarts from 'echarts';
import 'echarts-gl';
import { isLightTheme } from './tools';
import { BaseEChartsWidgetModel, BaseEChartsWidgetView } from './baseWidget';
export class EChartsRawWidgetModel extends BaseEChartsWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: EChartsRawWidgetModel.model_name,
      _view_name: EChartsRawWidgetModel.view_name
    };
  }

  static model_name = 'EChartsRawWidgetModel';
  static view_name = 'EChartsRawWidgetView';
}

export class EChartsRawWidgetView extends BaseEChartsWidgetView {
  value_changed(): void {
    //no-op
  }

  protected initEcharts(): void {
    const currentTheme = isLightTheme() ? 'light' : 'dark';
    const chartOption = this.model.get('option');
    this._myChart = echarts.init(this.el, currentTheme);
    this._myChart.setOption(chartOption);
  }
}
