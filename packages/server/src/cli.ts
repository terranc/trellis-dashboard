import { spawn } from "node:child_process";
import { createServer, type Server } from "node:http";
import { createApp } from "./index.js";
import { resolveTrellisProject } from "./lib/trellis.js";

interface CliOptions {
  port: number;
  open: boolean;
}

const DEFAULT_PORT = 3777;
const MAX_PORT_ATTEMPTS = 20;

export async function main(
  argv = process.argv.slice(2),
  cwd = process.cwd(),
): Promise<void> {
  const options = parseArgs(argv);
  const project = resolveTrellisProject(cwd);
  const app = createApp({ project });
  const { server, port } = await listenWithFallback(app, options.port);
  const url = `http://localhost:${port}`;

  console.log(`Trellis Dashboard: ${project.projectName} -> ${url}`);
  console.log(`Project root: ${project.root}`);

  if (options.open) {
    openBrowser(url);
  }

  process.on("SIGINT", () => {
    server.close(() => process.exit(0));
  });
}

export function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { port: DEFAULT_PORT, open: true };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--no-open") {
      options.open = false;
    } else if (arg === "--port") {
      const next = argv[index + 1];
      const parsed = Number.parseInt(next ?? "", 10);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error("--port requires a positive integer.");
      }
      options.port = parsed;
      index += 1;
    }
  }

  return options;
}

export async function listenWithFallback(
  app: ReturnType<typeof createApp>,
  startPort: number,
): Promise<{ server: Server; port: number }> {
  for (let offset = 0; offset < MAX_PORT_ATTEMPTS; offset += 1) {
    const port = startPort + offset;
    const server = createServer(app);
    const result = await tryListen(server, port);

    if (result === "listening") {
      return { server, port };
    }
  }

  throw new Error(
    `No available port found from ${startPort} to ${startPort + MAX_PORT_ATTEMPTS - 1}.`,
  );
}

function tryListen(
  server: Server,
  port: number,
): Promise<"listening" | "unavailable"> {
  return new Promise((resolve, reject) => {
    server.once("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        resolve("unavailable");
      } else {
        reject(error);
      }
    });

    server.listen(port, "127.0.0.1", () => resolve("listening"));
  });
}

function openBrowser(url: string): void {
  const commands: Record<NodeJS.Platform, string[]> = {
    darwin: ["open", url],
    win32: ["cmd", "/c", "start", "", url],
    linux: ["xdg-open", url],
    aix: ["xdg-open", url],
    android: ["xdg-open", url],
    freebsd: ["xdg-open", url],
    haiku: ["xdg-open", url],
    openbsd: ["xdg-open", url],
    sunos: ["xdg-open", url],
    cygwin: ["cmd", "/c", "start", "", url],
    netbsd: ["xdg-open", url],
  };
  const [command, ...args] = commands[process.platform] ?? commands.linux;
  const child = spawn(command, args, { detached: true, stdio: "ignore" });
  child.unref();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
