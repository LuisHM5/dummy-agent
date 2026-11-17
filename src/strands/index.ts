import { Agent, tool } from "@strands-agents/sdk";
import { BedrockModel } from "@strands-agents/sdk/models/bedrock";

import { runChat } from "../shared/cli.js";
import { config } from "../shared/config.js";
import {
  calculateTotal,
  checkInventory,
  type CalculateTotalInput,
  type CheckInventoryInput,
} from "../shared/inventory.js";
import { SYSTEM_PROMPT } from "../shared/prompt.js";
import { calcularTotalSpec, consultarInventarioSpec } from "../shared/tool-specs.js";

// 1. Modelo (Bedrock es el provider nativo de Strands)
const model = new BedrockModel({
  modelId: config.modelId,
  region: config.region,
  temperature: config.temperature,
  maxTokens: config.maxTokens,
  clientConfig: config.credentials ? { credentials: config.credentials } : undefined,
});

// 2. Tools: misma spec JSON Schema. Strands acepta objetos JSON como
//    resultado (no hace falta JSON.stringify) y convierte excepciones
//    en resultados de error para el modelo.
const consultarInventario = tool({
  ...consultarInventarioSpec,
  callback: (input) => checkInventory(input as CheckInventoryInput) as never,
});

const calcularTotal = tool({
  ...calcularTotalSpec,
  callback: (input) => calculateTotal(input as CalculateTotalInput) as never,
});

// 3. Agente. El historial de la conversación vive dentro de la instancia
//    `agent` (agent.messages), así que la memoria es implícita.
const agent = new Agent({
  model,
  tools: [consultarInventario, calcularTotal],
  systemPrompt: SYSTEM_PROMPT,
  printer: false, // sin esto Strands imprime el streaming en stdout
});

await runChat("Strands", async (input) => {
  const result = await agent.invoke(input);
  return result.toString();
});
