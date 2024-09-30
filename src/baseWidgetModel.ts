// Copyright (c) Trung Le
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  ISerializers,
  unpack_models
} from '@jupyter-widgets/base';
import { MODULE_NAME, MODULE_VERSION } from './version';
import { IUpdateManager } from './types';

export abstract class BaseEChartsWidgetModel extends DOMWidgetModel {
  defaults() {
    const constructor = this.constructor as typeof BaseEChartsWidgetModel;
    return {
      ...super.defaults(),
      _model_module: constructor.model_module,
      _model_module_version: constructor.model_module_version,

      _view_module: constructor.view_module,
      _view_module_version: constructor.view_module_version,

      _model_name: constructor.model_name,
      _view_name: constructor.view_name,

      option: {},
      style: {},
      theme: null,
      renderer: 'canvas',
      device_pixel_ratio: window.devicePixelRatio,
      locale: 'EN',
      use_dirty_rect: false,
      height: '',
      width: ''
    };
  }
  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    option: { deserialize: unpack_models as any }
  };

  static updateManager: IUpdateManager | null = null;

  static model_name = 'BaseEChartsModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;

  static view_name = 'BaseEChartsView';
  static view_module = MODULE_NAME;
  static view_module_version = MODULE_VERSION;
}
