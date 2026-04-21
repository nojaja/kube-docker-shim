import { runKubectlStreaming } from "../lib/kubectl.js";

export function portForwardCommand(argv, namespace) {
  const pod = argv[0];
  const mapping = argv[1];
  if (!pod || !mapping) {
    throw new Error("Usage: kube-docker port-forward POD HOST_PORT:CONTAINER_PORT");
  }
  const res = runKubectlStreaming(["-n", namespace, "port-forward", `pod/${pod}`, mapping]);
  return res.status || 0;
}
