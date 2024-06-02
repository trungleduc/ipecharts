// Copyright (c) Trung Le
// Distributed under the terms of the Modified BSD License.

import { updateManagerPlugin } from './updateManager';
import { widgetPlugin } from './plugin';

export * from './version';
export * from './widget';
export * from './option';

export default [widgetPlugin, updateManagerPlugin];
