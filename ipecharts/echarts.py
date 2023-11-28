from ipywidgets import DOMWidget, widget_serialization
from traitlets import Instance, Unicode

from .option.option import Option
from ._frontend import module_name, module_version


class EChartsWidget(DOMWidget):
    _model_name = Unicode("EChartsWidgetModel").tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode("EChartsWidgetView").tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    option = Instance(Option, kw={}, args=()).tag(sync=True, **widget_serialization)
