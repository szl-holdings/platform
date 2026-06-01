# Lightweight test runner (pytest is OOM-heavy in this constrained env).
# Provides a minimal pytest.raises shim and runs every test_* function.
import sys, types, traceback, contextlib

# minimal pytest shim
pytest = types.ModuleType("pytest")
@contextlib.contextmanager
def _raises(exc):
    try:
        yield
    except exc:
        return
    except BaseException as e:
        raise AssertionError(f"expected {exc}, got {type(e).__name__}: {e}")
    raise AssertionError(f"expected {exc} to be raised, none raised")
pytest.raises = _raises
sys.modules["pytest"] = pytest

import importlib.util, os
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
spec = importlib.util.spec_from_file_location("test_khipu_os", os.path.join(here, "tests", "test_khipu_os.py"))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

tests = sorted(n for n in dir(mod) if n.startswith("test_"))
passed = failed = 0
for name in tests:
    try:
        getattr(mod, name)()
        print(f"PASS {name}")
        passed += 1
    except Exception:
        print(f"FAIL {name}")
        traceback.print_exc()
        failed += 1
print(f"\n=== {passed} passed, {failed} failed (of {len(tests)}) ===")
sys.exit(1 if failed else 0)
