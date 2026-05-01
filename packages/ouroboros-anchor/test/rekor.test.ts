import { describe, it, expect, vi } from "vitest";
import { submitRekorEntry, fetchRekorEntry } from "../src/rekor.ts";

function mockFetch(response: any, opts: { ok?: boolean; status?: number } = {}) {
  return vi.fn(async () =>
    Promise.resolve({
      ok: opts.ok ?? true,
      status: opts.status ?? 200,
      json: async () => response,
      text: async () => JSON.stringify(response),
    } as Response)
  );
}

describe("submitRekorEntry", () => {
  it("posts a hashedrekord and parses the uuid", async () => {
    const fakeUuid = "deadbeef";
    const fetchImpl = mockFetch({
      [fakeUuid]: { logIndex: 42, logID: "log-1", integratedTime: 1700000000 },
    });
    const entry = await submitRekorEntry("a".repeat(64), "sigB64", "pkB64", {
      fetchImpl: fetchImpl as any,
    });
    expect(entry.uuid).toBe(fakeUuid);
    expect(entry.logIndex).toBe(42);
    expect(entry.logID).toBe("log-1");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("throws on non-ok response", async () => {
    const fetchImpl = mockFetch({ error: "bad" }, { ok: false, status: 400 });
    await expect(
      submitRekorEntry("a".repeat(64), "s", "p", { fetchImpl: fetchImpl as any })
    ).rejects.toThrow(/Rekor submit failed/);
  });

  it("uses configured rekorUrl", async () => {
    const fetchImpl = mockFetch({ uuid1: {} });
    await submitRekorEntry("a".repeat(64), "s", "p", {
      fetchImpl: fetchImpl as any,
      rekorUrl: "https://internal.example/rekor/",
    });
    const call = (fetchImpl.mock.calls[0] as any[])[0];
    expect(call).toBe("https://internal.example/rekor/api/v1/log/entries");
  });
});

describe("fetchRekorEntry", () => {
  it("GETs the entry by uuid", async () => {
    const fetchImpl = mockFetch({ ok: true });
    const r = await fetchRekorEntry("abc/def", { fetchImpl: fetchImpl as any });
    expect(r).toEqual({ ok: true });
    const call = (fetchImpl.mock.calls[0] as any[])[0];
    expect(call).toContain("abc%2Fdef");
  });

  it("throws on non-ok", async () => {
    const fetchImpl = mockFetch({}, { ok: false, status: 404 });
    await expect(fetchRekorEntry("u", { fetchImpl: fetchImpl as any })).rejects.toThrow(
      /Rekor fetch failed/
    );
  });
});
