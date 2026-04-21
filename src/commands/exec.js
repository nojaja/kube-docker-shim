import { runKubectlStreaming } from "../lib/kubectl.js";

export function execCommand(argv, namespace) {
  const args = [...argv];
  let tty = false;
  let stdin = false;

  while (args.length > 0 && args[0].startsWith("-")) {
    const flag = args.shift();
    if (flag === "-it" || flag === "-ti") {
      tty = true;
      stdin = true;
      continue;
    }
    if (flag === "-i") {
      stdin = true;
      continue;
    }
    if (flag === "-t") {
      tty = true;
      continue;
    }
    throw new Error(`Unsupported exec option in MVP: ${flag}`);
  }

  const pod = args.shift();
  if (!pod) {
    throw new Error("Pod name is required. Usage: kube-docker exec [-it] POD COMMAND...");
  }

  const cmd = args.length > 0 ? args : ["sh"];
  const kubectlArgs = ["-n", namespace, "exec"];
  if (stdin) kubectlArgs.push("-i");
  if (tty) kubectlArgs.push("-t");
  kubectlArgs.push(pod, "--", ...cmd);

  const res = runKubectlStreaming(kubectlArgs);
  return res.status || 0;
}
