"""Include security collector regressions in the existing offline fleet suite."""

import importlib.util
from pathlib import Path


def load_tests(loader, tests, pattern):
    directory = Path(__file__).resolve().parent.parent / "readiness-security"
    for name in ("test_executor", "test_collection"):
        spec = importlib.util.spec_from_file_location(f"fleet_security_{name}", directory / f"{name}.py")
        if spec is None or spec.loader is None:
            raise ImportError(f"Cannot load security regression module: {name}")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        tests.addTests(loader.loadTestsFromModule(module))
    return tests
