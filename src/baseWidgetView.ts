// Copyright (c) Trung Le
// Distributed under the terms of the Modified BSD License.

import { DOMWidgetView, WidgetView } from '@jupyter-widgets/base';
import { IThemeManager } from '@jupyterlab/apputils';
import { Debouncer } from '@lumino/polling';
import * as echarts from 'echarts';
import 'echarts-gl';
import { isLightTheme } from './tools';

export abstract class BaseEChartsWidgetView extends DOMWidgetView {
  initialize(parameters: WidgetView.IInitializeParameters): void {
    super.initialize(parameters);
    this.setupThemeListener();
    this.setupResizeListener();

    // Define arrays of properties
    const initProps = [
      'theme',
      'device_pixel_ratio',
      'renderer',
      'use_dirty_rect',
      'use_coarse_pointer',
      'pointer_size',
      'width',
      'height',
      'locale'
    ];
    // Set up listeners for init properties
    initProps.forEach(prop => {
      this.model.on(`change:${prop}`, this.recreateChart, this);
    });
    this.model.on('change:style', this.setStyle, this);
    this.model.on('change', this.value_changed, this);
  }

  render(): void {
    super.render();

    const widget = this.luminoWidget;

    if (this.model.get('width') === 'auto') {
      widget.addClass('echarts-widget-auto-width');
    }
    if (this.model.get('height') === 'auto') {
      widget.addClass('echarts-widget-auto-height');
    }

    this.initECharts();
    this.setStyle();
  }

  processLuminoMessage(msg: any): void {
    const msgType = msg.type as string;

    if (msgType === 'resize' || msgType === 'after-attach') {
      window.dispatchEvent(new Event('resize'));
    }
  }

  protected recreateChart(): void {
    this._myChart?.dispose();
    this.initECharts();
  }

  initECharts(): void {
    let theme = this.model.get('theme');

    if (!theme) {
      if (BaseEChartsWidgetView.themeManager) {
        theme = isLightTheme() ? 'light' : 'dark';
      } else {
        theme = 'light';
      }
    }
    const devicePixelRatio = this.model.get('device_pixel_ratio');
    const renderer = this.model.get('renderer');
    const useDirtyRect = this.model.get('use_dirty_rect');
    const useCoarsePointer = this.model.get('use_coarse_pointer');
    const pointerSize = this.model.get('pointer_size');
    const width = this.model.get('width');
    const height = this.model.get('height');
    const locale = this.model.get('locale');

    const initOptions = {
      devicePixelRatio,
      renderer,
      useDirtyRect,
      useCoarsePointer,
      pointerSize,
      width,
      height,
      locale
    };

    this._myChart = echarts.init(this.el, theme, initOptions);
    this._myChart.setOption(this._createOptionDict());
  }

  value_changed() {
    if (this._myChart) {
      this._myChart.setOption(this._createOptionDict());
    }
  }

  abstract _createOptionDict(): any;

  setStyle(): void {
    const style = (this.model.get('style') as { [key: string]: string }) || {};
    for (const [key, value] of Object.entries(style)) {
      const cssKey = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
      this.el.style.setProperty(cssKey, value);
    }
    this._myChart?.resize();
  }

  protected setupThemeListener(): void {
    const themeManager = BaseEChartsWidgetView.themeManager;
    if (themeManager) {
      themeManager.themeChanged.connect(() => {
        this.recreateChart();
      });
    }
  }

  protected setupResizeListener(): void {
    const resizeChart = () => this._myChart?.resize();
    const debouncer = new Debouncer(resizeChart, 100);
    window.addEventListener('resize', () => debouncer.invoke());
  }

  update_classes(old_classes: string[], new_classes: string[]): void {
    super.update_classes(old_classes, new_classes);
    this._myChart?.resize();
  }

  static themeManager: IThemeManager | null = null;
  protected _myChart?: echarts.ECharts;
}
