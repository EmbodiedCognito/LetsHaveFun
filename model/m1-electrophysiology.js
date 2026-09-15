/**
 * Browser-portable M1 ipRGC soma model.
 *
 * Equations and fitted parameter values are transcribed from ModelDB 267026
 * (Stinchcombe et al., 2021). The upstream implementation is a MATLAB,
 * single-compartment model. This module deliberately does not distribute its
 * conductances over the independently sourced morphology.
 */

export const M1_PARAMETERS = Object.freeze({
  reversalMV: Object.freeze({ calcium: 33.5, potassium: -50, leak: -14.5, sodium: 45 }),
  conductance: Object.freeze({ calcium: 22.47, potassium: 4.84, leak: 0.031, sodium: 79.18 }),
  capacitance: 1,
});

const exp = Math.exp;

export function steadyState(voltageMV) {
  return {
    m: 1 / (1 + exp(-0.254 * voltageMV - 4.4704)),
    h: 1 / (1 + exp(0.364 * voltageMV + 11.2727)),
    n: Math.pow(1 / (1 + exp((-2 / 17) * voltageMV + 14 / 17)), 0.25),
    r: 1 / (1 + exp(-0.267 * voltageMV - 3.3333)),
    f: 1 / (1 + exp((2 / 65) * voltageMV + 4)),
  };
}

export function timeConstantsMs(voltageMV) {
  return {
    m: exp((-1 / 80) * voltageMV - 143 / 80 + Math.log(5 / 21)),
    h: 0.12 + exp(-0.28 * voltageMV + Math.log(0.00561)),
    n: exp((-2 / 68) * voltageMV + 67 / 68 + Math.log(5 / 21)),
    r: 0.738,
    f: exp((-1 / 110) * voltageMV + Math.log(1.79)),
  };
}

export function membraneCurrents(state, currentPA = 0) {
  const { voltageMV: V, m, h, n, r, f } = state;
  const { reversalMV: E, conductance: g } = M1_PARAMETERS;

  return {
    sodium: g.sodium * m ** 3 * h * (E.sodium - V),
    potassium: g.potassium * n ** 4 * (E.potassium - V),
    calcium: g.calcium * r * f * (E.calcium - V),
    leak: g.leak * (E.leak - V),
    applied: currentPA / 1000,
  };
}

export function derivatives(state, currentPA) {
  const infinity = steadyState(state.voltageMV);
  const tau = timeConstantsMs(state.voltageMV);
  const currents = membraneCurrents(state, currentPA);

  return {
    voltageMV:
      (currents.sodium + currents.potassium + currents.calcium + currents.leak + currents.applied) /
      M1_PARAMETERS.capacitance,
    m: (infinity.m - state.m) / tau.m,
    h: (infinity.h - state.h) / tau.h,
    n: (infinity.n - state.n) / tau.n,
    r: (infinity.r - state.r) / tau.r,
    f: (infinity.f - state.f) / tau.f,
  };
}

function addScaled(state, delta, scale) {
  return {
    voltageMV: state.voltageMV + delta.voltageMV * scale,
    m: state.m + delta.m * scale,
    h: state.h + delta.h * scale,
    n: state.n + delta.n * scale,
    r: state.r + delta.r * scale,
    f: state.f + delta.f * scale,
  };
}

export function rk4Step(state, currentPA, dtMs) {
  const k1 = derivatives(state, currentPA);
  const k2 = derivatives(addScaled(state, k1, dtMs / 2), currentPA);
  const k3 = derivatives(addScaled(state, k2, dtMs / 2), currentPA);
  const k4 = derivatives(addScaled(state, k3, dtMs), currentPA);

  const next = {};
  for (const key of Object.keys(state)) {
    next[key] = state[key] + (dtMs / 6) * (k1[key] + 2 * k2[key] + 2 * k3[key] + k4[key]);
  }
  return next;
}

export function initialState(initialVoltageMV = -30) {
  return { voltageMV: initialVoltageMV, ...steadyState(initialVoltageMV) };
}

export function simulateM1({
  currentPA = 100,
  durationMs = 500,
  dtMs = 0.01,
  initialVoltageMV = -30,
  sampleEveryMs = 0.25,
} = {}) {
  if (!(durationMs > 0) || !(dtMs > 0) || !(sampleEveryMs >= dtMs)) {
    throw new RangeError("durationMs and dtMs must be positive; sampleEveryMs must be at least dtMs");
  }

  const stepCount = Math.round(durationMs / dtMs);
  const sampleStride = Math.max(1, Math.round(sampleEveryMs / dtMs));
  const timeMs = [];
  const voltageMV = [];
  const gates = { m: [], h: [], n: [], r: [], f: [] };
  const currents = { sodium: [], potassium: [], calcium: [], leak: [], applied: [] };
  let state = initialState(initialVoltageMV);
  let previousVoltage = state.voltageMV;
  let spikeCount = 0;

  for (let step = 0; step <= stepCount; step += 1) {
    if (step % sampleStride === 0 || step === stepCount) {
      const currentState = membraneCurrents(state, currentPA);
      timeMs.push(step * dtMs);
      voltageMV.push(state.voltageMV);
      for (const gate of Object.keys(gates)) gates[gate].push(state[gate]);
      for (const current of Object.keys(currents)) currents[current].push(currentState[current]);
    }

    if (step === stepCount) break;
    state = rk4Step(state, currentPA, dtMs);
    if (!Object.values(state).every(Number.isFinite)) {
      throw new Error(`Integration diverged at ${(step * dtMs).toFixed(3)} ms; reduce dtMs`);
    }
    if (previousVoltage < 0 && state.voltageMV >= 0) spikeCount += 1;
    previousVoltage = state.voltageMV;
  }

  return {
    protocol: { currentPA, durationMs, dtMs, initialVoltageMV, sampleEveryMs },
    timeMs,
    voltageMV,
    gates,
    currents,
    summary: {
      spikeCount,
      minimumVoltageMV: Math.min(...voltageMV),
      maximumVoltageMV: Math.max(...voltageMV),
      finalVoltageMV: voltageMV.at(-1),
    },
  };
}
