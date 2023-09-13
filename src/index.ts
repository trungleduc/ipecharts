import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the ipecharts extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'ipecharts:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension ipecharts is activated!');
  }
};

export default plugin;
