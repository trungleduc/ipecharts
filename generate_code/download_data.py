import json
from pathlib import Path
from typing import List

import requests


URL = {
    "option": "https://raw.githubusercontent.com/apache/echarts-website/asf-site/en/documents/option.json",
    "option_gl": "https://raw.githubusercontent.com/apache/echarts-website/asf-site/en/documents/option-gl.json",
}


def download_data():
    here = Path(__file__).parent

    option_path = here / "all_option.json"

    if option_path.exists():
        return

    r = requests.get(URL["option"], allow_redirects=True)
    option_data = json.loads(r.text)

    r = requests.get(URL["option_gl"], allow_redirects=True)
    option_gl_data = json.loads(r.text)

    option_properties = option_data["option"]["properties"]
    option_gl_properties = option_gl_data["option"]["properties"]
    for key in option_gl_properties:
        if key != "series":
            option_properties[key] = option_gl_properties[key]

    option_series: List = option_properties["series"]["items"]["anyOf"]
    option_gl_series = option_gl_properties["series"]["items"]["anyOf"]

    for serie_data in option_gl_series:
        option_series.append(serie_data)

    with open(option_path, "w") as f:
        json.dump(option_data, f)
