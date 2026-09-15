import { simulateM1 } from "./model/m1-electrophysiology.js";
import { parseSWC, projectMorphology, swcSummary } from "./model/swc.js";

const morphologyCanvas = document.querySelector("#morphology-canvas");
const traceCanvas = document.querySelector("#trace-canvas");
const morphologyLoading = document.querySelector("#morphology-loading");
const projectionControls = [...document.querySelectorAll("[data-projection]")];
const traceControls = [...document.querySelectorAll("[data-trace]")];
const depthColour = document.querySelector("#depth-colour");
const showSoma = document.querySelector("#show-soma");
const showOmissions = document.querySelector("#show-omissions");
const omissionTags = document.querySelector("#omission-tags");
const horizontalAxis = document.querySelector("#horizontal-axis");
const verticalAxis = document.querySelector("#vertical-axis");
const extentReadout = document.querySelector("#extent-readout");
const nodeCount = document.querySelector("#node-count");
const currentInput = document.querySelector("#applied-current");
const currentOutput = document.querySelector("#current-output");
const runButton = document.querySelector("#run-model");
const traceYAxis = document.querySelector("#trace-y-axis");
const traceLegend = document.querySelector("#trace-legend");
const spikeCount = document.querySelector("#spike-count");
const peakVoltage = document.querySelector("#peak-voltage");
const finalVoltage = document.querySelector("#final-voltage");

const colours = {
  voltage: "#77f2c1",
  sodium: "#74d9ee",
  potassium: "#ffc66c",
  calcium: "#b9a1ff",
  leak: "#ff8c76",
  m: "#77f2c1",
  h: "#74d9ee",
  n: "#ffc66c",
  r: "#b9a1ff",
  f: "#ff8c76",
};

let morphology = null;
let activeProjection = "xy";
let activeTrace = "voltage";
let latestSimulation = null;

function prepareCanvas(canvas) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  return { context, width, height };
}

function drawGrid(context, width, height, padding) {
  context.save();
  context.strokeStyle = "rgba(108, 151, 138, .10)";
  context.lineWidth = 1;
  const columns = 8;
  const rows = 6;
  for (let index = 0; index <= columns; index += 1) {
    const x = padding.left + ((width - padding.left - padding.right) * index) / columns;
    context.beginPath();
    context.moveTo(x, padding.top);
    context.lineTo(x, height - padding.bottom);
    context.stroke();
  }
  for (let index = 0; index <= rows; index += 1) {
    const y = padding.top + ((height - padding.top - padding.bottom) * index) / rows;
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
  }
  context.restore();
}

function depthColourFor(z, zMin, zMax) {
  const fraction = zMax === zMin ? 0.5 : (z - zMin) / (zMax - zMin);
  const hue = 170 + fraction * 105;
  return `hsla(${hue}, 74%, 67%, .78)`;
}

