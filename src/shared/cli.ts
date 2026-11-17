import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const EXIT_WORDS = new Set(["salir", "exit", "quit"]);

/**
 * Bucle de chat en consola, idéntico para ambos frameworks.
 * `ask` recibe el texto del usuario y devuelve la respuesta del agente.
 * Se itera el readline (en vez de rl.question) para no perder líneas
 * y terminar limpio con Ctrl+D o cuando stdin viene de un pipe.
 */
export async function runChat(label: string, ask: (input: string) => Promise<string>) {
  const rl = readline.createInterface({ input: stdin, output: stdout, prompt: "Tú: " });
  console.log(`💬 [${label}] Chat iniciado. Escribe "salir" para terminar.\n`);
  rl.prompt();

  try {
    for await (const line of rl) {
      const input = line.trim();
      if (EXIT_WORDS.has(input.toLowerCase())) break;

      if (input) {
        try {
          const answer = await ask(input);
          console.log(`\n🤖 ${answer}\n`);
        } catch (err) {
          console.error(`\n❌ Error: ${err instanceof Error ? err.message : String(err)}\n`);
        }
      }
      rl.prompt();
    }
  } finally {
    rl.close();
    console.log("\n👋 ¡Hasta luego!");
  }
}
