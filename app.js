const layers = [
  {
    title: "Connectome node",
    description: "The cell is replaced by a point with membrane voltage and synaptic conductance. Morphology, photochemistry and intracellular history are folded into fitted parameters and input.",
    state: "V(t), g(t)",
    evidence: "model specification",
    evidenceClass: "evidence-model",
    boundary: "Cell → node",
    question: "Is the computation in the neurone, or in the modeller’s decision to ignore everything below the node?",
    input: "fitted current",
    hiddenLabel: "None represented",
    hiddenNote: "outside the model",
    traceText: "At this resolution, the fitted point model is the entire causal story available to the observer.",
    runResult: "Output recorded"
  },
  {
    title: "Morphoelectric cell",
    description: "Soma, axon and branching dendrites return. Voltage, channel density and synaptic impact can now vary by location; a ‘single’ membrane voltage becomes a field over changing geometry.",
    state: "V(x,t), channels, cable geometry",
    evidence: "M1 / ipRGC",
    evidenceClass: "evidence-cell",
    boundary: "Node → excitable arbor",
    question: "If different dendritic regions transform input differently, what licensed the point model to call the whole cell one unit?",
    input: "distributed current",
    hiddenLabel: "Distributed voltage",
    hiddenNote: "collapsed into V(t) below this cut",
    traceText: "The terminal spike trace can still match after spatial membrane dynamics are compressed into effective parameters.",
    runResult: "Spatial state active"
  },
  {
    title: "Intrinsic photoreception",
    description: "This is not merely a neuron receiving visual input. Melanopsin makes the ipRGC itself a photoreceptor; light initiates a cell-intrinsic Gq/PLC pathway and M1 signalling through TRPC6/7 channels.",
    state: "photons, melanopsin, photocurrent",
    evidence: "M1 / ipRGC",
    evidenceClass: "evidence-cell",
    boundary: "Input current → photon capture",
    question: "When the input apparatus is distributed through the cell itself, where does ‘pre-processing’ end and neuronal computation begin?",
    input: "photons at membrane",
    hiddenLabel: "Melanopsin activation",
    hiddenNote: "slow state persists after the pulse",
    traceText: "A point model can reproduce the spike train by fitting an injected current, while erasing that the cell sensed light itself.",
    runResult: "Intrinsic photocurrent"
  },
  {
    title: "Biochemical state",
    description: "Receptor activation opens a changing intracellular cascade: G-protein and PLC signalling, calcium, channel modulation, adaptation and trafficking. The state has multiple timescales and remembers prior illumination.",
    state: "Gq/PLC, Ca²⁺, adaptation, trafficking",
    evidence: "M1 / ipRGC",
    evidenceClass: "evidence-cell",
    boundary: "Current → molecular cascade",
    question: "If molecular state changes the meaning of the next photon minutes later, is memory confined to synaptic weights?",
    input: "photon history",
    hiddenLabel: "Calcium + adaptation",
    hiddenNote: "history-dependent internal state",
    traceText: "Matching spikes at the axon does not identify the biochemical history that made the next response possible.",
    runResult: "Cascade evolving"
  },
  {
    title: "Intracellular traffic",
    description: "Microtubules, mitochondria, vesicles and local RNA are mobile constraints, not inert scaffolding. Their positions alter energy supply, receptor availability and the future electrical response.",
    state: "cytoskeleton, organelles, cargo transport",
    evidence: "neurone-general",
    evidenceClass: "evidence-general",
    boundary: "Biochemistry → material logistics",
    question: "Does computation exclude the transport system that continually rebuilds the apparatus doing the alleged computation?",
    input: "photons + material state",
    hiddenLabel: "Organelle + cargo state",
    hiddenNote: "borrowed from neurone-general evidence",
    traceText: "This layer is empirically real in neurones but not jointly measured and parameterised for the displayed M1 cell.",
    runResult: "Cargo state exposed"
  },
  {
    title: "Intracellular light response",
    description: "Light sensitivity is not exhausted by membrane opsins. Endogenous chromophores, including mitochondrial and redox-linked absorbers, can change intracellular state under illumination. Their intact-retina contribution here is unresolved.",
    state: "chromophores, redox state, metabolism",
    evidence: "frontier",
    evidenceClass: "evidence-frontier",
    boundary: "Photoreceptor → photosensitive cell",
    question: "If illumination can perturb intracellular metabolism directly, which light effects are signal, context, damage or computation?",
    input: "wavelength × intracellular state",
    hiddenLabel: "Chromophore / redox response",
    hiddenNote: "real mechanism; M1 effect unquantified",
    traceText: "The layer is included explicitly and conservatively: endogenous intracellular photosensitivity is real; its physiological weight in one intact M1 ipRGC is not yet known.",
    runResult: "Optical state unresolved"
  },
  {
    title: "Living tissue",
    description: "The cell remains coupled to glia, extracellular ions, blood flow, metabolism, neighbouring retinal circuits and developmental history. The boundary now encloses a tissue process, not an isolated object.",
    state: "cell + extracellular + glial + vascular fields",
    evidence: "retinal context",
    evidenceClass: "evidence-retina",
    boundary: "Isolated cell → living retina",
    question: "At what boundary does adding causally relevant context stop revealing the system and start changing the question?",
    input: "light within a living retina",
    hiddenLabel: "Coupled tissue state",
    hiddenNote: "no simultaneous complete record",
    traceText: "No public dataset closes this state vector. The unmeasured coupling is not proof of mysticism; it is a limit on claims of computational completeness.",
    runResult: "Tissue coupling visible"
  }
];

