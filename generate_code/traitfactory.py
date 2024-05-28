from typing import Dict
from traitlets.traitlets import Union

from .tools import ensure_string, is_object_type, lower_first
import markdownify


class TraitFactory:
    def __init__(self) -> None:
        self.type_map = dict(string="Unicode", boolean="Bool", number="Float")

    def generate(self, name: str, props: Dict, type_value=None):
        props_type = props.get("type")
        if len(props_type) == 1:
            if is_object_type(props):
                return self._object_trait_gen(name, props)
            else:
                return self._primitive_trait_gen(name, props, type_value)
        else:
            return self._list_trait_gen(name, props)

    def _primitive_trait_gen(self, name: str, props: Dict, default_value=None) -> str:
        props_type = props.get("type", [])[0]
        desc = markdownify.markdownify(props.get("description", "")).strip()
        help_str = self._help_from_desc(desc)
        code = ""
        if name == "type" and default_value:
            default = f'"{default_value}"'
        else:
            default = "None"
        if props_type in self.type_map:
            code = f"{name} = {self.type_map[props_type]}({default}, allow_none=True, {help_str if len(help_str) > 0 else ''}).tag(sync=True)"
        else:
            code = f"{name} = Any(None, allow_none=True, {help_str if len(help_str) > 0 else ''}).tag(sync=True)"
        return code

    def _object_trait_gen(self, name: str, props: Dict) -> str:
        desc = markdownify.markdownify(props.get("description", "")).strip()
        help_str = self._help_from_desc(desc)
        code = f"{name } = Dict(default_value=None, allow_none=True, {help_str if len(help_str) > 0 else ''}).tag(sync=True)"
        return code

    def _list_trait_gen(self, name: str, props: Dict) -> str:
        props_type = props.get("type", [])

        code = ""
        trait = ""
        desc = markdownify.markdownify(props.get("description", "")).strip()
        help_str = self._help_from_desc(desc)
        for single_type in props_type:
            klass = self.type_map.get(single_type, "Any")
            trait += f"{klass}(default_value=None, allow_none=True),"

        code = f"{name } = Union([{trait}], default_value=None, allow_none=True, {help_str if len(help_str) > 0 else ''}).tag(sync=True)"

        return code

    def _help_from_desc(self, desc: str) -> str:
        if len(desc) > 0:
            return f'help="""{desc}"""'
        return desc
