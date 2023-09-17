// Copyright (c) Trung Le
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers
} from '@jupyter-widgets/base';

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
    ...DOMWidgetModel.serializers
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
    this.el.classList.add('echarts-widget');
    console.log('hello', this.model.get('option'));

    this.model.on('change:option', this.value_changed, this);
  }

  value_changed(a: any, b: any) {}
}