const body = document.body;
const buttons = [...document.querySelectorAll(".layer-button")];
const layerItems = [...document.querySelectorAll(".layer-item")];
const exactItems = [...document.querySelectorAll(".exact-layer")];
const layerIndex = document.querySelector("#layer-index");
const readingTitle = document.querySelector("#reading-title");
const layerDescription = document.querySelector("#layer-description");
const representedState = document.querySelector("#represented-state");
const evidenceStatus = document.querySelector("#evidence-status");
const boundaryMove = document.querySelector("#boundary-move");
const layerQuestion = document.querySelector("#layer-question");
const inputLabel = document.querySelector("#input-label");
const traceExplanation = document.querySelector("#trace-explanation");
const hiddenTraceLabel = document.querySelector("#hidden-trace-label");
const hiddenStateNote = document.querySelector("#hidden-state-note");
const hiddenStateCard = document.querySelector(".hidden-state-card");
const lightInput = document.querySelector("#light-level");
const lightOutput = document.querySelector("#light-output");
const runButton = document.querySelector("#run-trial");
const trialStatus = document.querySelector("#trial-status");
const outputTrace = document.querySelector("#output-trace");
const hiddenStateTrace = document.querySelector("#hidden-state-trace");

let activeLayer = 0;
let trialTimer;

