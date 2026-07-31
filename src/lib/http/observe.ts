import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { logger } from "@/lib/log/logger";

// Observabilitate pentru rutele API: fiecare cerere primește un `requestId`
// (corelabil în loguri și în răspuns prin antetul `x-request-id`), se loghează
// structurat durata + statusul, iar erorile neprevăzute sunt prinse uniform →
// 500 cu requestId (fără a scurge detalii interne către client). Fără PII:
// logăm doar metoda, calea (fără query), status, durată, requestId. Logger-ul
// aplică oricum `redact` pe tot ce iese.

// Handler de rută; `Ctx` acoperă argumentele suplimentare ale rutelor dinamice
// (ex. `{ params }` la /api/dossiers/[id]/...).
type RouteHandler<Ctx extends unknown[] = []> = (
  req: Request,
  ...rest: Ctx
) => Promise<Response> | Response;

function pathOf(url: string): string {
  try {
    return new URL(url).pathname; // fără query (poate conține valori)
  } catch {
    return "?";
  }
}

// Acceptă un requestId primit doar dacă e ne-gol și „curat" (charset + lungime
// mărginite) — altfel generăm unul. Evită corelarea pierdută (header gol) și
// poluarea logurilor cu valori arbitrare controlate de client.
function resolveRequestId(header: string | null): string {
  return header && /^[\w.-]{1,128}$/.test(header) ? header : randomUUID();
}

export function observe<Ctx extends unknown[] = []>(
  name: string,
  handler: RouteHandler<Ctx>,
): RouteHandler<Ctx> {
  return async (req: Request, ...rest: Ctx): Promise<Response> => {
    const requestId = resolveRequestId(req.headers.get("x-request-id"));
    const start = Date.now();
    try {
      const res = await handler(req, ...rest);
      res.headers.set("x-request-id", requestId);
      logger.info("api_request", {
        route: name,
        method: req.method,
        path: pathOf(req.url),
        status: res.status,
        durationMs: Date.now() - start,
        requestId,
      });
      return res;
    } catch (e) {
      logger.error("api_error", {
        route: name,
        method: req.method,
        path: pathOf(req.url),
        durationMs: Date.now() - start,
        requestId,
        error: e instanceof Error ? { name: e.name, message: e.message } : { name: "Unknown" },
      });
      return NextResponse.json(
        { error: "eroare internă", requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }
  };
}
