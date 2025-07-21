import { describe, it, snapshot } from "node:test";
import path from "node:path";
import safe from "safe-regex";

// snapshot dir path
snapshot.setResolveSnapshotPath((testPath) => {
  const _dir = path.dirname(testPath as string);
  const _baseName = path.basename(testPath as string);
  return path.join(_dir, "__snapshots__", `${_baseName}.snapshot`);
});

describe("State A Block Test",()=>{})
describe("State A Attributes Test",()=>{})
describe("Block Level RegExp Safe Tests", () => {
  it("First Level Blocks", (t) => {
    const regexp =
      /^(b[cq]|notextile|pre|h[1-6]|p|###)([^.]*)(\.\.|\.)?\s*(.*)$/m;
    const result = safe(regexp);
    const excepted = true;
    t.assert.equal(result, excepted);
    t.assert.snapshot({ regexp, excepted, result });
  });
  it("Links Reference", (t) => {
    const regexp = /^\[([^\]]+)\]((?:https?:\/\/|\/|\.\/)\S+)(?:\s*\n|$)/;
    const result = safe(regexp);
    const excepted = true;
    t.assert.equal(result, excepted);
    t.assert.snapshot({ regexp, excepted, result });
  });
});
