# SPDX-License-Identifier: Apache-2.0
"""Actual loopback HTTPS and separate processes; not a hosted-readiness claim."""
import hashlib
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import ssl
import subprocess
import sys
import queue
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

import pytest

from khipu_lmdb import KhipuLMDB
from khipu_lmdb.core import _finite_canon
from khipu_lmdb.delivery import DeliveryError, Peer, accept_batch, deliver_once

MAP_SIZE = 8 * 1024 * 1024
ENV_NAME = "SZL_TEST_REPLICATION_CREDENTIAL"


def peer(endpoint):
    return Peer("mirror-fixture", endpoint, "source-fixture", "fixture", ENV_NAME)


def source(path):
    return KhipuLMDB(str(path), organ="source-fixture", ns="fixture", map_size=MAP_SIZE)


def snapshot(store):
    with store._env.begin() as txn:
        return dict(txn.cursor())


def _serve(root, mode, port):
    """Test process only: exact route, auth, bounded body, real receiver adapter."""
    root = Path(root)
    mirror = KhipuLMDB(str(root / "mirror"), organ="mirror-fixture", ns="fixture", map_size=MAP_SIZE)
    if mode == "die-before-commit":
        append = mirror._append_txn

        def interrupted_append(*args, **kwargs):
            append(*args, **kwargs)
            os._exit(91)  # Real process loss while the batch write txn is open.

        mirror._append_txn = interrupted_append

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def do_POST(self):
            with (root / "requests.jsonl").open("a", encoding="utf-8") as output:
                output.write(json.dumps({"path": self.path, "tls_version": self.connection.version()}) + "\n")
            if self.path != "/replicate":
                self.send_error(404)
                return
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 4 * 1024 * 1024:
                self.send_error(413)
                return
            raw = self.rfile.read(length)
            try:
                ack = accept_batch(mirror, configured, raw,
                                   authorization=self.headers.get("Authorization"))
            except DeliveryError:
                self.send_error(401)
                return
            with (root / "bodies.jsonl").open("a", encoding="utf-8") as output:
                output.write(json.dumps({"sha256": hashlib.sha256(raw).hexdigest()}) + "\n")
            if mode == "lost-ack" and not (root / "dropped").exists():
                (root / "dropped").write_text("dropped once", encoding="utf-8")
                self.connection.shutdown(socket.SHUT_RDWR)
                self.connection.close()
                return
            if mode == "redirect":
                self.send_response(307)
                self.send_header("Location", configured.endpoint + "/redirected")
                self.end_headers()
                return
            if mode == "wrong-ack":
                value = json.loads(ack)
                value["batch_id"] = "0" * 64
                ack = _finite_canon(value)
            elif mode == "boolean-ack":
                value = json.loads(ack)
                value["schema"] = True
                ack = _finite_canon(value)
            elif mode == "oversized-ack":
                ack += b" " * 4097
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(ack)))
            self.end_headers()
            self.wfile.write(ack)

    server = HTTPServer(("127.0.0.1", int(port)), Handler)
    configured = peer(f"https://localhost:{server.server_port}/replicate")
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    context.load_cert_chain(root / "cert.pem", root / "key.pem")
    server.socket = context.wrap_socket(server.socket, server_side=True)
    print(json.dumps({"endpoint": configured.endpoint}), flush=True)
    try:
        server.serve_forever(poll_interval=0.05)
    finally:
        server.server_close()
        mirror.close()


@pytest.fixture
def credential(monkeypatch):
    value = secrets.token_urlsafe(32)
    monkeypatch.setenv(ENV_NAME, value)
    return value


@pytest.fixture
def certificates(tmp_path):
    executable = shutil.which("openssl")
    if executable is None and sys.platform == "win32":
        candidate = Path(r"C:\Program Files\Git\usr\bin\openssl.exe")
        if candidate.is_file():
            executable = str(candidate)
    assert executable is not None, "OpenSSL is required for actual HTTPS qualification"
    config = tmp_path / "openssl.cnf"
    config.write_text("[req]\nprompt=no\ndistinguished_name=dn\nx509_extensions=ext\n"
                      "[dn]\nCN=localhost\n[ext]\nsubjectAltName=DNS:localhost\n"
                      "basicConstraints=critical,CA:TRUE\n", encoding="ascii")
    subprocess.run([executable, "req", "-x509", "-newkey", "rsa:2048", "-nodes",
                    "-days", "1", "-keyout", str(tmp_path / "key.pem"),
                    "-out", str(tmp_path / "cert.pem"), "-config", str(config)],
                   check=True, capture_output=True, timeout=30)
    return tmp_path


