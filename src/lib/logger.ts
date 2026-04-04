export type LogLevel = "info" | "error";

export type LogPayload = Record<string, unknown>;

function writeLog(level: LogLevel, event: string, payload: LogPayload): void {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...payload
  });

  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}

export function logInfo(event: string, payload: LogPayload): void {
  writeLog("info", event, payload);
}

export function logError(event: string, payload: LogPayload): void {
  writeLog("error", event, payload);
}
