import { ChatBedrockConverse } from "@langchain/aws";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { createAgent, tool } from "langchain";
import { randomUUID } from "node:crypto";

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

// 1. Modelo (Bedrock Converse API)
const model = new ChatBedrockConverse({
  model: config.modelId,
  region: config.region,
  temperature: config.temperature,
  maxTokens: config.maxTokens,
  credentials: config.credentials, // undefined => cadena por defecto de AWS
});

// 2. Tools: JSON Schema plano en lugar de zod.
//    LangChain devuelve el resultado al modelo como string.
const consultarInventario = tool(
  (input) => JSON.stringify(checkInventory(input as CheckInventoryInput)),
  {
    name: consultarInventarioSpec.name,
    description: consultarInventarioSpec.description,
    schema: consultarInventarioSpec.inputSchema,
  },
);

const calcularTotal = tool(
  (input) => JSON.stringify(calculateTotal(input as CalculateTotalInput)),
  {
    name: calcularTotalSpec.name,
    description: calcularTotalSpec.description,
    schema: calcularTotalSpec.inputSchema,
  },
);

// 3. Agente. LangChain v1 corre sobre LangGraph: la memoria de la
//    conversación NO es implícita, necesita un checkpointer + thread_id.
const agent = createAgent({
  model,
  tools: [consultarInventario, calcularTotal],
  systemPrompt: SYSTEM_PROMPT,
  checkpointer: new MemorySaver(),
});

const threadId = randomUUID();

await runChat("LangChain", async (input) => {
  const result = await agent.invoke(
    { messages: [{ role: "user", content: input }] },
    { configurable: { thread_id: threadId } },
  );
  return result.messages.at(-1)?.text ?? "";
});