class Server:
    def __init__(self, root, mode="normal", port=0):
        self.process = subprocess.Popen([sys.executable, "-B", __file__, "serve", str(root),
                                         mode, str(port)], stdout=subprocess.PIPE,
                                        stderr=subprocess.PIPE, text=True)
        output = queue.Queue()
        reader = threading.Thread(target=lambda: output.put(self.process.stdout.readline()), daemon=True)
        reader.start()
        try:
            self.endpoint = json.loads(output.get(timeout=15))["endpoint"]
        except (queue.Empty, ValueError, KeyError):
            self.close()
            raise AssertionError("HTTPS receiver did not start within 15 seconds") from None

    def close(self):
        self.process.terminate()
        try:
            self.process.communicate(timeout=10)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.communicate(timeout=10)


@pytest.mark.parametrize("failure_mode", ["lost-ack", "die-before-commit"])
def test_https_lost_ack_survives_both_process_restarts(certificates, credential, failure_mode):
    root = certificates
    server = Server(root, failure_mode)
    configured = peer(server.endpoint)
    try:
        store = source(root / "source")
        originals = [store.append("fixture", {"value": value}) for value in range(3)]
        with pytest.raises(DeliveryError, match="TRANSPORT_UNAVAILABLE"):
            deliver_once(store, configured, ca_file=str(root / "cert.pem"))
        pending = store.replication_outbound_state(configured.peer_id, configured.binding_sha256)
        assert pending["next_seq"] == 0 and pending["pending"]["next_seq"] == 3
        batch_id = pending["pending"]["batch_id"]
        store.close()
    finally:
        server.close()
    # Reopen the real receiver after termination and use a different sender
    # process. No in-memory source cursor, ACK or origin cache survives.
    port = server.endpoint.split(":")[2].split("/")[0]
    server = Server(root, "normal", port)
    try:
        result = subprocess.run([sys.executable, "-B", __file__, "send", str(root), server.endpoint],
                                check=True, capture_output=True, text=True, timeout=20)
        assert json.loads(result.stdout) == {"delivered": 3, "batch_id": batch_id}
    finally:
        server.close()
    store = source(root / "source")
    mirror = KhipuLMDB(str(root / "mirror"), organ="mirror-fixture", ns="fixture", map_size=MAP_SIZE)
    try:
        state = store.replication_outbound_state(configured.peer_id, configured.binding_sha256)
        assert state["next_seq"] == 3 and state["pending"] is None
        assert mirror.stats()["entries"] == 3
        assert mirror.verify()["ok"]
        assert [mirror.get_by_seq(i)["payload"]["origin"] for i in range(3)] == originals
        requests = [json.loads(line) for line in (root / "bodies.jsonl").read_text().splitlines()]
        expected_requests = 2 if failure_mode == "lost-ack" else 1
        assert requests == [{"sha256": batch_id}] * expected_requests
        connections = [json.loads(line) for line in (root / "requests.jsonl").read_text().splitlines()]
        assert connections and all(item["tls_version"] in ("TLSv1.2", "TLSv1.3") for item in connections)
    finally:
        store.close()
        mirror.close()


@pytest.mark.parametrize("mode,reason", [("wrong-ack", "ACK_INVALID"),
    ("boolean-ack", "ACK_INVALID"), ("oversized-ack", "ACK_INVALID"), ("redirect", "RESPONSE_REJECTED")])
def test_https_invalid_ack_never_advances(certificates, credential, mode, reason):
    server = Server(certificates, mode)
    configured = peer(server.endpoint)
    store = source(certificates / "source")
    try:
        store.append("fixture", {})
        with pytest.raises(DeliveryError, match=reason):
            deliver_once(store, configured, ca_file=str(certificates / "cert.pem"))
        state = store.replication_outbound_state(configured.peer_id, configured.binding_sha256)
        assert state["next_seq"] == 0 and state["pending"] is not None
        paths = [json.loads(line)["path"] for line in (certificates / "requests.jsonl").read_text().splitlines()]
        assert paths == ["/replicate"]
    finally:
        store.close()
        server.close()


