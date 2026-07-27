import { describe, expect, it } from "vitest";
import { redact } from "@/lib/log/redact";
import { Logger, type LogSink } from "@/lib/log/logger";

describe("redact", () => {
  it("redactează cheile PII după nume", () => {
    const out = redact({
      cnp: "1920707123456",
      nume: "Popescu",
      iban: "RO49AAAA1B31007593840000",
      dosarId: "abc-123",
    }) as Record<string, unknown>;

    expect(out.cnp).toBe("[REDACTED]");
    expect(out.nume).toBe("[REDACTED]");
    expect(out.iban).toBe("[REDACTED]");
    expect(out.dosarId).toBe("abc-123"); // non-PII rămâne
  });

  it("redactează PII după tipar de valoare, chiar și pe chei neutre", () => {
    const out = redact({ mesaj: "utilizatorul cu CNP 1920707123456 a intrat" }) as {
      mesaj: string;
    };
    expect(out.mesaj).not.toContain("1920707123456");
    expect(out.mesaj).toContain("[REDACTED]");
  });

  it("redactează email-uri în text liber", () => {
    const out = redact("scrie la ion.popescu@example.com azi") as string;
    expect(out).not.toContain("ion.popescu@example.com");
  });

  it("merge recursiv și pe array-uri", () => {
    const out = redact({ persoane: [{ nume: "X" }, { nume: "Y" }] }) as {
      persoane: Array<{ nume: string }>;
    };
    expect(out.persoane[0].nume).toBe("[REDACTED]");
    expect(out.persoane[1].nume).toBe("[REDACTED]");
  });

  it("rezistă la referințe circulare", () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    expect(() => redact(obj)).not.toThrow();
  });

  it("redactează mesajul unei erori", () => {
    const out = redact(new Error("eșec pentru 1920707123456")) as {
      name: string;
      message: string;
    };
    expect(out.message).not.toContain("1920707123456");
  });
});

describe("Logger", () => {
  it("nu emite niciun PII în output", () => {
    const lines: unknown[] = [];
    const sink: LogSink = (r) => lines.push(r);
    const log = new Logger(sink, () => "2026-07-27T00:00:00.000Z");

    log.info("procesez dosar", { cnp: "1920707123456", nume: "Ionescu", dosarId: "d1" });

    const serialized = JSON.stringify(lines);
    expect(serialized).not.toContain("1920707123456");
    expect(serialized).not.toContain("Ionescu");
    expect(serialized).toContain("d1"); // context non-PII se păstrează
    expect(serialized).toContain("[REDACTED]");
  });
});
