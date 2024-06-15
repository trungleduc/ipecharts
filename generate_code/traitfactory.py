from typing import Dict

from .tools import is_object_type
import markdownify

TYPE_MAP = dict(string="Unicode", boolean="Bool", number="Float")


def help_from_desc(desc: str) -> str:
    if len(desc) > 0:
        return f'help="""{desc}"""'
    return desc


def list_trait_gen(name: str, props: Dict) -> str:
    props_type = props.get("type", [])

    code = ""
    trait = ""
    desc = markdownify.markdownify(props.get("description", "")).strip()
    help_str = help_from_desc(desc)
    for single_type in props_type:
        klass = TYPE_MAP.get(single_type, "Any")
        trait += f"{klass}(default_value=None, allow_none=True),"

    code = f"{name } = Union([{trait}], default_value=None, allow_none=True, {help_str if len(help_str) > 0 else ''}).tag(sync=True)"

    return code


def object_trait_gen(name: str, props: Dict) -> str:
    desc = markdownify.markdownify(props.get("description", "")).strip()
    help_str = help_from_desc(desc)
    code = f"{name } = Dict(default_value=None, allow_none=True, {help_str if len(help_str) > 0 else ''}).tag(sync=True)"
    return code


def primitive_trait_gen(name: str, props: Dict, default_value=None) -> str:
    props_type = props.get("type", [])[0]
    desc = markdownify.markdownify(props.get("description", "")).strip()
    help_str = help_from_desc(desc)
    code = ""
    if name == "type" and default_value:
        default = f'"{default_value}"'
    else:
        default = "None"
    if props_type in TYPE_MAP:
        code = f"{name} = {TYPE_MAP[props_type]}({default}, allow_none=True, {help_str if len(help_str) > 0 else ''}).tag(sync=True)"
    else:
        code = f"{name} = Any(None, allow_none=True, {help_str if len(help_str) > 0 else ''}).tag(sync=True)"
    return code


def generate_trait(name: str, props: Dict, type_value=None):
    props_type = props.get("type")
    if props_type and len(props_type) == 1:
        if is_object_type(props):
            return object_trait_gen(name, props)
        else:
            return primitive_trait_gen(name, props, type_value)
    else:
        return list_trait_gen(name, props)
