// Copyright (c) Trung Le
// Distributed under the terms of the Modified BSD License.
import 'echarts-gl';

import { DOMWidgetView, WidgetView } from '@jupyter-widgets/base';
import { IThemeManager } from '@jupyterlab/apputils';
import { Debouncer } from '@lumino/polling';
import * as echarts from 'echarts';

import { BaseEChartsWidgetModel, INIT_PROPS } from './baseWidgetModel';
import { isLightTheme } from './tools';
import { IDict, IEventHandlerParams, IKernelMsg } from './types';

export abstract class BaseEChartsWidgetView extends DOMWidgetView {
  initialize(parameters: WidgetView.IInitializeParameters): void {
    super.initialize(parameters);
    this.setupThemeListener();
    this.setupResizeListener();
    this.model.listenTo(this.model, 'change', this.valueChanged.bind(this));
    this.model.listenTo(this.model, 'msg:custom', this.onCustomMsg.bind(this));
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
    this.setStyle();
  }

  processLuminoMessage(msg: any): void {
    const msgType = msg.type as string;
    if (msgType === 'after-attach') {
      this.initECharts();
      this._myChart?.resize();
    }
    if (msgType === 'resize') {
      this._resizeDebouncer.invoke();
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

  onCustomMsg(data: IKernelMsg): void {
    const { action, payload } = data;
    switch (action) {
      case 'register_event': {
        const { event, query, handler_id } = payload;
        const cb = (params: any) => {
          const paramsStr = JSON.stringify(params, (key, value) => {
            return key === 'event' ? undefined : value;
          });
          const msg: IEventHandlerParams = {
            action: 'event_handler_params',
            payload: {
              event,
              handlerId: handler_id,
              params: JSON.parse(paramsStr)
            }
          };
          this.send(msg);
        };

        if (typeof query !== 'string') {
          this._myChart?.on(event, query, cb, this);
        } else {
          if (query === '__all__') {
            this._myChart?.on(event, cb, this);
          } else {
            this._myChart?.on(event, query, cb, this);
          }
        }

        const eventDict = this._eventHandlers[event];

        if (eventDict) {
          eventDict[handler_id] = cb;
        } else {
          this._eventHandlers[event] = { [handler_id]: cb };
        }
        break;
      }
      case 'unregister_event': {
        const { event, id_to_remove } = payload;
        if (!id_to_remove) {
          this._myChart?.off(event);
          delete this._eventHandlers[event];
        } else {
          id_to_remove.forEach(handlerId => {
            const cb = this._eventHandlers[event]?.[handlerId];
            if (cb) {
              this._myChart?.off(event, cb);
              delete this._eventHandlers[event][handlerId];
            }
          });
        }

        break;
      }
      case 'dispatch_action': {
        this._myChart?.dispatchAction(payload);
        break;
      }
      default:
        break;
    }
  }
  abstract _createOptionDict(): any;

  static themeManager: IThemeManager | null = null;

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
    window.addEventListener('resize', () => this._resizeDebouncer.invoke());
  }

  protected _myChart?: echarts.ECharts;

  private _eventHandlers: IDict<IDict<CallableFunction>> = {};
  private _resizeDebouncer = new Debouncer(() => {
    if (this.el.clientWidth > 10 && this.el.clientHeight > 10) {
      // Do not resize if the element is hidden
      this._myChart?.resize();
    }
  }, 100);
}
