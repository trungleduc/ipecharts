// Copyright (c) Trung Le
// Distributed under the terms of the Modified BSD License.
import { BaseEChartsWidgetModel } from './baseWidgetModel';
import { BaseEChartsWidgetView } from './baseWidgetView';
import { processRawOption } from './tools';

export class EChartsRawWidgetModel extends BaseEChartsWidgetModel {
  static model_name = 'EChartsRawWidgetModel';
  static view_name = 'EChartsRawWidgetView';
}

export class EChartsRawWidgetView extends BaseEChartsWidgetView {
  _createOptionDict(): any {
    const option = JSON.parse(JSON.stringify(this.model.get('option')));
    processRawOption(option);
    return option;
  }

  static themeManager = BaseEChartsWidgetView.themeManager;
}
