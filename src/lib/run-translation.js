function sanitizeName(input) {
  return input.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "").slice(0, 63) || "kube-docker-pod";
}

export function parsePortMapping(value) {
  const parts = String(value).split(":");
  if (parts.length !== 2) {
    throw new Error(`Invalid port mapping: ${value}. Expected HOST:CONTAINER`);
  }
  const hostPort = Number(parts[0]);
  const containerPort = Number(parts[1]);
  if (!Number.isInteger(hostPort) || !Number.isInteger(containerPort)) {
    throw new Error(`Invalid port mapping: ${value}. Ports must be integers`);
  }
  return { hostPort, containerPort };
}

export function parseVolumeMapping(value) {
  const parts = String(value).split(":");
  if (parts.length < 2) {
    throw new Error(`Invalid volume mapping: ${value}. Expected PVC:TARGET[:ro|rw]`);
  }
  const source = parts[0];
  const target = parts[1];
  const mode = parts[2] || "rw";

  if (/^[A-Za-z]:\\|^\//.test(source)) {
    throw new Error(`Host bind mount is not supported in MVP: ${source}. Use PVC name`);
  }
  return { pvcName: source, target, readOnly: mode === "ro" };
}

export function parseRunArgs(argv) {
  const opts = {
    env: [],
    ports: [],
    volumes: [],
    interactive: false,
    tty: false,
    detach: false,
    name: ""
  };

  const args = [...argv];
  let i = 0;
  while (i < args.length) {
    const a = args[i];
    if (!a.startsWith("-")) {
      break;
    }

    if (a === "-i") {
      opts.interactive = true;
      i += 1;
      continue;
    }
    if (a === "-t") {
      opts.tty = true;
      i += 1;
      continue;
    }
    if (a === "-it" || a === "-ti") {
      opts.interactive = true;
      opts.tty = true;
      i += 1;
      continue;
    }
    if (a === "-d" || a === "--detach") {
      opts.detach = true;
      i += 1;
      continue;
    }
    if (a === "--name") {
      opts.name = args[i + 1] || "";
      i += 2;
      continue;
    }
    if (a === "-e" || a === "--env") {
      opts.env.push(args[i + 1] || "");
      i += 2;
      continue;
    }
    if (a.startsWith("--env=")) {
      opts.env.push(a.slice("--env=".length));
      i += 1;
      continue;
    }
    if (a === "-p" || a === "--publish") {
      opts.ports.push(parsePortMapping(args[i + 1] || ""));
      i += 2;
      continue;
    }
    if (a.startsWith("--publish=")) {
      opts.ports.push(parsePortMapping(a.slice("--publish=".length)));
      i += 1;
      continue;
    }
    if (a === "-v" || a === "--volume") {
      opts.volumes.push(parseVolumeMapping(args[i + 1] || ""));
      i += 2;
      continue;
    }
    if (a.startsWith("--volume=")) {
      opts.volumes.push(parseVolumeMapping(a.slice("--volume=".length)));
      i += 1;
      continue;
    }

    throw new Error(`Unsupported run option in MVP: ${a}`);
  }

  const image = args[i];
  if (!image) {
    throw new Error("Image is required. Usage: kube-docker run [OPTIONS] IMAGE [COMMAND...]");
  }
  const command = args.slice(i + 1);

  return { opts, image, command };
}

export function buildPodManifest({ image, opts, command, namespace }) {
  const podName = sanitizeName(opts.name || `kube-docker-${image.split("/").pop().replace(/[:@]/g, "-")}`);

  const env = opts.env
    .filter(Boolean)
    .map((entry) => {
      const idx = entry.indexOf("=");
      if (idx === -1) {
        return { name: entry, value: "" };
      }
      return { name: entry.slice(0, idx), value: entry.slice(idx + 1) };
    });

  const ports = opts.ports.map((p) => ({ containerPort: p.containerPort }));

  const volumes = opts.volumes.map((v, idx) => ({
    name: `vol-${idx}`,
    persistentVolumeClaim: { claimName: v.pvcName }
  }));

  const volumeMounts = opts.volumes.map((v, idx) => ({
    name: `vol-${idx}`,
    mountPath: v.target,
    readOnly: v.readOnly
  }));

  const container = {
    name: "main",
    image,
    env,
    ports,
    volumeMounts,
    stdin: opts.interactive,
    tty: opts.tty
  };

  if (command.length > 0) {
    container.command = command;
  }

  return {
    apiVersion: "v1",
    kind: "Pod",
    metadata: {
      name: podName,
      namespace,
      labels: {
        app: "kube-docker-shim",
        "kube-docker.dev/mvp": "true"
      }
    },
    spec: {
      restartPolicy: "Never",
      containers: [container],
      volumes
    }
  };
}
