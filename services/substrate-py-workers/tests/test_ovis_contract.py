"""Static contracts for the admitted Ovis evaluation candidate."""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
import tomllib
from pathlib import Path

from worker import ovis_omni
from worker.main import app as worker_app
from worker.ovis_boundary import OvisBoundaryMiddleware


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
SERVICE_ROOT = REPOSITORY_ROOT / "services" / "substrate-py-workers"
MANIFEST_PATH = REPOSITORY_ROOT / "docs" / "aef" / "manifests" / "ovis-omni-embedding-3b.v1.json"
EXACT_REQUIREMENT_RE = re.compile(r"^(?P<name>[A-Za-z0-9._-]+)==(?P<version>[^;\s]+)$")


def _manifest() -> dict:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def _ovis_exact_requirements() -> dict[str, str]:
    pyproject = tomllib.loads((SERVICE_ROOT / "pyproject.toml").read_text(encoding="utf-8"))
    requirements = pyproject["project"]["optional-dependencies"]["ovis"]
    exact: dict[str, str] = {}
    for requirement in requirements:
        match = EXACT_REQUIREMENT_RE.fullmatch(requirement)
        if match:
            exact[match.group("name").lower()] = match.group("version")
    return exact


def _locked_versions() -> set[tuple[str, str]]:
    lock = tomllib.loads((SERVICE_ROOT / "uv.lock").read_text(encoding="utf-8"))
    return {(package["name"], package["version"]) for package in lock["package"]}


def test_manifest_pyproject_and_source_share_admitted_identity() -> None:
    manifest = _manifest()
    runtime = manifest["runtime"]
    exact = _ovis_exact_requirements()

    assert runtime["owner"] == "services/substrate-py-workers/src/worker/ovis_omni.py"
    assert runtime["runtimeVersion"] == ovis_omni.RUNTIME_VERSION
    assert manifest["upstream"]["repoId"] == ovis_omni.MODEL_ID
    assert manifest["upstream"]["revision"] == ovis_omni.MODEL_REVISION
    assert manifest["identity"]["artifactSetDigest"] == ovis_omni.ARTIFACT_SET_DIGEST
    assert manifest["identity"]["nativeDimensions"] == ovis_omni.NATIVE_DIMENSIONS
    manifest_artifacts = {
        artifact["path"]: (artifact["sha256"], artifact["size"])
        for artifact in manifest["identity"]["artifacts"]
    }
    assert manifest_artifacts == ovis_omni.EXPECTED_ARTIFACTS

    expected_versions = {
        "accelerate": ovis_omni.ACCELERATE_VERSION,
        "transformers": ovis_omni.TRANSFORMERS_VERSION,
        "torch": ovis_omni.TORCH_VERSION,
        "qwen-omni-utils": ovis_omni.QWEN_OMNI_UTILS_VERSION,
    }
    assert runtime["accelerate"] == expected_versions["accelerate"]
    assert runtime["transformers"] == expected_versions["transformers"]
    assert runtime["torch"] == expected_versions["torch"]
    assert runtime["qwenOmniUtils"] == expected_versions["qwen-omni-utils"]
    assert exact == expected_versions
    locked_versions = _locked_versions()
    for name, version in expected_versions.items():
        assert {
            locked_version
            for locked_name, locked_version in locked_versions
            if locked_name == name
        } == {version}

    dependency_lock = runtime["dependencyLock"]
    lock_path = REPOSITORY_ROOT / dependency_lock["path"]
    assert dependency_lock["format"] == "uv"
    assert lock_path == SERVICE_ROOT / "uv.lock"
    assert hashlib.sha256(lock_path.read_bytes()).hexdigest() == dependency_lock["sha256"]


def test_candidate_remains_evaluation_only() -> None:
    governance = _manifest()["governance"]

    assert governance["promotionState"] == "EVALUATION_HOLD"
    assert governance["productionServingAllowed"] is False
    assert governance["fallbackAllowed"] is False
    assert governance["highStakesAutonomyAllowed"] is False
    assert (
        governance["promotionState"]
        == ovis_omni.CANONICAL_MANIFEST_PROMOTION_STATE
    )
    assert (
        governance["productionServingAllowed"]
        is ovis_omni.CANONICAL_MANIFEST_PRODUCTION_SERVING_ALLOWED
    )
    assert ovis_omni.PRODUCTION_RECEIPT_VERIFICATION_IMPLEMENTED is False


def test_worker_installs_early_ovis_boundary_middleware() -> None:
    assert any(
        middleware.cls is OvisBoundaryMiddleware
        for middleware in worker_app.user_middleware
    )


