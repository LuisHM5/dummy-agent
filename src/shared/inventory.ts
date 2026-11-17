/**
 * Lógica de negocio pura: no sabe nada de LangChain ni de Strands.
 * Ambos agentes envuelven exactamente estas funciones como tools.
 */

export interface Product {
  price: number;
  stock: number;
}

const CATALOG: Readonly<Record<string, Product>> = {
  laptop: { price: 15000, stock: 10 },
  mouse: { price: 350, stock: 25 },
  teclado: { price: 900, stock: 15 },
};

export type ToolResult = { [key: string]: string | number | boolean | string[] };

function findProduct(name: string): Product | undefined {
  return CATALOG[name.trim().toLowerCase()];
}

export interface CheckInventoryInput {
  producto: string;
}

export function checkInventory({ producto }: CheckInventoryInput): ToolResult {
  console.log(`  🔧 consultar_inventario(${producto})`);
  const item = findProduct(producto);
  if (!item) {
    return {
      error: "Producto no encontrado",
      disponibles: Object.keys(CATALOG),
    };
  }
  return { producto, precio_unitario: item.price, stock: item.stock, moneda: "MXN" };
}

export interface CalculateTotalInput {
  producto: string;
  cantidad: number;
  descuento_pct?: number;
}

/**
 * El precio se toma del catálogo, no del modelo: así el LLM no puede
 * "inventar" un precio, y el stock se valida aquí y no solo en el prompt.
 */
export function calculateTotal({
  producto,
  cantidad,
  descuento_pct = 0,
}: CalculateTotalInput): ToolResult {
  console.log(`  🔧 calcular_total(${producto}, ${cantidad}, ${descuento_pct}%)`);
  const item = findProduct(producto);
  if (!item) return { error: "Producto no encontrado" };
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return { error: "La cantidad debe ser un entero positivo" };
  }
  if (descuento_pct < 0 || descuento_pct > 100) {
    return { error: "El descuento debe estar entre 0 y 100" };
  }
  if (cantidad > item.stock) {
    return { error: "Stock insuficiente", solicitado: cantidad, disponible: item.stock };
  }

  const subtotal = item.price * cantidad;
  const descuento = round2(subtotal * (descuento_pct / 100));
  return {
    producto,
    precio_unitario: item.price,
    cantidad,
    subtotal,
    descuento_pct,
    descuento,
    total: round2(subtotal - descuento),
    moneda: "MXN",
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
