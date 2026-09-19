import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// Ensure dist/client exists after vite build (no-op helper for future hooks)
const clientDir = join(process.cwd(), "dist", "client");
if (!existsSync(clientDir)) {
  mkdirSync(clientDir, { recursive: true });
}
console.log("assets ready:", clientDir, existsSync(clientDir) ? readdirSync(clientDir).length : 0, "entries");
void copyFileSync;
void statSync;
