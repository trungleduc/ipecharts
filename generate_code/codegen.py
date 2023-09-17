from copy import deepcopy
from pathlib import Path
from typing import Dict, List

import markdownify
from jinja2 import Environment, FileSystemLoader, select_autoescape

from .tools import (
    capitalize,
    convert_object_type,
    ensure_string,
    is_array_type,
    is_object_type,
)
from .traitfactory import TraitFactory


class CodeGen:
    def __init__(self, base_name: str, schema: dict, template_path: Path) -> None:
        self._schema = schema
        self._trait_factory = TraitFactory()
        self.template_env = Environment(
            loader=FileSystemLoader(template_path), autoescape=select_autoescape()
        )
        self._base_name = base_name
        self._ts_files = []

    def _generate_object_type(
        self,
        trait_name: str,
        trait_value: Dict[str, Dict],
        output: Path,
        ts_output: Path,
    ) -> str:
        trait_copy = deepcopy(trait_value)
        trait_copy["type"] = convert_object_type(trait_copy["type"])
        desc = trait_value.pop("description", "")
        traits = []
        defaults = []
        cls_name = capitalize(trait_name)

        properties: Dict = trait_value.get("properties", {})
        for name, props in properties.items():
            traits.append(self._trait_factory.generate(name, props))
            default = props.get("default", None)
            if default is not None:
                if type(default) == bool:
                    defaults.append({"name": name, "value": str(default).lower()})
                elif type(default) == str:
                    defaults.append(
                        {"name": name, "value": ensure_string(default, True)}
                    )
                else:
                    defaults.append({"name": name, "value": default})
        self._write_to_py_file(cls_name, desc, traits, [], output)
        self._write_to_ts_file(cls_name=cls_name, defaults=defaults, output=ts_output)
        return cls_name

    def _generate_array_type(
        self,
        trait_name: str,
        trait_value: Dict[str, Dict],
        output: Path,
        ts_output: Path,
    ):
        cls_name = capitalize(trait_name)
        items = trait_value.get("items", None)
        desc = trait_value.pop("description", "")

        if not items:
            traits = [f"{trait_name} = List(trait=Any, allow_none=True).tag(sync=True)"]
            self._write_to_py_file(cls_name, desc, traits, [], output)
            return cls_name
        imports = []
        traits = []
        defaults = []
        out_dir = output / f"{trait_name.lower()}items"
        out_dir.mkdir()
        if "anyOf" in items:
            # List of trais
            trait_item = ""
            for item_idx, list_item in enumerate(items["anyOf"]):
                if is_object_type(list_item):
                    type_value = (
                        list_item.get("properties", {})
                        .get("type", {})
                        .get("default", None)
                    )

                    if type_value:
                        type_value = type_value.replace("'", "").replace('"', "")
                        list_item_cls = f"{trait_name}{capitalize(type_value)}"
                    else:
                        list_item_cls = f"{trait_name}Item{item_idx}"
                    item_cls = self._generate_object_type(
                        list_item_cls, list_item, out_dir, ts_output
                    )
                    trait_item += f"Instance({item_cls}, allow_none=True), "
                    imports.append(
                        {
                            "module": f".{trait_name.lower()}items.{item_cls.lower()}",
                            "import_name": item_cls,
                        }
                    )
            code = f"{trait_name} = List(trait=Union([{trait_item}]), allow_none=True).tag(sync=True)"
            defaults.append({"name": trait_name, "value": []})
            traits.append(code)

        elif "type" in items:
            # One trait
            if is_object_type(items):
                import_name = self._generate_object_type(
                    f"{trait_name}Item", items, out_dir, ts_output
                )
                imports.append(
                    {
                        "module": f".{trait_name.lower()}items.{import_name.lower()}",
                        "import_name": import_name,
                    }
                )
                code = f"{trait_name} = List(trait=Instance({import_name}), allow_none=True).tag(sync=True)"
                traits.append(code)

        self._write_to_py_file(cls_name, desc, traits, imports, output)
        self._write_to_ts_file(cls_name=cls_name, defaults=defaults, output=ts_output)
        return cls_name

    def _write_to_py_file(
        self,
        cls_name: str,
        desc: str,
        traits: List[str],
        imports: List[str],
        output: Path,
    ):
        template = self.template_env.get_template("class.py.jinja")
        class_name_fixed = capitalize(cls_name)
        resources = dict(
            class_name=class_name_fixed,
            desc=markdownify.markdownify(desc),
            traits=traits,
            imports=imports,
            model_name=f"{class_name_fixed}Model",
        )

        content = template.render(**resources)
        with open(output / f"{cls_name.lower()}.py", "w") as f:
            f.write(content)

    def _write_to_ts_file(
        self,
        cls_name: str,
        defaults: List[Dict],
        output: Path,
    ):
        template = self.template_env.get_template("class.ts.jinja")
        class_name_fixed = capitalize(cls_name)
        resources = dict(
            class_name=class_name_fixed,
            model_name=f"{class_name_fixed}Model",
            defaults=defaults,
            len=len,
        )

        content = template.render(**resources)
        with open(output / f"{cls_name.lower()}.ts", "w") as f:
            f.write(content)
        self._ts_files.append()

    def generate(self, output: Path, ts_output: Path):
        imports = []
        traits = []
        for prop, prop_value in self._schema["properties"].items():
            cls_name = None
            if is_object_type(prop_value):
                cls_name = self._generate_object_type(
                    prop, prop_value, output, ts_output
                )
            elif is_array_type(prop_value):
                cls_name = self._generate_array_type(
                    prop, prop_value, output, ts_output
                )

            if cls_name is not None:
                imports.append(
                    {"module": f".{cls_name.lower()}", "import_name": cls_name}
                )
                traits.append(
                    f"{prop} = Instance({cls_name}, allow_none=True).tag(sync=True)"
                )
        self._write_to_py_file(
            "Option", desc="", traits=traits, imports=imports, output=output
        )
