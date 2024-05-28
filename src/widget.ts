// Copyright (c) Trung Le
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
  unpack_models
} from '@jupyter-widgets/base';
import * as echarts from 'echarts';
import { MODULE_NAME, MODULE_VERSION } from './version';
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

  static model_name = 'EChartsWidgetModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'EChartsWidgetView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

export class EChartsWidgetView extends DOMWidgetView {
  render() {
    super.render();

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

    const widget = this.luminoWidget;
    widget.addClass('echarts-widget');
    const myChart = echarts.init(this.el);
    delete chartOption['geo'];
    myChart.setOption(chartOption);
    window.addEventListener('resize', () => {
      myChart.resize();
    });
  }

  processLuminoMessage(msg: any) {
    if (msg['type'] === 'resize' || msg['type'] === 'after-attach') {
      window.dispatchEvent(new Event('resize'));
    }
  }
}
