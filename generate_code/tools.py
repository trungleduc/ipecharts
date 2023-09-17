import json
from typing import List, Union
import hashlib


def is_object_type(trait_value):
    trait_type = trait_value["type"]
    if isinstance(trait_type, str):
        return trait_type == "Object" or trait_type == "*"
    if isinstance(trait_type, list):
        return trait_type[0] == "Object" or trait_type[0] == "*"


def is_array_type(trait_value):
    trait_type = trait_value["type"]
    if isinstance(trait_type, str):
        return trait_type == "Array"
    if isinstance(trait_type, list):
        return trait_type[0] == "Array"


def convert_object_type(trait_type: Union[str, List]) -> List:
    if isinstance(trait_type, str):
        return [trait_type]
    if isinstance(trait_type, list):
        return trait_type


def compute_hash(input: dict) -> str:
    dict_str = json.dumps(input, indent=0)
    return hashlib.sha256(dict_str.encode("utf-8")).hexdigest()


def sort_dict_by_key(input: dict) -> dict:
    dict_key = list(input.keys())
    dict_key.sort()
    return {i: input[i] for i in dict_key}


def capitalize(string: str) -> str:
    if len(string) == 0:
        return string
    if len(string) == 1:
        return string.capitalize()
    return string[0].upper() + string[1:]


def lower_first(string: str) -> str:
    if len(string) == 0:
        return string
    if len(string) == 1:
        return string.lower()
    return string[0].lower() + string[1:]


def ensure_string(input: str, single_quote=False) -> str:
    stripped = input.replace('"', "").replace("'", "")
    if single_quote:
        return f"'{stripped}'"
    return f'"{stripped}"'


NAME_MAPPING = dict(
    SeriesItem0="BrokenLineChart",
    SeriesItem1="BarChart",
    SeriesItem2="PieChart",
    SeriesItem3="ScatterChart",
    SeriesItem4="BrokenLineChart",
    SeriesItem5="BrokenLineChart",
    SeriesItem6="BrokenLineChart",
    SeriesItem7="BrokenLineChart",
    SeriesItem8="BrokenLineChart",
    SeriesItem9="BrokenLineChart",
    SeriesItem10="BrokenLineChart",
    SeriesItem11="BrokenLineChart",
    SeriesItem12="BrokenLineChart",
    SeriesItem13="BrokenLineChart",
)
