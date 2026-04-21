#!/usr/bin/env node
import { runCommand } from "./commands/run.js";
import { execCommand } from "./commands/exec.js";
import { logsCommand } from "./commands/logs.js";
import { portForwardCommand } from "./commands/port-forward.js";

function usage() {
  process.stderr.write(
    "kube-docker MVP\n" +
      "Usage:\n" +
      "  kube-docker run [OPTIONS] IMAGE [COMMAND...]\n" +
      "  kube-docker exec [-it] POD [COMMAND...]\n" +
      "  kube-docker logs POD\n" +
      "  kube-docker port-forward POD HOST_PORT:CONTAINER_PORT\n"
  );
}

function resolveNamespace(argv) {
  const args = [...argv];
  let namespace = process.env.KUBE_DOCKER_NAMESPACE || "";

  if (args[0] === "--namespace" || args[0] === "-n") {
    namespace = args[1] || "";
    args.splice(0, 2);
  }

  if (!namespace) {
    throw new Error("Namespace is required. Set KUBE_DOCKER_NAMESPACE or pass --namespace <ns>");
  }

  return { namespace, args };
}

function main() {
  try {
    const { namespace, args } = resolveNamespace(process.argv.slice(2));
    const cmd = args[0];
    const rest = args.slice(1);

    if (!cmd || cmd === "-h" || cmd === "--help") {
      usage();
      process.exit(0);
    }

    let code = 0;
    if (cmd === "run") {
      code = runCommand(rest, namespace);
    } else if (cmd === "exec") {
      code = execCommand(rest, namespace);
    } else if (cmd === "logs") {
      code = logsCommand(rest, namespace);
    } else if (cmd === "port-forward") {
      code = portForwardCommand(rest, namespace);
    } else {
      throw new Error(`Unsupported command in MVP: ${cmd}`);
    }

    process.exit(code);
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    usage();
    process.exit(2);
  }
}

main();
