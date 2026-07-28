import { describe, expect, it } from "vitest";
import { observe } from "@/lib/http/observe";

describe("observe — wrapper de observabilitate pentru rute", () => {
  it("adaugă x-request-id și întoarce răspunsul handler-ului", async () => {
    const handler = observe("test", async () => new Response("ok", { status: 200 }));
    const res = await handler(new Request("http://x/api/test", { method: "POST" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-request-id")).toBeTruthy();
  });

  it("propagă x-request-id primit din cerere (corelare)", async () => {
    const handler = observe("test", async () => new Response("ok"));
    const res = await handler(new Request("http://x/api/test", { headers: { "x-request-id": "rid-123" } }));
    expect(res.headers.get("x-request-id")).toBe("rid-123");
  });

  it("generează un requestId dacă antetul e gol sau nevalid (nu propagă gol/injecție)", async () => {
    const handler = observe("test", async () => new Response("ok"));
    const empty = await handler(new Request("http://x/api/test", { headers: { "x-request-id": "" } }));
    expect(empty.headers.get("x-request-id")).toBeTruthy();

    // Valoare validă ca antet, dar în afara charset-ului/lungimii permise →
    // ignorată, se generează una curată.
    const dirtyVal = "a b c @#$ " + "x".repeat(200);
    const dirty = await handler(new Request("http://x/api/test", { headers: { "x-request-id": dirtyVal } }));
    const rid = dirty.headers.get("x-request-id");
    expect(rid).toBeTruthy();
    expect(rid).not.toBe(dirtyVal);
    expect(/^[\w.-]{1,128}$/.test(rid ?? "")).toBe(true);
  });

  it("prinde erorile neprevăzute → 500 cu requestId, fără a scurge detalii interne", async () => {
    const handler = observe("test", async () => {
      throw new Error("stack intern cu 1920707123456");
    });
    const res = await handler(new Request("http://x/api/test", { method: "POST" }));
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string; requestId: string };
    expect(body.error).toBe("eroare internă");
    expect(body.requestId).toBeTruthy();
    expect(res.headers.get("x-request-id")).toBe(body.requestId);
    // Nici mesajul erorii, nici PII-ul din el nu ajung la client.
    const raw = JSON.stringify(body);
    expect(raw).not.toContain("stack intern");
    expect(raw).not.toContain("1920707123456");
  });
});
