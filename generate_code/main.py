import json
from pathlib import Path
from shutil import rmtree
import subprocess

from .download_data import download_data
from .codegen import CodeGen

OPTION_URL = "https://raw.githubusercontent.com/apache/echarts-website/asf-site/en/documents/option.json"
OPTION_GL_URL = "https://raw.githubusercontent.com/apache/echarts-website/asf-site/en/documents/option-gl.json"


def generate():
    here = Path(__file__).parent
    output = here.parent / "ipecharts" / "option"
    if output.exists():
        rmtree(output)
    output.mkdir()
    ts_output = here.parent / "src" / "option"
    if ts_output.exists():
        rmtree(ts_output)
    ts_output.mkdir()

    download_data()
    option_path = here / "all_option.json"

    schema = {}
    with open(option_path, "r", encoding="utf-8") as fh:
        content = json.load(fh)
        schema = content["option"]

    template_path = here / "templates"
    generator = CodeGen(base_name="option", schema=schema, template_path=template_path)
    generator.generate(output=output, ts_output=ts_output)

    subprocess.run(
        ["python", "-m", "ruff", f"{output}", "--fix"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    with open(output / "basewidget.py", "w") as f:
        f.write("from ..basewidget import BaseWidget")


if __name__ == "__main__":
    generate()
