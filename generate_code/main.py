import json
from pathlib import Path
from shutil import rmtree
import subprocess
from .codegen import CodeGen
import requests

OPTION_URL = "https://raw.githubusercontent.com/apache/echarts-website/asf-site/en/documents/option.json"


def generate():
    here = Path(__file__).parent
    output = here.parent / "ipecharts" / "_output"
    if output.exists():
        rmtree(output)
    output.mkdir()

    option_path = here / "option.json"
    if not option_path.exists():
        r = requests.get(OPTION_URL, allow_redirects=True)
        with open(option_path, "w") as f:
            f.write(r.text)

    schema = {}
    with open(option_path, "r", encoding="utf-8") as fh:
        content = json.load(fh)
        schema = content["option"]

    template_path = here / "templates"
    generator = CodeGen(base_name="option", schema=schema, template_path=template_path)
    generator.generate(output=output)

    subprocess.run(["python", "-m", "black", f"{output}", "--exclude", ".git"])


if __name__ == "__main__":
    generate()