function samplePath(pointCount, valueAt) {
  const left = 18;
  const right = 662;
  const baseline = 132;
  const commands = [];

  for (let i = 0; i < pointCount; i += 1) {
    const t = i / (pointCount - 1);
    const x = left + t * (right - left);
    const normalised = Math.max(0, Math.min(1, valueAt(t)));
    const y = baseline - normalised * 102;
    commands.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return commands.join(" ");
}

function spikeShape(t, centre, width = 0.012) {
  const distance = Math.abs(t - centre);
  if (distance > width) return 0;
  const phase = distance / width;
  return Math.pow(1 - phase, 2);
}

function renderTraces() {
  const flux = Number(lightInput.value) / 100;
  const count = Math.max(1, Math.round(1 + flux * 5));
  const first = 0.25;
  const interval = count > 1 ? 0.54 / (count - 1) : 0;
  const spikes = Array.from({ length: count }, (_, index) => first + index * interval);

  outputTrace.setAttribute("d", samplePath(360, (t) => {
    const stimulusRise = t > 0.18 && t < 0.88 ? .055 + flux * .035 : .02;
    const ripple = Math.sin(t * 36) * .012;
    const spike = Math.max(...spikes.map((centre) => spikeShape(t, centre)));
    return stimulusRise + ripple + spike * .94;
  }));

  if (activeLayer === 0) {
    hiddenStateTrace.setAttribute("d", "M18,132 L662,132");
    return;
  }

  hiddenStateTrace.setAttribute("d", samplePath(260, (t) => {
    if (activeLayer === 1) {
      const wave = Math.exp(-Math.pow((t - .46) / .18, 2));
      return .08 + .55 * flux * wave + .07 * Math.sin(t * 30);
    }
    if (activeLayer === 2) {
      const onset = t < .2 ? 0 : (1 - Math.exp(-(t - .2) * 9));
      const decay = t < .74 ? 1 : Math.exp(-(t - .74) * 2.1);
      return .05 + onset * decay * (.38 + .5 * flux);
    }
    if (activeLayer === 3) {
      const envelope = t < .18 ? 0 : Math.exp(-(t - .38) * .85);
      return .08 + Math.max(0, envelope) * (.26 + .24 * Math.sin((t - .18) * 38)) * flux;
    }
    if (activeLayer === 4) {
      return .12 + .11 * Math.sin(t * 13) + .36 * t + .12 * Math.sin(t * 4.5);
    }
    if (activeLayer === 5) {
      const rise = t < .2 ? 0 : 1 - Math.exp(-(t - .2) * 4.3);
      return .1 + rise * flux * .58 + .045 * Math.sin(t * 21);
    }
    const slowField = .16 + .28 * Math.sin(t * 5.2 - .7) + .32 * t;
    return slowField + .06 * Math.sin(t * 33);
  }));
}

function setLayer(nextLayer, announce = true) {
  activeLayer = Math.max(0, Math.min(layers.length - 1, nextLayer));
  const layer = layers[activeLayer];
  body.dataset.layer = String(activeLayer);

  buttons.forEach((button, index) => {
    const isActive = index === activeLayer;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  layerItems.forEach((item) => {
    item.classList.toggle("is-visible", Number(item.dataset.minLayer) <= activeLayer);
  });

  exactItems.forEach((item) => {
    item.classList.toggle("is-visible", Number(item.dataset.exactLayer) === activeLayer);
  });

  layerIndex.textContent = String(activeLayer).padStart(2, "0");
  readingTitle.textContent = layer.title;
  layerDescription.textContent = layer.description;
  representedState.textContent = layer.state;
  evidenceStatus.textContent = layer.evidence;
  evidenceStatus.className = `evidence-badge ${layer.evidenceClass}`;
  boundaryMove.textContent = layer.boundary;
  layerQuestion.textContent = layer.question;
  inputLabel.textContent = layer.input;
  traceExplanation.textContent = layer.traceText;
  hiddenTraceLabel.textContent = layer.hiddenLabel;
  hiddenStateNote.textContent = layer.hiddenNote;
  hiddenStateCard.classList.toggle("is-empty", activeLayer === 0);

  if (announce) trialStatus.textContent = `Layer ${activeLayer} selected`;
  renderTraces();
}

function runTrial() {
  window.clearTimeout(trialTimer);
  body.classList.remove("is-running");
  void body.offsetWidth;
  body.classList.add("is-running");
  runButton.disabled = true;
  trialStatus.textContent = "Pulse in progress";

  trialTimer = window.setTimeout(() => {
    body.classList.remove("is-running");
    runButton.disabled = false;
    trialStatus.textContent = layers[activeLayer].runResult;
  }, 2350);
}

buttons.forEach((button, index) => {
  button.addEventListener("click", () => setLayer(index));
  button.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + direction + buttons.length) % buttons.length;
    buttons[nextIndex].focus();
    setLayer(nextIndex);
  });
});

lightInput.addEventListener("input", () => {
  const value = Number(lightInput.value);
  body.style.setProperty("--light-level", String(value / 100));
  lightOutput.value = `${value}%`;
  lightOutput.textContent = `${value}%`;
  renderTraces();
});

runButton.addEventListener("click", runTrial);

setLayer(0, false);
