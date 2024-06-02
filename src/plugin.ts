import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';

import * as widgetExports from './widget';
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
  activate: activateWidgetExtension,
  autoStart: true
};

/**
 * Activate the widget extension.
 */
function activateWidgetExtension(
  app: JupyterFrontEnd,
  registry: IJupyterWidgetRegistry,
  updateManager: IUpdateManager
): void {
  const allExports = { ...widgetExports, ...subWidgetExport };
  for (const Class of Object.values(allExports)) {
    if (Object.getOwnPropertyDescriptor(Class, 'updateManager')) {
      (Class as any).updateManager = updateManager;
    }
  }
  registry.registerWidget({
    name: MODULE_NAME,
    version: MODULE_VERSION,
    exports: allExports
  });
}
