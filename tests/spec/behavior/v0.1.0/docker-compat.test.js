import test from "node:test";
import assert from "node:assert/strict";
import { normalizeDockerArgs } from "../../../../src/docker-compat.js";

test("normalize docker run", () => {
  const n = normalizeDockerArgs(["run", "node:20"]);
  assert.equal(n.kind, "kube-docker");
  assert.equal(n.cmd, "run");
  assert.deepEqual(n.rest, ["node:20"]);
});

test("normalize docker container exec", () => {
  const n = normalizeDockerArgs(["container", "exec", "-it", "pod-a", "sh"]);
  assert.equal(n.kind, "kube-docker");
  assert.equal(n.cmd, "exec");
  assert.deepEqual(n.rest, ["-it", "pod-a", "sh"]);
});

test("version flag route", () => {
  const n = normalizeDockerArgs(["--version"]);
  assert.equal(n.kind, "version");
});

test("unsupported command", () => {
  const n = normalizeDockerArgs(["build", "."]);
  assert.equal(n.kind, "unsupported");
});
