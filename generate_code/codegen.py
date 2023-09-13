from copy import deepcopy
from pathlib import Path
from typing import Dict, List

import markdownify
from jinja2 import Environment, FileSystemLoader, select_autoescape

from .tools import (
    capitalize,
    convert_object_type,
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

    def _generate_object_type(
        self, trait_name: str, trait_value: Dict[str, Dict], output: Path
    ) -> str:
        trait_copy = deepcopy(trait_value)
        trait_copy["type"] = convert_object_type(trait_copy["type"])
        desc = trait_value.pop("description", "")
        traits = []

        cls_name = capitalize(trait_name)

        properties: Dict = trait_value.get("properties", {})
        for name, props in properties.items():
            traits.append(self._trait_factory.generate(name, props))

        # elif is_array_type(trait_value):
        #     items = trait_value.get("items", None)
        #     if items:
        #         if "anyOf" in items:
        #             # List of trais
        #             trait_item = ""
        #             for item_idx, list_item in enumerate(items["anyOf"]):
        #                 item_cls = self._generate(
        #                     f"{trait_name}Item{item_idx}", list_item, output
        #                 )
        #                 trait_item += (
        #                     f"Instance({item_cls.replace('__','')}, allow_none=True), "
        #                 )

        #             code = f"{trait_name} = List(trait=Union([{trait_item}]), allow_none=True).tag(sync=True)"
        #             traits.append(code)
        #         elif "type" in items:
        #             # One trait
        #             if is_object_type(items):
        #                 import_name = self._generate(f"{trait_name}Item", items, output)
        #                 imports.append(import_name)
        #                 code = f"{trait_name} = List(trait={import_name}, allow_none=True).tag(sync=True)"
        #                 traits.append(code)
        self._write_to_file(cls_name, desc, traits, [], output)

        return cls_name

    def _generate_array_type(
        self, trait_name: str, trait_value: Dict[str, Dict], output: Path
    ):
        items = trait_value.get("items", None)

        if not items:
            return
        imports = []
        traits = []
        out_dir = output / f"{trait_name.lower()}items"
        out_dir.mkdir()
        cls_name = capitalize(trait_name)
        desc = trait_value.pop("description", "")
        if "anyOf" in items:
            # List of trais
            trait_item = ""
            for item_idx, list_item in enumerate(items["anyOf"]):
                if is_object_type(list_item):
                    item_cls = self._generate_object_type(
                        f"{trait_name}Item{item_idx}", list_item, out_dir
                    )
                    trait_item += f"Instance({item_cls}, allow_none=True), "
                    imports.append(
                        {
                            "module": f".{trait_name.lower()}items.{item_cls.lower()}",
                            "import_name": item_cls,
                        }
                    )
            code = f"{trait_name} = List(trait=Union([{trait_item}]), allow_none=True).tag(sync=True)"
            traits.append(code)

        elif "type" in items:
            # One trait
            if is_object_type(items):
                import_name = self._generate_object_type(
                    f"{trait_name}Item", items, out_dir
                )
                imports.append(
                    {
                        "module": f".{trait_name.lower()}items.{import_name.lower()}",
                        "import_name": import_name,
                    }
                )
                code = f"{trait_name} = List(trait={import_name}, allow_none=True).tag(sync=True)"
                traits.append(code)

        self._write_to_file(cls_name, desc, traits, imports, output)

    def _write_to_file(
        self,
        cls_name: str,
        desc: str,
        traits: List[str],
        imports: List[str],
        output: Path,
    ):
        template = self.template_env.get_template("class.py.jinja")

        resources = dict(
            class_name=capitalize(cls_name),
            desc=markdownify.markdownify(desc),
            traits=traits,
            imports=imports,
        )

        content = template.render(**resources)
        with open(output / f"{cls_name.lower()}.py", "w") as f:
            f.write(content)

    def generate(self, output: Path):
        for prop, prop_value in self._schema["properties"].items():
            if is_object_type(prop_value):
                self._generate_object_type(prop, prop_value, output)
            elif is_array_type(prop_value):
                self._generate_array_type(prop, prop_value, output)
