import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';

import * as widgetExports from './widget';
import * as subWidgetExport from './option';

import { MODULE_NAME, MODULE_VERSION } from './version';

const EXTENSION_ID = 'ipecharts:plugin';

/**
 * The example plugin.
 */
export const widgetPlugin: JupyterFrontEndPlugin<void> = {
  id: EXTENSION_ID,
  description: 'A JupyterLab extension.',
  requires: [IJupyterWidgetRegistry],
  activate: activateWidgetExtension,
  autoStart: true
};

/**
 * Activate the widget extension.
 */
function activateWidgetExtension(
  app: JupyterFrontEnd,
  registry: IJupyterWidgetRegistry
): void {
  registry.registerWidget({
    name: MODULE_NAME,
    version: MODULE_VERSION,
    exports: { ...widgetExports, ...subWidgetExport }
  });
}
