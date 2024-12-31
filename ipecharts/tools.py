from enum import Enum

class MESSAGE_ACTION(str, Enum):
    REGISTER_EVENT = 'register_event'
    UNREGISTER_EVENT = 'unregister_event'
    DISPATCH_ACTION = 'dispatch_action'