"""Real loopback HTTP and daemon contracts; no GPU or external service."""
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest.mock import patch

import daemon
import vllm_backend as backend


class BackendContracts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.responses = {}
        cls.requests = []

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                cls.requests.append(self.path)
                status, location = cls.responses.get(self.path, (404, None))
                self.send_response(status)
                if location:
                    self.send_header("Location", location)
                self.end_headers()

            def log_message(self, *_args):
                pass

        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.root = f"http://127.0.0.1:{cls.server.server_port}"
        cls.base = cls.root + "/v1"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=2)

    def setUp(self):
        self.responses.clear()
        self.requests.clear()

    def test_successful_health_and_models(self):
        self.responses.update({"/health": (200, None), "/v1/models": (200, None)})
        self.assertTrue(backend.probe_vllm_health(self.base))
        self.assertTrue(backend.probe_ollama(self.base))

    def test_errors_are_never_healthy(self):
        for status in (301, 302, 307, 308, 400, 401, 403, 404, 405, 429, 500, 503):
            with self.subTest(status=status):
                self.responses.update({path: (status, None)
                                       for path in ("/health", "/v1/models", "/v1")})
                self.assertFalse(backend.probe_vllm_health(self.base))
                self.assertFalse(backend.probe_ollama(self.base))

    def test_redirect_is_not_followed_to_a_successful_login_page(self):
        self.responses.update({"/health": (302, "/login"),
                               "/v1/models": (302, "/login"),
                               "/v1": (302, "/login"), "/login": (200, None)})
        self.assertFalse(backend.probe_vllm_health(self.base))
        self.assertFalse(backend.probe_ollama(self.base))
        self.assertNotIn("/login", self.requests)

    def test_unavailable_health_route_falls_back_to_models(self):
        for status in (404, 405):
            with self.subTest(status=status):
                self.responses.update({"/health": (status, None),
                                       "/v1/models": (200, None)})
                self.assertTrue(backend.probe_vllm_health(self.base))

    def test_unhealthy_engine_or_auth_failure_is_not_masked_by_models(self):
        for status in (401, 403, 429, 500, 503):
            with self.subTest(status=status):
                self.requests.clear()
                self.responses.update({"/health": (status, None),
                                       "/v1/models": (200, None)})
                self.assertFalse(backend.probe_vllm_health(self.base))
                self.assertNotIn("/v1/models", self.requests)

    def test_trailing_slash_preserves_server_root(self):
        self.responses["/health"] = (200, None)
        self.assertTrue(backend.probe_vllm_health(self.base + "/"))
        self.assertEqual(self.requests, ["/health"])

    def test_transport_failure_is_unavailable(self):
        with patch.object(backend.urllib.request, "build_opener", side_effect=OSError):
            self.assertIsNone(backend._http_get(self.base, 0.1))

    def test_router_fallback_remains_false_until_reselected(self):
        choice = backend.select_backend(vllm_probe=lambda: False,
                                        ollama_probe=lambda: False)
        with patch.object(backend, "_http_get", return_value=200) as network:
            kwargs = backend.daemon_kwargs(choice=choice)
            resident = daemon.ResidentDaemon(endpoint=kwargs["endpoint"],
                                             probe=kwargs["probe"])
            resident._update_posture()
            self.assertFalse(resident.serving_local)
            self.assertFalse(kwargs["_sovereign"])
            network.assert_not_called()

    def test_daemon_integration_failure_fails_selftest(self):
        with patch.object(daemon, "ResidentDaemon", side_effect=RuntimeError("broken wiring")):
            with self.assertRaisesRegex(RuntimeError, "broken wiring"):
                backend._selftest()


if __name__ == "__main__":
    unittest.main()
