// This is the entry point for the notebook extension,
// We only export a subset of the things we do in index.ts, since
// certain exports like JupyterFrontEndPlugin are not necessary, or supported in the notebook context.

import '../style/base.css';

export { updateManagerPlugin } from './updateManager';
export * from './version';
export * from './widget';
export * from './rawWidget';
export * from './option';
