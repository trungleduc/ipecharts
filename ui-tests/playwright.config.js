/**
 * Configuration for Playwright using default from @jupyterlab/galata
 */
const baseConfig = require('@jupyterlab/galata/lib/playwright-config');

module.exports = {
  ...baseConfig,
  webServer: {
    command: 'jlpm start',
    url: 'http://localhost:8888/lab',
    timeout: 10 * 1000,
    reuseExistingServer: false
  },
  retries: 0,
  use: {
    ...baseConfig.use,
    trace: 'off'
  },
  expect: {
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.02
    }
  }
};
