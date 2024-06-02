from ipywidgets import Widget
from traitlets import Dict, Unicode

from ._frontend import module_name, module_version


class BaseWidget(Widget):
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    unknown_attrs = Dict(default_value=None, allow_none=True).tag(sync=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        unknown_attrs = {}
        for args in kwargs:
            if not hasattr(self, args):
                unknown_attrs[args] = kwargs[args]
        if len(unknown_attrs) > 0:
            self.unknown_attrs = unknown_attrs
