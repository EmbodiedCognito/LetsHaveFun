import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { initialState, simulateM1, steadyState, timeConstantsMs } from "../model/m1-electrophysiology.js";
import { parseSWC, swcSummary } from "../model/swc.js";

test("M1 gates initialise at their voltage-dependent steady state", () => {
  const state = initialState(-30);
  assert.deepEqual(
    { m: state.m, h: state.h, n: state.n, r: state.r, f: state.f },
    steadyState(-30),
  );
});

test("M1 time constants are finite and positive across a physiological range", () => {
  for (let voltageMV = -100; voltageMV <= 60; voltageMV += 5) {
    for (const value of Object.values(timeConstantsMs(voltageMV))) {
      assert.ok(Number.isFinite(value));
      assert.ok(value > 0);
    }
  }
});

test("source protocol produces a finite, spiking trace", () => {
  const result = simulateM1({ currentPA: 100, durationMs: 500, dtMs: 0.01 });
  assert.equal(result.timeMs.at(-1), 500);
  assert.ok(result.voltageMV.every(Number.isFinite));
  assert.equal(result.summary.spikeCount, 10);
  assert.ok(Math.abs(result.summary.finalVoltageMV - -29.013361) < 0.001);
  assert.ok(result.summary.maximumVoltageMV > 20);
});

test("selected SWC contains soma and dendrites but no axon", async () => {
  const text = await readFile(new URL("../data/source/neuromorpho/070320Ac10.CNG.swc", import.meta.url), "utf8");
  const morphology = parseSWC(text);
  const summary = swcSummary(morphology);
  assert.equal(summary.nodes, 3758);
  assert.equal(summary.somaNodes, 3);
  assert.equal(summary.axonNodes, 0);
  assert.ok(summary.dendriteNodes > 3700);
  assert.equal(summary.branchPoints, 35);
  assert.ok(morphology.nodes.filter((node) => node.type !== 1).every((node) => node.radius === 0.125));
  assert.equal(
    createHash("sha256").update(text).digest("hex"),
    "22235986d64b86054a75a2263feb311a2cff2455c3ced248ef1156b129107a78",
  );
});
