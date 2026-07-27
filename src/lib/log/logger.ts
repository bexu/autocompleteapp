import { redact } from "./redact";

// Logger structurat, minimal, care redactează PII la fiecare apel. Toate
// mesajele și contextul trec prin `redact` înainte să iasă din proces.
// Nu folosi console.* direct pe fluxuri cu date personale — folosește asta.

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: unknown;
}

interface LogRecord {
  level: LogLevel;
  msg: string;
  time: string;
  context?: unknown;
}

// Sink injectabil (implicit console) — util pentru teste și pentru a schimba
// destinația (ex. transport structurat) fără a atinge apelanții.
export type LogSink = (record: LogRecord) => void;

const defaultSink: LogSink = (record) => {
  const line = JSON.stringify(record);
  if (record.level === "error") console.error(line);
  else if (record.level === "warn") console.warn(line);
  else console.log(line);
};

export class Logger {
  constructor(
    private readonly sink: LogSink = defaultSink,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  private write(level: LogLevel, msg: string, context?: LogContext): void {
    const record: LogRecord = {
      level,
      msg: redact(msg) as string,
      time: this.now(),
    };
    if (context !== undefined) record.context = redact(context);
    this.sink(record);
  }

  debug(msg: string, context?: LogContext): void {
    this.write("debug", msg, context);
  }
  info(msg: string, context?: LogContext): void {
    this.write("info", msg, context);
  }
  warn(msg: string, context?: LogContext): void {
    this.write("warn", msg, context);
  }
  error(msg: string, context?: LogContext): void {
    this.write("error", msg, context);
  }
}

export const logger = new Logger();
