import { runKubectlStreaming } from "../lib/kubectl.js";

export function logsCommand(argv, namespace) {
  const pod = argv[0];
  if (!pod) {
    throw new Error("Pod name is required. Usage: kube-docker logs POD");
  }
  const res = runKubectlStreaming(["-n", namespace, "logs", pod]);
  return res.status || 0;
}
