// Copyright (c) Trung Le
// Distributed under the terms of the Modified BSD License.
import { BaseEChartsWidgetModel } from './baseWidgetModel';
import { BaseEChartsWidgetView } from './baseWidgetView';

export class EChartsRawWidgetModel extends BaseEChartsWidgetModel {
  static model_name = 'EChartsRawWidgetModel';
  static view_name = 'EChartsRawWidgetView';
}

export class EChartsRawWidgetView extends BaseEChartsWidgetView {
  _createOptionDict(): any {
    return this.model.get('option');
  }

  static themeManager = BaseEChartsWidgetView.themeManager;
}
