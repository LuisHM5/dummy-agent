import { loadEnvFile } from "node:process";

/**
 * Configuración común para ambos agentes (LangChain y Strands).
 *
 * Credenciales: si AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY están en el .env
 * se usan explícitamente; si no, ambos SDKs caen a la cadena de credenciales
 * por defecto de AWS (AWS_PROFILE, ~/.aws/credentials, SSO, rol de IAM...).
 */
try {
  loadEnvFile(".env");
} catch {
  // Sin .env: se usan las variables de entorno del proceso.
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export interface AppConfig {
  modelId: string;
  region: string;
  /** Algunos modelos (p. ej. Claude 5) rechazan `temperature`: solo se envía si se define. */
  temperature?: number;
  maxTokens: number;
  /** undefined => cadena de credenciales por defecto del AWS SDK */
  credentials?: AwsCredentials;
}

function loadCredentials(): AwsCredentials | undefined {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId || !secretAccessKey) return undefined;
  return {
    accessKeyId,
    secretAccessKey,
    sessionToken: process.env.AWS_SESSION_TOKEN?.trim() || undefined,
  };
}

export const config: AppConfig = Object.freeze({
  modelId: required("MODEL_ID"),
  region: process.env.AWS_REGION?.trim() || "us-east-1",
  temperature: process.env.TEMPERATURE ? Number(process.env.TEMPERATURE) : undefined,
  maxTokens: Number(process.env.MAX_TOKENS ?? 1024),
  credentials: loadCredentials(),
});