@pytest.mark.parametrize("failure", ["wrong-token", "untrusted-cert", "wrong-hostname"])
def test_https_auth_and_tls_fail_closed(certificates, credential, monkeypatch, failure):
    server = Server(certificates)
    endpoint = server.endpoint.replace("localhost", "127.0.0.1") if failure == "wrong-hostname" else server.endpoint
    configured = peer(endpoint)
    store = source(certificates / "source")
    try:
        store.append("fixture", {})
        if failure == "wrong-token":
            monkeypatch.setenv(ENV_NAME, secrets.token_urlsafe(32))
        options = {} if failure == "untrusted-cert" else {"ca_file": str(certificates / "cert.pem")}
        with pytest.raises(DeliveryError):
            deliver_once(store, configured, **options)
        state = store.replication_outbound_state(configured.peer_id, configured.binding_sha256)
        assert state["next_seq"] == 0 and state["pending"] is not None
        assert not (certificates / "bodies.jsonl").exists()
    finally:
        store.close()
        server.close()


def test_missing_credential_and_invalid_timeout_never_register(tmp_path, monkeypatch):
    configured = peer("https://localhost/replicate")
    store = source(tmp_path / "source")
    try:
        before = snapshot(store)
        monkeypatch.delenv(ENV_NAME, raising=False)
        with pytest.raises(DeliveryError, match="CREDENTIAL_UNAVAILABLE"):
            deliver_once(store, configured)
        assert snapshot(store) == before
        monkeypatch.setenv(ENV_NAME, secrets.token_urlsafe(32))
        for timeout in (True, 0, -1, 31, float("nan"), float("inf")):
            with pytest.raises(DeliveryError, match="INVALID_TIMEOUT"):
                deliver_once(store, configured, timeout=timeout)
        assert snapshot(store) == before
    finally:
        store.close()


def test_checkpointed_batch_cannot_be_replaced_between_prepare_and_send(tmp_path, credential, monkeypatch):
    import http.client
    configured = peer("https://localhost/replicate")
    store = source(tmp_path / "source")
    try:
        store.append("fixture", {"index": 0})
        first = store.prepare_replication_batch(configured.peer_id, configured.binding_sha256)
        store.acknowledge_replication_batch(configured.peer_id, configured.binding_sha256, first["batch_id"])
        monkeypatch.setattr(http.client, "HTTPSConnection", lambda *args, **kwargs:
                            pytest.fail("changed pending batch must not open HTTPS"))
        with pytest.raises(DeliveryError, match="PREPARED_BATCH_CHANGED"):
            deliver_once(store, configured, expected_batch_id=first["batch_id"])
        store.append("fixture", {"index": 1})
        with pytest.raises(DeliveryError, match="PREPARED_BATCH_CHANGED"):
            deliver_once(store, configured, expected_batch_id=first["batch_id"])
        state = store.replication_outbound_state(configured.peer_id, configured.binding_sha256)
        assert state["next_seq"] == 1 and state["pending"]["next_seq"] == 2
    finally:
        store.close()


@pytest.mark.parametrize("endpoint", ["http://localhost/replicate", "https://user:pass@localhost/replicate",
    "https://localhost/replicate?token=value", "https://localhost/replicate#fragment", "https://localhost",
    "https://localhost:0/replicate", "https://localhost:/replicate", "https://localhost/\nreplicate",
    "https://localhost:invalid/replicate", "https://localhost\\elsewhere/replicate"])
def test_unsafe_endpoint_rejected(endpoint):
    with pytest.raises(DeliveryError, match="INVALID_ENDPOINT"):
        peer(endpoint)


def test_receiver_rejects_wrong_binding_or_malformed_receipts_before_any_write(tmp_path, credential):
    configured = peer("https://localhost/replicate")
    store = source(tmp_path / "source")
    mirror = KhipuLMDB(str(tmp_path / "mirror"), organ="mirror", ns="fixture", map_size=MAP_SIZE)
    try:
        store.append("fixture", {"index": 0})
        store.append("fixture", {"index": 1})
        body = store.prepare_replication_batch(configured.peer_id, configured.binding_sha256)["body"]
        before = snapshot(mirror)
        for field, value in (("peer_id", "another"), ("source_ns", "other"),
                             ("binding_sha256", "f" * 64), ("schema", True), ("next_seq", 9)):
            changed = json.loads(body)
            changed[field] = value
            with pytest.raises(DeliveryError, match="BATCH_INVALID"):
                accept_batch(mirror, configured, _finite_canon(changed), authorization="Bearer " + credential)
            assert snapshot(mirror) == before
        changed = json.loads(body)
        changed["receipts"][1]["payload"] = {"altered": True}
        with pytest.raises(DeliveryError, match="BATCH_INVALID"):
            accept_batch(mirror, configured, _finite_canon(changed), authorization="Bearer " + credential)
        assert snapshot(mirror) == before
        with pytest.raises(DeliveryError, match="AUTHENTICATION_REQUIRED"):
            accept_batch(mirror, configured, body, authorization=None)
        assert snapshot(mirror) == before
    finally:
        store.close()
        mirror.close()


