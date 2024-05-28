from copy import deepcopy
from pathlib import Path
from typing import Any, Dict, List, Tuple
from jinja2 import Environment, FileSystemLoader, select_autoescape
import markdownify
from .tools import is_array_type, is_object_type, capitalize

TYPE_MAP = dict(string="Unicode", boolean="Bool", number="Float")


def help_from_desc(desc: str) -> str:
    if len(desc) > 0:
        return f'help="""{desc}"""'
    return desc


def object_trait_gen(name: str, props: Dict) -> str:
    desc = markdownify.markdownify(props.get("description", "")).strip()
    help_str = help_from_desc(desc)
    code = f"{name } = Dict(None, allow_none=True, {help_str if len(help_str) > 0 else ''}).tag(sync=True)"
    return code


def primitive_trait_gen(name: str, props: Dict) -> str:
    props_type = props.get("type", [])[0]
    desc = markdownify.markdownify(props.get("description", "")).strip()
    help_str = help_from_desc(desc)
    code = ""
    if props_type in TYPE_MAP:

        code = f"{name} = {TYPE_MAP[props_type]}(None, allow_none=True, {help_str if len(help_str) > 0 else ''}).tag(sync=True)"
    else:
        code = f"{name} = Any(None, allow_none=True, {help_str if len(help_str) > 0 else ''}).tag(sync=True)"
    return code


def list_trait_gen(name: str, props: Dict) -> str:
    props_type = props.get("type", [])
    code = ""
    trait = ""
    desc = markdownify.markdownify(props.get("description", "")).strip()
    help_str = help_from_desc(desc)

    for single_type in props_type:
        klass = TYPE_MAP.get(single_type, "Any")
        trait += f"{klass}(None, allow_none=True),"
    else:
        code = f"{name } = Union([{trait}], {help_str if len(help_str) > 0 else ''}).tag(sync=True)"

    return code


class CodeGen:
    def __init__(self, base_name: str, schema: Dict) -> None:
        here = Path(__file__).parent
        template_path = here / "templates"

        self._schema = schema
        self.template_env = Environment(
            loader=FileSystemLoader(template_path), autoescape=select_autoescape()
        )
        self._init_content = {}

    def _write_to_py_file(
        self,
        cls_name: str,
        desc: str,
        traits: List[str],
        imports: List[Dict],
        output: Path,
    ):
        template = self.template_env.get_template("class.py.jinja")
        class_name_fixed = capitalize(cls_name)
        resources: Dict[str, Any] = dict(
            class_name=class_name_fixed,
            desc=markdownify.markdownify(desc),
            traits=traits,
            imports=imports,
            model_name=f"{class_name_fixed}Model",
        )

        content = template.render(**resources)
        file_path = output / f"{cls_name.lower()}.py"
        with open(file_path, "w") as f:
            f.write(content)

    def _generate_object_type(
        self,
        trait_name: str,
        trait_value: Dict[str, Dict],
        py_path: Path,
        ts_path: Path,
    ):
        trait_copy = deepcopy(trait_value)
        desc: str = trait_copy.pop("description", "")
        traits = []
        cls_name = capitalize(trait_name)
        properties: Dict = trait_copy.get("properties", {})
        for name, props in properties.items():
            props_type = props.get("type")
            generated_trait = None
            if len(props_type) == 1:
                if is_object_type(props):
                    generated_trait = object_trait_gen(name, props)
                else:
                    generated_trait = primitive_trait_gen(name, props)
            else:
                generated_trait = list_trait_gen(name, props)
            if generated_trait:
                traits.append(generated_trait)
        self._write_to_py_file(cls_name, desc, traits, [], py_path)
        self._init_content[cls_name.lower()] = cls_name
        return cls_name

    def _generate_array_type(
        self,
        trait_name: str,
        trait_value: Dict[str, Dict],
        py_path: Path,
        ts_path: Path,
    ) -> Tuple[List[str], List[Dict]]:
        cls_name = capitalize(trait_name)
        items: Dict = trait_value.get("items", {})
        desc: str = trait_value.pop("description", "")
        imports: List[Dict] = []
        traits: List[str] = []
        py_out_dir = py_path / f"{trait_name.lower()}"
        py_out_dir.mkdir(exist_ok=True)
        ts_out_dir = ts_path / f"{trait_name.lower()}"
        ts_out_dir.mkdir(exist_ok=True)
        if "anyOf" in items:
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
                        list_item_cls = f"{capitalize(type_value)}"
                    else:
                        list_item_cls = f"{trait_name}Item{item_idx}"

                    item_cls = self._generate_object_type(
                        list_item_cls, list_item, py_out_dir, ts_out_dir
                    )
                    trait_item += f"Instance({item_cls}, kw=None, args=None, allow_none=True).tag(sync=True, **widget_serialization),"
                    imports.append(
                        {
                            "module": f".{trait_name.lower()}.{item_cls.lower()}",
                            "import_name": item_cls,
                        }
                    )
            code = f"{trait_name} = List(trait=Union([{trait_item}]),default_value=None, allow_none=True).tag(sync=True, **widget_serialization)"

            traits.append(code)

        elif "type" in items:
            # One trait
            if is_object_type(items):
                import_name = self._generate_object_type(
                    f"{trait_name}Item", items, py_out_dir, ts_out_dir
                )
                imports.append(
                    {
                        "module": f".{trait_name.lower()}items.{import_name.lower()}",
                        "import_name": import_name,
                    }
                )
                code = f"{trait_name} = List(trait=Instance({import_name}), default_value=None, allow_none=True).tag(sync=True, **widget_serialization)"
                traits.append(code)
        self._write_to_py_file(cls_name, desc, traits, imports, py_path)
        # if cls_name == "Series":
        #     serializers_attrs = ["series"]
        # else:
        #     serializers_attrs = []
        # self._write_to_ts_file(
        #     cls_name=cls_name,
        #     defaults=defaults,
        #     output=ts_output,
        #     serializers_attrs=serializers_attrs,
        # )
        return traits, imports

    def generate(self, py_path: Path, ts_path: Path):
        imports = []
        traits = []
        option_props = []
        for prop, prop_value in self._schema["properties"].items():
            if is_object_type(prop_value):

                cls_name = self._generate_object_type(
                    prop, prop_value, py_path, ts_path
                )
            elif is_array_type(prop_value):
                if "items" not in prop_value:
                    traits.append(
                        f"{prop} = List(trait=Any, default=None, allow_none=True).tag(sync=True)"
                    )
                else:
                    list_traits, list_imports = self._generate_array_type(
                        prop, prop_value, py_path, ts_path
                    )
            if cls_name is not None:
                imports.append(
                    {"module": f".{cls_name.lower()}", "import_name": cls_name}
                )
                traits.append(
                    f"{prop} = Instance({cls_name}, kw=None, args=None,allow_none=True).tag(sync=True, **widget_serialization)"
                )
                option_props.append(prop)

            elif list_traits is not None:
                traits.extend(list_traits)
                if list_imports is not None:
                    imports.extend(list_imports)

        self._write_to_py_file(
            "Option", desc="", traits=traits, imports=imports, output=py_path
        )
