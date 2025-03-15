from enum import Enum
import base64
import json
from typing import Iterable

class MESSAGE_ACTION(str, Enum):
    REGISTER_EVENT = 'register_event'
    UNREGISTER_EVENT = 'unregister_event'
    DISPATCH_ACTION = 'dispatch_action'


def encode_js_fn(args: Iterable[str], fn: str):
    """Encodes Python function arguments and body into a Base64 string for use in JavaScript.

    This function takes a list of argument names (as strings) and a string
    representing the function's body (also a string, *including* the return) and
    encodes them into a specially prefixed Base64 string. This format is
    designed to be decoded and turned into a JavaScript function using the
    `Function` constructor.  The arguments and body are combined into a
    Python list, serialized as a JSON string, then Base64 encoded.

    Args:
        args: An iterable of strings representing the function's parameter names.
        fn: A string representing the function's body, *including* the
          `return` statement.

    Returns:
        A string starting with '__ipecharts_jsfn__::', followed by the Base64
        encoded JSON string representing the arguments and function body.
    """

    data_list = list(args) + [fn]
    json_string = json.dumps(data_list)
    json_bytes = json_string.encode('utf-8')
    base64_bytes = base64.b64encode(json_bytes)
    base64_string = base64_bytes.decode('utf-8')
    return f'__ipecharts_jsfn__::{base64_string}'