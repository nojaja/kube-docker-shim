import { buildPodManifest, parseRunArgs } from "../lib/run-translation.js";
import { runKubectl, startKubectlDetached } from "../lib/kubectl.js";

export function runCommand(argv, namespace) {
  const { opts, image, command } = parseRunArgs(argv);
  const manifest = buildPodManifest({ image, opts, command, namespace });

  const applyRes = runKubectl(["apply", "-f", "-"], {
    stdin: JSON.stringify(manifest),
    inherit: false
  });

  if (applyRes.status !== 0) {
    process.stderr.write(applyRes.stderr || "Failed to create pod\n");
    return applyRes.status || 1;
  }

  const podName = manifest.metadata.name;
  process.stdout.write(`${podName}\n`);

  if (opts.ports.length > 0) {
    const first = opts.ports[0];
    const pfArgs = [
      "-n",
      namespace,
      "port-forward",
      `pod/${podName}`,
      `${first.hostPort}:${first.containerPort}`
    ];

    if (opts.detach) {
      const pid = startKubectlDetached(pfArgs);
      process.stderr.write(`Started port-forward in background (pid: ${pid})\n`);
    } else {
      process.stderr.write(
        "Port-forward requested. Run this to attach manually:\n" +
          `kubectl -n ${namespace} port-forward pod/${podName} ${first.hostPort}:${first.containerPort}\n`
      );
    }
  }

  return 0;
}
