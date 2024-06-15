from copy import deepcopy
from pathlib import Path
from typing import Dict, List, Tuple

import markdownify
from jinja2 import Environment, FileSystemLoader, select_autoescape

from .tools import (
    capitalize,
    convert_object_type,
    is_array_type,
    is_object_type,
)
import re
from .traitfactory import generate_trait

pattern = re.compile(r"(?<!^)(?=[A-Z])")


class CodeGen:
    def __init__(self, base_name: str, schema: dict, template_path: Path) -> None:
        self._schema = schema
        self.template_env = Environment(
            loader=FileSystemLoader(template_path), autoescape=select_autoescape()
        )
        self._base_name = base_name
        self._ts_files: List[str] = []
        self._init_content = {}

    def _generate_object_type(
        self,
        trait_name: str,
        trait_value: Dict,
        output: Path,
        ts_output: Path,
        type_value=None,
    ) -> str:
        trait_copy = deepcopy(trait_value)
        trait_copy["type"] = convert_object_type(trait_copy["type"])

        desc: str = trait_value.pop("description", "")
        traits = []
        defaults = []
        cls_name = capitalize(trait_name)

        properties: Dict = trait_value.get("properties", {})

        for name, props in properties.items():
            traits.append(generate_trait(name, props, type_value=type_value))

        self._write_to_py_file(cls_name, desc, traits, [], output)
        self._init_content[cls_name.lower()] = cls_name
        self._write_to_ts_file(cls_name=cls_name, defaults=defaults, output=ts_output)
        return cls_name

    def _generate_array_type(
        self,
        trait_name: str,
        trait_value: Dict[str, Dict],
        output: Path,
        ts_output: Path,
    ) -> Tuple[List[str], List[str]]:
        cls_name = capitalize(trait_name)
        items = trait_value.get("items", {})
        desc: str = trait_value.pop("description", "")

        imports = []
        traits = []
        defaults = []
        out_dir = output / f"{trait_name.lower()}items"
        out_dir.mkdir(exist_ok=True)
        init_path = out_dir / "__init__.py"
        if not init_path.exists():
            open(init_path, "a").close()

        ts_out_dir = ts_output / f"{trait_name.lower()}items"
        ts_out_dir.mkdir(exist_ok=True)
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
                        if trait_name == "series" and type_value in [
                            "radar",
                            "parallel",
                        ]:
                            list_item_cls = f"{trait_name}{capitalize(type_value)}"
                        else:
                            list_item_cls = f"{capitalize(type_value)}"

                    else:
                        list_item_cls = f"{trait_name}Item{item_idx}"
                    item_cls = self._generate_object_type(
                        list_item_cls,
                        list_item,
                        out_dir,
                        ts_out_dir,
                        type_value=type_value,
                    )
                    trait_item += f"Instance({item_cls}, kw=None, args=None, allow_none=True).tag(sync=True, **widget_serialization),"
                    imports.append(
                        {
                            "module": f".{trait_name.lower()}items.{item_cls.lower()}",
                            "import_name": item_cls,
                        }
                    )
            code = f"{trait_name} = List(trait=Union([{trait_item}]), allow_none=True, default_value=None).tag(sync=True, **widget_serialization)"
            defaults.append({"name": trait_name, "value": []})
            traits.append(code)

        elif "type" in items:
            # One trait
            if is_object_type(items):
                import_name = self._generate_object_type(
                    f"{trait_name}Item", items, out_dir, ts_out_dir
                )
                imports.append(
                    {
                        "module": f".{trait_name.lower()}items.{import_name.lower()}",
                        "import_name": import_name,
                    }
                )
                code = f"{trait_name} = List(trait=Instance({import_name}), default_value=None, allow_none=True).tag(sync=True, **widget_serialization)"
                traits.append(code)

        self._write_to_py_file(cls_name, desc, traits, imports, output)
        if cls_name == "Series":
            serializers_attrs = ["series"]
        else:
            serializers_attrs = []
        self._write_to_ts_file(
            cls_name=cls_name,
            defaults=defaults,
            output=ts_output,
            serializers_attrs=serializers_attrs,
        )
        return traits, imports

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
        md_desc = markdownify.markdownify(f"{desc}", bullets="-")
        resources = dict(
            class_name=class_name_fixed,
            desc=md_desc,
            # desc=desc,
            traits=traits,
            imports=imports,
            model_name=f"{class_name_fixed}Model",
        )

        content = template.render(**resources)
        file_path = output / f"{cls_name.lower()}.py"
        with open(file_path, "w") as f:
            f.write(content)

    def _write_to_ts_file(
        self,
        cls_name: str,
        defaults: List[Dict],
        output: Path,
        serializers_attrs: List[str] = [],
    ):
        template = self.template_env.get_template("class.ts.jinja")
        class_name_fixed = capitalize(cls_name)
        resources = dict(
            class_name=class_name_fixed,
            model_name=f"{class_name_fixed}Model",
            defaults=defaults,
            len=len,
            serializers_attrs=serializers_attrs,
        )

        content = template.render(**resources)
        ts_file_name = output / f"{cls_name.lower()}.ts"
        with open(ts_file_name, "w") as f:
            f.write(content)
        self._ts_files.append(str(ts_file_name))

    def _write_ts_index(self, ts_output: Path):
        with open(ts_output / "index.ts", "w") as f:
            for file in self._ts_files:
                export_path = file.replace(".ts", "").replace(str(ts_output), ".")
                f.writelines(f"export * from '{export_path}';\n")

        with open(ts_output / "version.ts", "w") as f:
            f.write(
                "import { MODULE_NAME, MODULE_VERSION } from '../version';\nexport { MODULE_NAME, MODULE_VERSION };\n"
            )
        with open(ts_output / "types.ts", "w") as f:
            f.write(
                "import { IUpdateManager } from '../types';\nexport { IUpdateManager };\n"
            )

    def _write_init(self, class_dir: Path):

        init_path = class_dir / "__init__.py"
        content = ["from .option import Option"]
        for path in class_dir.glob("*.py"):
            file_name = path.name.split(".")[0]
            if file_name in self._init_content:
                content.append(
                    f"from .{file_name} import {self._init_content[file_name]}"
                )

        content_str = "\n".join(content)
        with open(init_path, "w") as f:
            f.write(content_str)

    def generate(self, output: Path, ts_output: Path):
        imports = []
        traits = []
        defaults = []
        option_props = []
        for prop, prop_value in self._schema["properties"].items():
            cls_name = None
            list_traits = None
            list_imports = None
            if is_object_type(prop_value):
                cls_name = self._generate_object_type(
                    prop, prop_value, output, ts_output
                )

            elif is_array_type(prop_value):
                if "items" not in prop_value:
                    traits.append(
                        f"{prop} = List(trait=Any, default_value=None, allow_none=True).tag(sync=True)"
                    )
                    defaults.append({"name": prop, "value": []})
                else:
                    list_traits, list_imports = self._generate_array_type(
                        prop, prop_value, output, ts_output
                    )
            else:
                traits.append(generate_trait(prop, prop_value))
            if cls_name is not None:
                imports.append(
                    {"module": f".{cls_name.lower()}", "import_name": cls_name}
                )
                traits.append(
                    f"{prop} = Instance({cls_name}, kw=None, args=None,allow_none=True).tag(sync=True, **widget_serialization)"
                )
                defaults.append({"name": prop, "value": {}})
                option_props.append(prop)
            elif list_traits is not None:
                traits.extend(list_traits)
                if list_imports is not None:
                    imports.extend(list_imports)

        self._write_to_py_file(
            "Option", desc="", traits=traits, imports=imports, output=output
        )

        option_props.append("series")
        defaults.append({"name": "series", "value": []})
        self._write_to_ts_file(
            cls_name="Option",
            defaults=defaults,
            output=ts_output,
            serializers_attrs=option_props,
        )
        # self._ts_files.append(str(ts_output / "option.ts"))
        self._write_ts_index(ts_output)
        self._write_init(output)
