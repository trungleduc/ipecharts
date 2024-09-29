from traitlets import Unicode, Dict
from ipywidgets import widget_serialization
from .baseechartswidget import BaseEchartsWidget


class EChartsWidget(BaseEchartsWidget):
    _model_name = Unicode("EChartsWidgetModel").tag(sync=True)
    _view_name = Unicode("EChartsWidgetView").tag(sync=True)


class EChartsRawWidget(BaseEchartsWidget):
    _model_name = Unicode("EChartsRawWidgetModel").tag(sync=True)
    _view_name = Unicode("EChartsRawWidgetView").tag(sync=True)
    option = Dict(default_value={}).tag(sync=True, **widget_serialization)
