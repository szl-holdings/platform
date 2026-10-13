"""Render an Ovis evaluation deployment template with an immutable image."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


IMAGE_RE = re.compile(
    r"^(?P<repository>[a-z0-9](?:[a-z0-9._:/-]*[a-z0-9])?)"
    r"@sha256:(?P<digest>[a-f0-9]{64})$"
)
REPOSITORY_COMPONENT_RE = re.compile(
    r"^[a-z0-9]+(?:(?:[._]|__|-+)[a-z0-9]+)*$"
)
REGISTRY_HOST_RE = re.compile(
    r"^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?"
    r"(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$"
)
TEMPLATE_TOKEN = "__OVIS_EVAL_IMAGE__"
TEMPLATES = {
    "kubernetes": Path(__file__).with_name("k8s-ovis-evaluation.yaml.template"),
    "compose": (
        Path(__file__).resolve().parents[3]
        / "substrate"
        / "docker-compose.ovis-evaluation.yml.template"
    ),
}


def validate_image(value: str) -> str:
    match = IMAGE_RE.fullmatch(value)
    if not match:
        raise ValueError("image must be repository@sha256:<64 lowercase hex>")

    repository = match.group("repository")
    if len(repository) > 255:
        raise ValueError("image repository exceeds 255 characters")

    components = repository.split("/")
    if any(not component for component in components):
        raise ValueError("image repository contains an empty path component")

    first_component = components[0]
    path_components = components
    if ":" in first_component:
        if len(components) == 1 or first_component.count(":") != 1:
            raise ValueError("image repository must not include a mutable tag")
        registry_host, port = first_component.split(":", 1)
        if not REGISTRY_HOST_RE.fullmatch(registry_host):
            raise ValueError("image registry host is invalid")
        if not port.isdecimal() or not 1 <= int(port) <= 65535:
            raise ValueError("image registry port is invalid")
        path_components = components[1:]

    last_repository_segment = components[-1]
    if ":" in last_repository_segment:
        raise ValueError("image repository must not include a mutable tag")
    if any(not REPOSITORY_COMPONENT_RE.fullmatch(component) for component in path_components):
        raise ValueError("image repository path is invalid")
    return value


def render(image: str, target: str = "kubernetes") -> str:
    admitted_image = validate_image(image)
    template_path = TEMPLATES[target]
    template = template_path.read_text(encoding="utf-8")
    if template.count(TEMPLATE_TOKEN) != 1:
        raise RuntimeError("Ovis deployment template must contain exactly one image token")
    return template.replace(TEMPLATE_TOKEN, admitted_image)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", required=True)
    parser.add_argument("--target", choices=sorted(TEMPLATES), default="kubernetes")
    parser.add_argument("--output", default="-")
    args = parser.parse_args()

    try:
        rendered = render(args.image, args.target)
    except (OSError, RuntimeError, ValueError) as error:
        print(f"Ovis deployment render rejected: {error}", file=sys.stderr)
        return 2

    if args.output == "-":
        sys.stdout.write(rendered)
    else:
        Path(args.output).write_text(rendered, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
