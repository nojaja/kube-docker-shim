import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePortMapping,
  parseVolumeMapping,
  parseRunArgs,
  buildPodManifest
} from "../../../../src/lib/run-translation.js";

test("parsePortMapping parses HOST:CONTAINER", () => {
  const p = parsePortMapping("3000:3000");
  assert.equal(p.hostPort, 3000);
  assert.equal(p.containerPort, 3000);
});

test("parseVolumeMapping allows PVC target", () => {
  const v = parseVolumeMapping("mypvc:/workspace:ro");
  assert.equal(v.pvcName, "mypvc");
  assert.equal(v.target, "/workspace");
  assert.equal(v.readOnly, true);
});

test("parseVolumeMapping rejects host bind mount in MVP", () => {
  assert.throws(() => parseVolumeMapping("/host/path:/workspace"));
});

test("parseRunArgs supports env, port, volume and image", () => {
  const { opts, image, command } = parseRunArgs([
    "--name",
    "demo",
    "-e",
    "A=B",
    "-p",
    "8080:80",
    "-v",
    "devpvc:/workspaces",
    "node:20",
    "sleep",
    "infinity"
  ]);

  assert.equal(opts.name, "demo");
  assert.equal(opts.env[0], "A=B");
  assert.equal(opts.ports[0].hostPort, 8080);
  assert.equal(opts.volumes[0].pvcName, "devpvc");
  assert.equal(image, "node:20");
  assert.deepEqual(command, ["sleep", "infinity"]);
});

test("buildPodManifest creates expected pod structure", () => {
  const manifest = buildPodManifest({
    image: "node:20",
    namespace: "dev-ns",
    command: ["sleep", "infinity"],
    opts: {
      env: ["A=B"],
      ports: [{ hostPort: 3000, containerPort: 3000 }],
      volumes: [{ pvcName: "devpvc", target: "/workspaces", readOnly: false }],
      interactive: true,
      tty: true,
      detach: false,
      name: "my-devpod"
    }
  });

  assert.equal(manifest.kind, "Pod");
  assert.equal(manifest.metadata.namespace, "dev-ns");
  assert.equal(manifest.metadata.name, "my-devpod");
  assert.equal(manifest.spec.containers[0].image, "node:20");
  assert.equal(manifest.spec.containers[0].stdin, true);
  assert.equal(manifest.spec.containers[0].tty, true);
  assert.equal(manifest.spec.volumes[0].persistentVolumeClaim.claimName, "devpvc");
});