def test_ovis_deployment_lanes_require_digest_and_hold() -> None:
    compose = (
        REPOSITORY_ROOT / "substrate" / "docker-compose.ovis-evaluation.yml.template"
    ).read_text(encoding="utf-8")
    assert 'image: "__OVIS_EVAL_IMAGE__"' in compose
    assert 'OVIS_PROMOTION_STATE: "EVALUATION_HOLD"' in compose
    assert 'OVIS_MAX_CONCURRENCY: "1"' in compose
    assert 'WORKER_MAX_CONCURRENCY: "0"' in compose
    assert 'RUNTIME_MODE: "internal-preview"' in compose
    assert 'AEF_DEVELOPMENT_ENDPOINTS_ENABLED: "0"' in compose
    assert (
        'SUBSTRATE_PYTHON_WORKER_API_KEY_FILE: "/run/secrets/ovis-internal-api-key"'
        in compose
    )
    assert 'OVIS_INTERNAL_API_KEY_FILE: "/run/secrets/ovis-internal-api-key"' in compose
    assert compose.count("${OVIS_EVAL_TENANT_ID:?") == 2
    assert "SUBSTRATE_PYTHON_WORKER_AUTH_BYPASS" not in compose
    assert 'user: "1001:1001"' in compose
    assert "read_only: true" in compose
    assert "- ALL" in compose
    assert "- no-new-privileges:true" in compose
    assert "OVIS_QUALIFICATION_RECEIPT_SHA256" not in compose
    assert ":latest" not in compose
    assert '127.0.0.1:${OVIS_EVAL_PORT:-8091}:8090' in compose

    renderer = SERVICE_ROOT / "deploy" / "render_ovis_deployment.py"
    image = "registry.example/szl/ovis-eval@sha256:" + ("a" * 64)
    rendered = subprocess.run(
        [sys.executable, str(renderer), "--image", image],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    assert f"image: {image}" in rendered
    assert 'value: "EVALUATION_HOLD"' in rendered
    assert "OVIS_QUALIFICATION_RECEIPT_SHA256" not in rendered
    assert "__OVIS_EVAL_IMAGE__" not in rendered

    compose_image = "registry.example:5000/szl/ovis-eval@sha256:" + ("b" * 64)
    rendered_compose = subprocess.run(
        [
            sys.executable,
            str(renderer),
            "--target",
            "compose",
            "--image",
            compose_image,
        ],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    assert f'image: "{compose_image}"' in rendered_compose
    assert "__OVIS_EVAL_IMAGE__" not in rendered_compose


def test_ovis_deployment_renderer_rejects_tags_and_malformed_digests() -> None:
    renderer = SERVICE_ROOT / "deploy" / "render_ovis_deployment.py"
    rejected_images = [
        "registry.example/szl/ovis-eval:latest",
        "registry.example/szl/ovis-eval:1.0@sha256:" + ("a" * 64),
        "https://registry.example/szl/ovis-eval@sha256:" + ("a" * 64),
        "registry.example//ovis-eval@sha256:" + ("a" * 64),
        "registry.example/szl/../ovis-eval@sha256:" + ("a" * 64),
        "registry.example:70000/szl/ovis-eval@sha256:" + ("a" * 64),
        "registry.example/szl/ovis-eval@sha256:" + ("A" * 64),
        "registry.example/szl/ovis-eval@sha256:short",
        "registry.example/szl/OVIS-eval@sha256:" + ("a" * 64),
        'registry.example/szl/ovis"eval@sha256:' + ("a" * 64),
    ]
    for image in rejected_images:
        result = subprocess.run(
            [sys.executable, str(renderer), "--image", image],
            check=False,
            capture_output=True,
            text=True,
        )
        assert result.returncode == 2
        assert "render rejected" in result.stderr


def test_general_worker_manifests_disable_ovis() -> None:
    compose = (REPOSITORY_ROOT / "substrate" / "docker-compose.gpu.yml").read_text(
        encoding="utf-8"
    )
    kubernetes = (SERVICE_ROOT / "deploy" / "k8s-service.yaml").read_text(
        encoding="utf-8"
    )
    assert 'OVIS_OMNI_ENABLED: "0"' in compose
    assert "- name: OVIS_OMNI_ENABLED\n              value: \"0\"" in kubernetes


def test_kubernetes_pod_identity_secret_and_snapshot_mounts_are_restricted() -> None:
    kubernetes = (
        SERVICE_ROOT / "deploy" / "k8s-ovis-evaluation.yaml.template"
    ).read_text(encoding="utf-8")

    assert "mountPath: /run/secrets/ovis/internal-api-key" in kubernetes
    assert "subPath: internal-api-key" in kubernetes
    assert "automountServiceAccountToken: false" in kubernetes
    assert '- name: OVIS_MAX_CONCURRENCY\n              value: "1"' in kubernetes
    assert '- name: WORKER_MAX_CONCURRENCY\n              value: "0"' in kubernetes
    assert "strategy:\n    type: Recreate" in kubernetes
    assert '- name: AEF_DEVELOPMENT_ENDPOINTS_ENABLED\n              value: "0"' in kubernetes
    assert "name: SUBSTRATE_PYTHON_WORKER_API_KEY_FILE" in kubernetes
    assert "name: OVIS_INTERNAL_API_KEY_FILE" in kubernetes
    assert kubernetes.count("name: ovis-evaluation-runtime") == 2
    assert "secretName: ovis-evaluation-runtime" in kubernetes
    assert kubernetes.count("key: tenant-id") == 2
    assert "SUBSTRATE_PYTHON_WORKER_AUTH_BYPASS" not in kubernetes
    assert "claimName: ovis-model-snapshot" in kubernetes
    assert "kind: NetworkPolicy" in kubernetes
    assert "egress: []" in kubernetes
    assert "ephemeral-storage: 4Gi" in kubernetes
    assert "sizeLimit: 2Gi" in kubernetes
