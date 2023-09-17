from ipywidgets import Widget
from traitlets import Unicode

from ._frontend import module_name, module_version


class BaseWidget(Widget):
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)
