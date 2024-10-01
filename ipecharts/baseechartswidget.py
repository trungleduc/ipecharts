from ipywidgets import DOMWidget, widget_serialization
from traitlets import Bool, Dict, Float, Instance, Unicode

from .option.option import Option
from ._frontend import module_name, module_version


class BaseEchartsWidget(DOMWidget):
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    option = Instance(Option, kw={}, args=()).tag(sync=True, **widget_serialization)
    style = Dict({}, help="Style configuration").tag(sync=True)
    theme = Unicode(
        None, allow_none=True, help="Theme to be applied. Defaults to ThemeManager."
    ).tag(sync=True)

    device_pixel_ratio = Float(
        allow_none=True,
        help="Ratio of one physical pixel to the size of one device independent pixels. Browser's window.devicePixelRatio is used by default.",
    ).tag(sync=True)
    renderer = Unicode(
        default_value="canvas", help="Renderer type: 'canvas' or 'svg'"
    ).tag(sync=True)
    use_dirty_rect = Bool(
        default_value=False,
        help="Enable dirty rectangle rendering or not, false by default.",
    ).tag(sync=True)
    use_coarse_pointer = Bool(
        default_value=False,
        help="Whether to expand the response area when interacting with elements. null means enabling for mobile devices; true means always enabling; false means always disabling",
    ).tag(sync=True)
    pointer_size = Float(
        allow_none=True,
        default_value=None,
        help="Size of expanded interaction size in pixels. It should be used along with use_coarse_pointer.",
    ).tag(sync=True)
    width = Unicode(
        default_value="auto",
        allow_none=True,
        help="Specify width explicitly, in pixel. If not set or set to None, a default .echarts-widget-auto-width class is added with 100%.",
    ).tag(sync=True)
    height = Unicode(
        default_value="auto",
        allow_none=True,
        help="Specify height explicitly, in pixel. If not set or set to None, a default .echarts-widget-auto-height class is added with 500px.",
    ).tag(sync=True)
    locale = Unicode(
        default_value="EN",
        help="Specify the locale.There are two builtins: 'ZH' and 'EN'",
    ).tag(sync=True)
