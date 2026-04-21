#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { normalizeDockerArgs, dockerLikeInfoText, dockerLikeVersionText } from "./docker-compat.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function usage() {
  process.stderr.write(
    "docker shim (kube-docker backend)\n" +
      "Supported:\n" +
      "  docker run ...\n" +
      "  docker exec ...\n" +
      "  docker logs ...\n" +
      "  docker container run|exec|logs ...\n" +
      "  docker version\n" +
      "  docker info\n"
  );
}

function main() {
  const normalized = normalizeDockerArgs(process.argv.slice(2));

  if (normalized.kind === "help") {
    usage();
    process.exit(0);
  }

  if (normalized.kind === "version") {
    process.stdout.write(`${dockerLikeVersionText()}\n`);
    process.exit(0);
  }

  if (normalized.kind === "info") {
    process.stdout.write(`${dockerLikeInfoText()}\n`);
    process.exit(0);
  }

  if (normalized.kind === "unsupported") {
    process.stderr.write(`Unsupported docker command in MVP shim: ${normalized.original}\n`);
    process.stderr.write("Supported commands: run, exec, logs, version, info\n");
    process.exit(125);
  }

  const cliPath = path.join(__dirname, "cli.js");
  const res = spawnSync(process.execPath, [cliPath, normalized.cmd, ...normalized.rest], {
    stdio: "inherit"
  });

  process.exit(res.status || 0);
}

main();
