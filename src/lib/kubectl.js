import { spawn, spawnSync } from "node:child_process";

export function runKubectl(args, options = {}) {
  const res = spawnSync("kubectl", args, {
    input: options.stdin,
    encoding: "utf8",
    stdio: options.inherit ? "inherit" : "pipe"
  });
  return res;
}

export function runKubectlStreaming(args) {
  return spawnSync("kubectl", args, { stdio: "inherit" });
}

export function startKubectlDetached(args) {
  const child = spawn("kubectl", args, {
    detached: true,
    stdio: "ignore"
  });
  child.unref();
  return child.pid;
}
