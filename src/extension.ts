// This file contains the javascript that is run when the notebook is loaded.
// It contains some requirejs configuration and the `load_ipython_extension`
// which is required for any notebook extension.

// Configure requirejs
if (window.require) {
  // @ts-expect-error TypeScript thinks window.require is of type NodeJS.Require, which doesn't support config
  window.require.config({
    map: {
      '*': {
        ipecharts: 'nbextensions/ipecharts/index'
      }
    }
  });
}

// Export the required load_ipython_extension
module.exports = {
  load_ipython_extension() {}
};
