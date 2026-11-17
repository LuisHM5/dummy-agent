/**
 * Definición de las tools en JSON Schema plano (sin zod).
 * Es el formato nativo de Bedrock Converse (`toolSpec.inputSchema.json`)
 * y tanto LangChain como Strands lo aceptan directamente.
 */

export interface JsonObjectSchema {
  type: "object";
  properties: Record<string, Record<string, unknown>>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ToolSpec {
  name: string;
  description: string;
  inputSchema: JsonObjectSchema;
}

export const consultarInventarioSpec: ToolSpec = {
  name: "consultar_inventario",
  description: "Consulta el precio unitario (MXN) y el stock disponible de un producto.",
  inputSchema: {
    type: "object",
    properties: {
      producto: { type: "string", description: "Nombre del producto, p. ej. 'laptop'" },
    },
    required: ["producto"],
    additionalProperties: false,
  },
};

export const calcularTotalSpec: ToolSpec = {
  name: "calcular_total",
  description:
    "Calcula el total de una compra usando el precio del catálogo. Valida stock y aplica un descuento opcional.",
  inputSchema: {
    type: "object",
    properties: {
      producto: { type: "string", description: "Nombre del producto" },
      cantidad: { type: "integer", minimum: 1, description: "Unidades a comprar" },
      descuento_pct: {
        type: "number",
        minimum: 0,
        maximum: 100,
        description: "Descuento en porcentaje (0-100). Omitir si no hay descuento.",
      },
    },
    required: ["producto", "cantidad"],
    additionalProperties: false,
  },
};
