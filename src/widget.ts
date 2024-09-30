// Copyright (c) Trung Le
// Distributed under the terms of the Modified BSD License.
import 'echarts-gl';

import * as echarts from 'echarts';

import { BaseEChartsWidgetModel, BaseEChartsWidgetView } from './baseWidget';
import { isLightTheme } from './tools';

export class EChartsWidgetModel extends BaseEChartsWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: EChartsWidgetModel.model_name,
      _view_name: EChartsWidgetModel.view_name
    };
  }

  static model_name = 'EChartsWidgetModel';

  static view_name = 'EChartsWidgetView'; // Set to null if no view
}

export class EChartsWidgetView extends BaseEChartsWidgetView {
  private _createOptionDict(): { [key: string]: any } {
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

  value_changed() {
    if (this._myChart) {
      this._myChart.setOption(this._createOptionDict());
    }
  }

  protected initEcharts(): void {
    const currentTheme = isLightTheme() ? 'light' : 'dark';
    this._myChart = echarts.init(this.el, currentTheme);
    this._myChart.setOption(this._createOptionDict());
  }
}
