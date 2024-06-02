// Copyright (c) Trung Le
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IThemeManager } from '@jupyterlab/apputils';
import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';

import * as widgetExports from './widget';
import * as rawWidgetExports from './rawWidget';
import * as subWidgetExport from './option';

import { MODULE_NAME, MODULE_VERSION } from './version';
import { IUpdateManager, IUpdateManagerToken } from './types';

const EXTENSION_ID = 'ipecharts:plugin';

/**
 * The example plugin.
 */
export const widgetPlugin: JupyterFrontEndPlugin<void> = {
  id: EXTENSION_ID,
  description: 'A JupyterLab extension.',
  requires: [IJupyterWidgetRegistry, IUpdateManagerToken],
  optional: [IThemeManager],
  activate: activateWidgetExtension,
  autoStart: true
};

/**
 * Activate the widget extension.
 */
function activateWidgetExtension(
  app: JupyterFrontEnd,
  registry: IJupyterWidgetRegistry,
  updateManager: IUpdateManager,
  themeManager?: IThemeManager
): void {
  const allExports = {
    ...widgetExports,
    ...subWidgetExport,
    ...rawWidgetExports
  };
  for (const Class of Object.values(allExports)) {
    if (Object.getOwnPropertyDescriptor(Class, 'updateManager')) {
      (Class as any).updateManager = updateManager;
    }
  }
  if (themeManager) {
    widgetExports.EChartsWidgetView.themeManager = themeManager;
    rawWidgetExports.EChartsRawWidgetView.themeManager = themeManager;
  }
  registry.registerWidget({
    name: MODULE_NAME,
    version: MODULE_VERSION,
    exports: allExports
  });
}