def test_receiver_rejects_cross_batch_gap_fork_and_rolls_back_conflict(tmp_path, credential):
    configured = peer("https://localhost/replicate")
    store = source(tmp_path / "source")
    mirror = KhipuLMDB(str(tmp_path / "mirror"), organ="mirror", ns="fixture", map_size=MAP_SIZE)
    try:
        for number in range(4):
            store.append("fixture", {"index": number})
        first = store.prepare_replication_batch(configured.peer_id, configured.binding_sha256, limit=2)
        accept_batch(mirror, configured, first["body"], authorization="Bearer " + credential)
        store.acknowledge_replication_batch(configured.peer_id, configured.binding_sha256, first["batch_id"])
        second = store.prepare_replication_batch(configured.peer_id, configured.binding_sha256, limit=2)
        before = snapshot(mirror)
        # This is hash-valid but forks the source predecessor between batches.
        changed = json.loads(second["body"])
        changed["receipts"][0]["prev"] = "f" * 64
        fields = ("organ", "ns", "seq", "action", "payload_digest", "prev")
        changed["receipts"][0]["digest"] = hashlib.sha3_256(_finite_canon(
            {key: changed["receipts"][0][key] for key in fields})).hexdigest()
        changed["receipts"][1]["prev"] = changed["receipts"][0]["digest"]
        changed["receipts"][1]["digest"] = hashlib.sha3_256(_finite_canon(
            {key: changed["receipts"][1][key] for key in fields})).hexdigest()
        with pytest.raises(DeliveryError, match="SOURCE_DISCONTINUITY"):
            accept_batch(mirror, configured, _finite_canon(changed), authorization="Bearer " + credential)
        assert snapshot(mirror) == before
        gap = json.loads(second["body"])
        gap["receipts"] = gap["receipts"][1:]
        gap["first_seq"] += 1
        with pytest.raises(DeliveryError, match="SOURCE_DISCONTINUITY"):
            accept_batch(mirror, configured, _finite_canon(gap), authorization="Bearer " + credential)
        assert snapshot(mirror) == before
        # A conflicting preexisting final origin must roll back the earlier
        # receipt in this transaction as well as its inbound cursor.
        conflicting = json.loads(second["body"])["receipts"][1]
        conflicting["auxiliary"] = "different"
        mirror.append_replicated(conflicting)
        conflict_before = snapshot(mirror)
        with pytest.raises(ValueError, match="ORIGIN_CONFLICT"):
            accept_batch(mirror, configured, second["body"], authorization="Bearer " + credential)
        assert snapshot(mirror) == conflict_before
    finally:
        store.close()
        mirror.close()


def test_receiver_contiguous_batches_and_exact_last_replay(tmp_path, credential):
    configured = peer("https://localhost/replicate")
    store = source(tmp_path / "source")
    mirror = KhipuLMDB(str(tmp_path / "mirror"), organ="mirror", ns="fixture", map_size=MAP_SIZE)
    try:
        for number in range(3):
            store.append("fixture", {"index": number})
        for expected_end in (1, 2, 3):
            batch = store.prepare_replication_batch(configured.peer_id, configured.binding_sha256, limit=1)
            ack = accept_batch(mirror, configured, batch["body"], authorization="Bearer " + credential)
            before = snapshot(mirror)
            assert accept_batch(mirror, configured, batch["body"], authorization="Bearer " + credential) == ack
            assert snapshot(mirror) == before
            store.acknowledge_replication_batch(configured.peer_id, configured.binding_sha256, batch["batch_id"])
            assert mirror.stats()["entries"] == expected_end
    finally:
        store.close()
        mirror.close()


if __name__ == "__main__":
    if sys.argv[1] == "serve":
        _serve(*sys.argv[2:])
    elif sys.argv[1] == "send":
        root = Path(sys.argv[2])
        instance = source(root / "source")
        try:
            print(json.dumps(deliver_once(instance, peer(sys.argv[3]), ca_file=str(root / "cert.pem"))))
        finally:
            instance.close()
