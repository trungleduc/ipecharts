const path = require('path');
const version = require('./package.json').version;

// Custom webpack rules
const rules = [
  { test: /\.ts$/, loader: 'ts-loader' },
  { test: /\.css$/, use: ['style-loader', 'css-loader'] },
  {
    test: /\.(woff|woff2|eot|ttf|otf)$/,
    type: 'asset/resource'
  }
];

// Packages that shouldn't be bundled but loaded at runtime
const externals = [
  '@jupyter-widgets/base',
  '@jupyterlab/application',
  '@jupyterlab/apputils'
];

const resolve = {
  extensions: ['.ts', '.js']
};

module.exports = [
  /**
   * Notebook extension
   *
   * This bundle only contains the part of the JavaScript that is run on load of
   * the notebook.
   */
  {
    entry: './src/extension.ts',
    output: {
      filename: 'extension.js',
      path: path.resolve(__dirname, 'ipecharts', 'nbextension'),
      libraryTarget: 'amd',
      publicPath: ''
    },
    module: {
      rules: rules
    },
    devtool: 'source-map',
    externals,
    resolve
  },
  /** Bundle for the notebook containing the custom widget views and models
   *
   * This bundle contains the implementation for the custom widget views and
   * custom widget.
   * It must be an amd module
   */
  {
    entry: './src/notebook.ts',
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'ipecharts', 'nbextension'),
      libraryTarget: 'amd'
    },
    devtool: 'source-map',
    module: {
      rules: rules
    },
    externals,
    resolve
  },
  /**
   * Embeddable ipecharts bundle
   *
   * This bundle is almost identical to the notebook extension bundle. The only
   * difference is in the configuration of the webpack public path for the
   * static assets.
   *
   * The target bundle is always `dist/index.js`, which is the path required by
   * the custom widget embedder.
   */
  {
    entry: './src/notebook.ts',
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'dist'),
      libraryTarget: 'amd',
      library: 'ipecharts',
      publicPath: 'https://unpkg.com/ipecharts@' + version + '/dist/'
    },
    devtool: 'source-map',
    module: {
      rules: rules
    },
    externals,
    resolve
  }
];
