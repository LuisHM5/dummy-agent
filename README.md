# dummy-agent: LangChain vs Strands

El propósito de este proyecto es **comparar LangChain y Strands Agents** (TypeScript) implementando
el **mismo agente** con ambos frameworks, usando **AWS Bedrock** como provider.

El agente es un vendedor de una tienda mexicana con dos tools:

- `consultar_inventario`: precio unitario y stock de un producto.
- `calcular_total`: total de una compra (precio del catálogo, valida stock, descuento opcional en %).

Todo lo que no depende del framework vive en `src/shared/`, así que cada implementación contiene
**solo el código propio de su framework** y se pueden comparar lado a lado.

## Estructura

```
src/
  shared/              # común a ambos frameworks
    config.ts          # carga y valida el .env (modelo, región, credenciales)
    inventory.ts       # lógica de negocio pura
    tool-specs.ts      # tools en JSON Schema plano (sin zod)
    prompt.ts          # system prompt
    cli.ts             # bucle de chat en consola
  langchain/index.ts   # agente con LangChain v1
  strands/index.ts     # agente con Strands Agents
legacy/                # primera versión con LangChain + zod (solo referencia, no se compila)
```

## Requisitos

- Node.js 22+ y pnpm
- Acceso a un modelo en AWS Bedrock

## Configuración

```bash
pnpm install
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `MODEL_ID` | ID del modelo o inference profile de Bedrock (obligatorio) |
| `AWS_REGION` | Región de Bedrock (por defecto `us-east-1`) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_SESSION_TOKEN` | Opcionales. Si no se definen, se usa la cadena de credenciales por defecto de AWS (`AWS_PROFILE`, `~/.aws`, SSO, rol de IAM) |
| `TEMPERATURE` | Opcional. Solo se envía si se define (algunos modelos la rechazan) |
| `MAX_TOKENS` | Opcional (por defecto 1024) |

## Uso

```bash
pnpm langchain        # chat con el agente de LangChain
pnpm strands          # chat con el agente de Strands

pnpm dev:langchain    # con recarga automática
pnpm dev:strands

pnpm typecheck
pnpm build            # compila a dist/
```

Escribe `salir`, `exit` o `quit` (o Ctrl+D) para terminar.

## Comparación

| | LangChain v1 | Strands Agents |
|---|---|---|
| Paquetes | `langchain`, `@langchain/aws`, `@langchain/langgraph-checkpoint` | `@strands-agents/sdk` |
| Modelo Bedrock | `ChatBedrockConverse` (paquete aparte) | `BedrockModel` (incluido en el SDK) |
| Definir tools | `tool(fn, { name, description, schema })` | `tool({ name, description, inputSchema, callback })` |
| Resultado de una tool | Debe ser **string** (`JSON.stringify`) | Acepta **objetos JSON** directamente |
| Memoria de conversación | Explícita: `checkpointer` (`MemorySaver`) + `thread_id` en cada llamada | Implícita: el historial vive en la instancia `agent` |
| Invocar | `agent.invoke({ messages }, { configurable: { thread_id } })` | `agent.invoke(texto)` |
| Leer la respuesta | `result.messages.at(-1)?.text` | `result.toString()` |
| Motor interno | LangGraph | Loop de agente propio |
| Líneas del agente | ~63 | ~49 |

Ambos frameworks aceptan el **mismo JSON Schema** para las tools (`src/shared/tool-specs.ts`),
que es el formato nativo de la API Converse de Bedrock, por lo que no se usa zod.
