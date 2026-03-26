type AppConfig = {
  port: number;
  nodeEnv: string;
};

function parsePort(value: string | undefined): number {
  const fallbackPort = 3000;

  if (!value) {
    return fallbackPort;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallbackPort;
  }

  return parsed;
}

export const config: AppConfig = {
  port: parsePort(process.env.PORT),
  nodeEnv: process.env.NODE_ENV ?? "development"
};