function drawMorphology() {
  if (!morphology) return;
  const { context, width, height } = prepareCanvas(morphologyCanvas);
  const padding = { top: 30, right: 30, bottom: 30, left: 30 };
  drawGrid(context, width, height, padding);

  const projected = projectMorphology(morphology, activeProjection);
  const horizontalValues = projected.nodes.map((node) => node.horizontal);
  const verticalValues = projected.nodes.map((node) => node.vertical);
  const hMin = Math.min(...horizontalValues);
  const hMax = Math.max(...horizontalValues);
  const vMin = Math.min(...verticalValues);
  const vMax = Math.max(...verticalValues);
  const zValues = morphology.nodes.map((node) => node.z);
  const zMin = Math.min(...zValues);
  const zMax = Math.max(...zValues);
  const spanH = Math.max(1, hMax - hMin);
  const spanV = Math.max(1, vMax - vMin);
  const scale = Math.min(
    (width - padding.left - padding.right) / spanH,
    (height - padding.top - padding.bottom) / spanV,
  );
  const usedWidth = spanH * scale;
  const usedHeight = spanV * scale;
  const originX = padding.left + (width - padding.left - padding.right - usedWidth) / 2;
  const originY = padding.top + (height - padding.top - padding.bottom - usedHeight) / 2;
  const point = (node) => ({
    x: originX + (node.horizontal - hMin) * scale,
    y: originY + usedHeight - (node.vertical - vMin) * scale,
  });

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const segment of projected.segments) {
    if (!showSoma.checked && (segment.from.type === 1 || segment.to.type === 1)) continue;
    const from = point(segment.from);
    const to = point(segment.to);
    const isSoma = segment.from.type === 1 || segment.to.type === 1;
    context.strokeStyle = isSoma
      ? "rgba(234, 247, 241, .96)"
      : depthColour.checked
        ? depthColourFor((segment.from.z + segment.to.z) / 2, zMin, zMax)
        : "rgba(119, 242, 193, .72)";
    context.lineWidth = isSoma ? 3 : 0.78;
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }

  if (showSoma.checked) {
    const soma = projected.nodes.find((node) => node.type === 1);
    if (soma) {
      const centre = point(soma);
      const radius = Math.max(5, soma.radius * scale);
      const gradient = context.createRadialGradient(centre.x - radius * .25, centre.y - radius * .25, 1, centre.x, centre.y, radius);
      gradient.addColorStop(0, "rgba(234, 247, 241, .98)");
      gradient.addColorStop(.35, "rgba(119, 242, 193, .9)");
      gradient.addColorStop(1, "rgba(119, 242, 193, .2)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(centre.x, centre.y, radius, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.restore();

  horizontalAxis.textContent = projected.horizontal;
  verticalAxis.textContent = projected.vertical;
  extentReadout.textContent = `${Math.round(spanH)} × ${Math.round(spanV)} µm`;
  morphologyCanvas.setAttribute(
    "aria-label",
    `${activeProjection.toUpperCase()} projection of M1 ipRGC 070320Ac10; ${morphology.nodes.length} SWC nodes; axon and measured dendritic diameters absent`,
  );
}

function numericRange(seriesList, fixedRange = null) {
  if (fixedRange) return fixedRange;
  const values = seriesList.flatMap((series) => series.values);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const margin = Math.max((maximum - minimum) * 0.08, 0.01);
  return [minimum - margin, maximum + margin];
}

function drawTrace() {
  if (!latestSimulation) return;
  const { context, width, height } = prepareCanvas(traceCanvas);
  const padding = { top: 28, right: 22, bottom: 30, left: 44 };
  drawGrid(context, width, height, padding);

  let series;
  let unit;
  let fixedRange = null;
  if (activeTrace === "currents") {
    series = ["sodium", "potassium", "calcium", "leak"].map((name) => ({
      name: `I${name === "potassium" ? "K" : name === "sodium" ? "Na" : name === "calcium" ? "Ca" : "L"}`,
      values: latestSimulation.currents[name],
      colour: colours[name],
    }));
    unit = "source current units";
  } else if (activeTrace === "gates") {
    series = ["m", "h", "n", "r", "f"].map((name) => ({ name, values: latestSimulation.gates[name], colour: colours[name] }));
    unit = "open fraction";
    fixedRange = [0, 1];
  } else {
    series = [{ name: "Vm", values: latestSimulation.voltageMV, colour: colours.voltage }];
    unit = "mV";
  }

  const [minimum, maximum] = numericRange(series, fixedRange);
  const tMax = latestSimulation.timeMs.at(-1);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const xAt = (time) => padding.left + (time / tMax) * plotWidth;
  const yAt = (value) => padding.top + ((maximum - value) / (maximum - minimum || 1)) * plotHeight;

  context.save();
  context.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillStyle = "rgba(140, 168, 159, .72)";
  context.textAlign = "right";
  context.textBaseline = "middle";
  for (let index = 0; index <= 4; index += 1) {
    const value = maximum - ((maximum - minimum) * index) / 4;
    context.fillText(value.toFixed(activeTrace === "gates" ? 2 : 1), padding.left - 7, padding.top + (plotHeight * index) / 4);
  }
  context.textAlign = "center";
  context.textBaseline = "top";
  for (let index = 0; index <= 5; index += 1) {
    const time = (tMax * index) / 5;
    context.fillText(String(Math.round(time)), xAt(time), height - padding.bottom + 8);
  }

  for (const item of series) {
    context.strokeStyle = item.colour;
    context.lineWidth = series.length === 1 ? 1.45 : 1.05;
    context.beginPath();
    item.values.forEach((value, index) => {
      const x = xAt(latestSimulation.timeMs[index]);
      const y = yAt(value);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  }
  context.restore();

  traceYAxis.textContent = unit;
  traceLegend.replaceChildren(
    ...series.map((item) => {
      const label = document.createElement("span");
      const swatch = document.createElement("i");
      swatch.style.setProperty("--series-colour", item.colour);
      label.append(swatch, item.name);
      return label;
    }),
  );
  traceCanvas.setAttribute("aria-label", `${activeTrace} trace from the Stinchcombe M1 somatic model`);
}

function setPressed(buttons, activeButton) {
  for (const button of buttons) {
    const active = button === activeButton;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  }
}

function runSimulation() {
  runButton.disabled = true;
  runButton.firstChild.textContent = "Running… ";
  requestAnimationFrame(() => {
    window.setTimeout(() => {
      latestSimulation = simulateM1({
        currentPA: Number(currentInput.value),
        durationMs: 500,
        dtMs: 0.01,
        initialVoltageMV: -30,
        sampleEveryMs: 0.25,
      });
      const summary = latestSimulation.summary;
      spikeCount.textContent = String(summary.spikeCount);
      peakVoltage.textContent = `${summary.maximumVoltageMV.toFixed(1)} mV`;
      finalVoltage.textContent = `${summary.finalVoltageMV.toFixed(1)} mV`;
      drawTrace();
      runButton.disabled = false;
      runButton.firstChild.textContent = "Run 500 ms ";
    }, 20);
  });
}

projectionControls.forEach((button) => {
  button.addEventListener("click", () => {
    activeProjection = button.dataset.projection;
    setPressed(projectionControls, button);
    drawMorphology();
  });
});

traceControls.forEach((button) => {
  button.addEventListener("click", () => {
    activeTrace = button.dataset.trace;
    setPressed(traceControls, button);
    drawTrace();
  });
});

[depthColour, showSoma].forEach((control) => control.addEventListener("change", drawMorphology));
showOmissions.addEventListener("change", () => { omissionTags.hidden = !showOmissions.checked; });
currentInput.addEventListener("input", () => {
  currentOutput.value = `${currentInput.value} pA`;
  currentOutput.textContent = `${currentInput.value} pA`;
});
runButton.addEventListener("click", runSimulation);

const resizeObserver = new ResizeObserver(() => {
  drawMorphology();
  drawTrace();
});
resizeObserver.observe(morphologyCanvas);
resizeObserver.observe(traceCanvas);

fetch("data/source/neuromorpho/070320Ac10.CNG.swc")
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  })
  .then((text) => {
    morphology = parseSWC(text);
    const summary = swcSummary(morphology);
    nodeCount.textContent = summary.nodes.toLocaleString("en-AU");
    morphologyLoading.classList.add("is-hidden");
    drawMorphology();
  })
  .catch((error) => {
    morphologyLoading.textContent = `Could not load the SWC: ${error.message}. Serve this directory over HTTP.`;
  });

runSimulation();
