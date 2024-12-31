import typing as T
from uuid import uuid4
from ipywidgets import DOMWidget, widget_serialization
from traitlets import Bool, Dict, Float, Instance, Unicode

from .tools import MESSAGE_ACTION

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

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._event_handlers: T.Dict[str, T.Dict[str, T.Callable]] = {}
        self.on_msg(self._handle_frontend_msg)

    def on(
        self, event_name: str, query: T.Union[str, T.Dict, None], handler: T.Callable
    ) -> str:
        handler_id = str(uuid4())
        if query is None:
            query = "__all__"
        event_dict = self._event_handlers.setdefault(event_name, {handler_id: handler})
        if handler_id not in event_dict:
            event_dict[handler_id] = handler

        self.send(
            {
                "action": MESSAGE_ACTION.REGISTER_EVENT,
                "payload": {
                    "event": event_name,
                    "query": query,
                    "handler_id": handler_id,
                },
            }
        )
        return handler_id

    def off(self, event_name: str, handler: T.Optional[T.Callable] = None):
        event_dict = self._event_handlers.get(event_name, {})
        if handler is None:
            # Remove all handler
            del self._event_handlers[event_name]
            self.send(
                {
                    "action": MESSAGE_ACTION.UNREGISTER_EVENT,
                    "payload": {"event": event_name},
                }
            )
        else:
            id_to_remove = []
            for handler_id, saved_handler in event_dict.items():
                if saved_handler == handler:
                    id_to_remove.append(handler_id)

            for uid in id_to_remove:
                del event_dict[uid]
            self.send(
                {
                    "action": MESSAGE_ACTION.UNREGISTER_EVENT,
                    "payload": {"event": event_name, "id_to_remove": id_to_remove},
                }
            )

    def dispatchAction(self, payload: T.Dict):
        self.send(
            {
                "action": MESSAGE_ACTION.DISPATCH_ACTION,
                "payload": payload,
            }
        )

    def _handle_frontend_msg(
        self, model: "BaseEchartsWidget", msg: T.Dict, buffers: T.List
    ) -> None:
        action: str = msg.get("action", None)
        payload: T.Dict = msg.get("payload", {})
        if action == "event_handler_params":
            event = payload.get("event", None)
            handler_id = payload.get("handlerId", None)
            params = payload.get("params", None)
            handler = self._event_handlers.get(event, {}).get(handler_id, None)
            if handler is not None:
                handler(params)
