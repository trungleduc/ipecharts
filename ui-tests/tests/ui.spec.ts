import { expect, test, galata } from '@jupyterlab/galata';
import path from 'path';

test.use({ autoGoto: false });

test.describe('UI Test', () => {
  test.describe('Extension activation test', () => {
    test('should emit an activation console message', async ({
      page,
      request
    }) => {
      const logs: string[] = [];

      page.on('console', message => {
        logs.push(message.text());
      });

      await page.goto();
      expect(
        logs.filter(s => s === 'ipecharts extension activated')
      ).toHaveLength(1);
    });
  });
  test.describe('Extension activation test', () => {
    test.beforeAll(async ({ request }) => {
      const content = galata.newContentsHelper(request);
      await content.deleteDirectory('/example');
      await content.uploadDirectory(
        path.resolve(__dirname, '../../example'),
        '/example'
      );
    });
    let errors = 0;
    test.beforeEach(async ({ page }) => {
      page.setViewportSize({ width: 1920, height: 1080 });
      page.on('console', message => {
        if (message.type() === 'error') {
          errors += 1;
        }
      });
    });
    test.afterEach(async ({ page }) => {
      errors = 0;
    });
    test('should render the widget', async ({ page, request }) => {
      await page.goto();
      const fullPath = 'example/example.ipynb';
      await page.notebook.openByPath(fullPath);
      await page.notebook.activate(fullPath);
      await page.waitForTimeout(1000);
      const kernelButton = await page.locator('.jp-Dialog .jp-mod-accept');
      if ((await kernelButton.count()) > 0) {
        await kernelButton.click();
        await page.waitForTimeout(1000);
      }
      let widgetIndex = 0;
      await page.notebook.runCellByCell({
        onAfterCellRun: async (cellIndex: number) => {
          const cell = await page.notebook.getCellOutputLocator(cellIndex);
          if (cell) {
            const widget = await cell.locator('div.echarts-widget');
            const count = await widget.count();
            if (count > 0) {
              widgetIndex += 1;
              await new Promise(_ => setTimeout(_, 1000));
              expect(await cell.screenshot()).toMatchSnapshot({
                name: `Widget-at-cell-${widgetIndex}.png`
              });
            }
          }
        }
      });
    });
  });
});
