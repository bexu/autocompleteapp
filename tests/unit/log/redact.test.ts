import { describe, expect, it } from "vitest";
import { redact } from "@/lib/log/redact";
import { Logger, type LogSink } from "@/lib/log/logger";

describe("redact — chei PII", () => {
  it("redactează cheile PII RO după nume", () => {
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

  it("redactează chei EN / camelCase (name, income, salary, phone)", () => {
    const out = redact({
      name: "Ion Popescu",
      firstName: "Ion",
      income: 95000,
      salary: 8000,
      phone: "0712345678",
      count: 3,
    }) as Record<string, unknown>;

    expect(out.name).toBe("[REDACTED]");
    expect(out.firstName).toBe("[REDACTED]");
    expect(out.income).toBe("[REDACTED]");
    expect(out.salary).toBe("[REDACTED]");
    expect(out.phone).toBe("[REDACTED]");
    expect(out.count).toBe(3);
  });

  it("acoperă forma user better-auth ({ id, name, email })", () => {
    const out = redact({ id: "u_1", name: "Maria I.", email: "m@ex.com" }) as Record<
      string,
      unknown
    >;
    expect(out.id).toBe("u_1");
    expect(out.name).toBe("[REDACTED]");
    expect(out.email).toBe("[REDACTED]");
  });
});

describe("redact — tipare de valoare pe chei neutre", () => {
  it("redactează CNP (string și numeric)", () => {
    expect((redact({ x: "cod 1920707123456 aici" }) as { x: string }).x).not.toContain(
      "1920707123456",
    );
    // numeric pe cheie neutră — nu mai scapă
    expect(redact({ ref: 1920707123456 })).toEqual({ ref: "[REDACTED]" });
  });

  it("redactează IBAN inclusiv format cu spații", () => {
    const spaced = redact({ x: "cont RO49 AAAA 1B31 0075 9384 0000 gata" }) as {
      x: string;
    };
    expect(spaced.x).not.toContain("RO49");
    expect(spaced.x).toContain("[REDACTED]");
  });

  it("redactează email, telefon și serie+nr CI în text liber", () => {
    expect(redact("scrie la ion.popescu@example.com")).not.toContain("@example.com");
    expect(redact("sună la 0712345678")).not.toContain("0712345678");
    expect(redact("CI seria XX 123456")).not.toContain("123456");
  });

  it("redactează dată calendaristică (dd.mm.yyyy)", () => {
    expect(redact("născut 07.07.1992")).not.toContain("07.07.1992");
  });

  it("păstrează numere non-PII neatinse", () => {
    expect(redact({ durataMs: 1234, total: 42 })).toEqual({ durataMs: 1234, total: 42 });
  });
});

describe("redact — tipuri speciale", () => {
  it("nu enumeră bytes dintr-un Buffer (scanuri)", () => {
    const out = redact({ scanBytes: Buffer.from([1, 2, 3, 4]) }) as {
      scanBytes: string;
    };
    // cheia „scan" e oricum PII, dar verificăm și tratarea binară pe cheie neutră
    const bin = redact({ blob: Buffer.from([1, 2, 3, 4]) }) as { blob: string };
    expect(bin.blob).toMatch(/\[Buffer len=4\]/);
    expect(out.scanBytes).toBe("[REDACTED]");
  });

  it("randează Date ca ISO, nu {}", () => {
    const d = new Date("2026-07-27T00:00:00.000Z");
    expect(redact({ createdAt: d })).toEqual({ createdAt: "2026-07-27T00:00:00.000Z" });
  });

  it("redactează recursiv în Map și Set", () => {
    const m = new Map<string, unknown>([["cnp", "1920707123456"], ["ok", "da"]]);
    expect(redact(m)).toEqual({ cnp: "[REDACTED]", ok: "da" });
    const s = new Set(["ion.popescu@example.com", "neutral"]);
    const arr = redact(s) as string[];
    expect(arr).toContain("[REDACTED]");
    expect(arr).toContain("neutral");
  });

  it("gestionează bigint fără să arunce", () => {
    expect(() => redact({ big: BigInt(10) })).not.toThrow();
    expect(redact({ big: BigInt("1920707123456") })).toEqual({ big: "[REDACTED]" });
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
    const out = redact(new Error("eșec pentru 1920707123456")) as { message: string };
    expect(out.message).not.toContain("1920707123456");
  });
});

describe("Logger", () => {
  it("nu emite niciun PII (chei + valori) în output", () => {
    const lines: unknown[] = [];
    const sink: LogSink = (r) => lines.push(r);
    const log = new Logger(sink, () => "2026-07-27T00:00:00.000Z");

    log.info("procesez dosar", {
      cnp: "1920707123456",
      nume: "Ionescu",
      ref: 1920707123456,
      dosarId: "d1",
    });

    const serialized = JSON.stringify(lines);
    expect(serialized).not.toContain("1920707123456");
    expect(serialized).not.toContain("Ionescu");
    expect(serialized).toContain("d1"); // context non-PII se păstrează
    expect(serialized).toContain("[REDACTED]");
  });

  it("prinde PII cu tipar în msg, dar NU nume proprii (limitare documentată)", () => {
    const lines: Array<{ msg: string }> = [];
    const log = new Logger((r) => lines.push(r as { msg: string }), () => "t");
    log.info("user 1920707123456 (Ion Popescu) a intrat");
    expect(lines[0].msg).not.toContain("1920707123456"); // tiparul prinde CNP
    expect(lines[0].msg).toContain("Ion Popescu"); // numele NU e prins — nu interpola PII în msg
  });

  it("nu aruncă dacă un bigint ajunge în context", () => {
    const lines: unknown[] = [];
    const log = new Logger((r) => lines.push(r), () => "t");
    expect(() => log.info("ok", { n: BigInt(5) })).not.toThrow();
  });
});
