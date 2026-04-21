export function normalizeDockerArgs(argv) {
  const args = [...argv];

  if (args.length === 0 || args[0] === "help" || args[0] === "-h" || args[0] === "--help") {
    return { kind: "help" };
  }

  if (args[0] === "version" || args[0] === "--version" || args[0] === "-v") {
    return { kind: "version" };
  }

  if (args[0] === "info") {
    return { kind: "info" };
  }

  // Support both `docker run` and `docker container run` style
  if (args[0] === "container" && args.length >= 2) {
    const sub = args[1];
    if (sub === "run" || sub === "exec" || sub === "logs") {
      return { kind: "kube-docker", cmd: sub, rest: args.slice(2) };
    }
  }

  if (args[0] === "run" || args[0] === "exec" || args[0] === "logs") {
    return { kind: "kube-docker", cmd: args[0], rest: args.slice(1) };
  }

  // Keep this command for manual parity with MVP feature set.
  if (args[0] === "port-forward") {
    return { kind: "kube-docker", cmd: "port-forward", rest: args.slice(1) };
  }

  return { kind: "unsupported", original: args[0] };
}

export function dockerLikeVersionText() {
  return [
    "Client: Docker Engine - Community",
    " Version:           25.0.0-kube-docker-shim",
    " API version:       1.44",
    " Experimental:      false"
  ].join("\n");
}

export function dockerLikeInfoText() {
  return [
    "Client:",
    " Context:    kube-docker-shim",
    " Debug Mode: false",
    "",
    "Server:",
    " Containers: 0",
    " Server Version: 25.0.0-kube-docker-shim",
    " Storage Driver: n/a (kubernetes pod backend)",
    " Kubernetes Namespace: set via KUBE_DOCKER_NAMESPACE"
  ].join("\n");
}
