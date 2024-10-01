// Copyright (c) Trung Le
// Distributed under the terms of the Modified BSD License.
import 'echarts-gl';

import { DOMWidgetView, WidgetView } from '@jupyter-widgets/base';
import { IThemeManager } from '@jupyterlab/apputils';
import { Debouncer } from '@lumino/polling';
import * as echarts from 'echarts';

import { BaseEChartsWidgetModel, INIT_PROPS } from './baseWidgetModel';
import { isLightTheme } from './tools';

export abstract class BaseEChartsWidgetView extends DOMWidgetView {
  initialize(parameters: WidgetView.IInitializeParameters): void {
    super.initialize(parameters);
    this.setupThemeListener();
    this.setupResizeListener();
    this.model.on('change', this.valueChanged, this);
  }

  render(): void {
    super.render();

    const widget = this.luminoWidget;

    if (['auto', null].includes(this.model.get('width'))) {
      widget.addClass('echarts-widget-auto-width');
    }
    if (['auto', null].includes(this.model.get('height'))) {
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

  valueChanged(changedModel?: BaseEChartsWidgetModel) {
    if (!changedModel) {
      // Event from the update manager
      this._myChart?.setOption(this._createOptionDict());
      return;
    }
    const changedDict = changedModel.changed ?? {};
    Object.keys(changedDict).forEach(key => {
      if (key in INIT_PROPS) {
        // Init props changed
        this.recreateChart();
      } else if (key === 'style') {
        // Style changed
        this.setStyle();
      } else {
        // option or other keys changed
        this._myChart?.setOption(this._createOptionDict());
      }
    });
  }
  update_classes(old_classes: string[], new_classes: string[]): void {
    super.update_classes(old_classes, new_classes);
    this._myChart?.resize();
  }

  setStyle(): void {
    const style = (this.model.get('style') as { [key: string]: string }) || {};
    for (const [key, value] of Object.entries(style)) {
      const cssKey = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
      this.el.style.setProperty(cssKey, value);
    }
    this._myChart?.resize();
  }

  abstract _createOptionDict(): any;

  protected recreateChart(): void {
    this._myChart?.dispose();
    this.initECharts();
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

  static themeManager: IThemeManager | null = null;
  protected _myChart?: echarts.ECharts;
}
