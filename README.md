# One neuron, many boundaries

An experimental bench for an awkward question: can the whole-fly connectome trick—compressing each cell into an effective unit—be applied to one neurone, and what does that operation erase?

The current build is **Reference α.1**. It begins the non-toy version of the experiment with two executable, independently sourced M1 intrinsically photosensitive retinal ganglion cell modules:

- a public 3-D M1 reconstruction, `070320Ac10` / `NMO_251644`, from the Schwartz archive at NeuroMorpho.Org;
- the six-state, single-compartment M1 conductance model from Stinchcombe et al. (2021), ModelDB accession 267026.

They are not measurements from the same cell. The interface and [`data/provenance.json`](data/provenance.json) preserve that fact as a first-class model constraint.

## Run locally

The browser loads the SWC with `fetch`, so serve the directory over HTTP rather than opening `index.html` as a `file://` URL. For example:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`.

The site has no runtime dependencies. Tests require a recent Node.js release:

```sh
npm test
```

## What is implemented

- Parsing and three-plane projection of the original 3-D SWC.
- Visible morphology omissions: no axon, no dendritic diameter, moderate dendritic integrity and no shrinkage correction.
- A browser-portable implementation of the published M1 soma equations: voltage plus `m`, `h`, `n`, `r` and `f` gates; Na, K, Ca and leak currents.
- The source protocol (100 pA, 500 ms, initial voltage −30 mV) and explorable 0–400 pA current injection.
- Voltage, current and gating-variable inspection.
- Automated regression and morphology-integrity tests.
- A machine-readable module and join ledger with source URLs, dataset licences, specimen relationships and blocked claims.

The JavaScript model reproduces 10 zero-crossing spikes for the 100 pA source protocol. Its 500 ms endpoint agrees within 0.001 mV with an independent SciPy BDF integration of the same published equations. This is a transcription/integration check, not validation against a new biological recording.

## What is deliberately not implemented yet

- The conductances are not distributed over the reconstructed arbor.
- No axon or dendritic diameters have been invented.
- The model is not light driven.
- Melanopsin phototransduction and intracellular photosensitivity remain gated modules. Each must bring a wavelength-dependent input, compartment location, measurable state variables and a separately testable coupling.

## Evidence policy

Every module declares whether it is from the direct specimen, an independent M1 cohort, the wider ipRGC family, another retinal neurone, neurones generally or frontier evidence. Cross-source assembly is allowed; invisible specimen substitution is not.

## Primary sources

- Goetz J et al. (2022). *Unified classification of mouse retinal ganglion cells using function, morphology, and gene expression.* Cell Reports 40:111040. https://doi.org/10.1016/j.celrep.2022.111040
- Schwartz G (2022). *Traced Retinal Ganglion Cells – RGCtypes.org.* Mendeley Data v1. https://doi.org/10.17632/8f435gyybb.1
- Stinchcombe AR et al. (2021). *M1-Type, but Not M4-Type, Melanopsin Ganglion Cells Are Physiologically Tuned to the Central Circadian Clock.* Frontiers in Neuroscience 15:652996. https://doi.org/10.3389/fnins.2021.652996
- ModelDB accession 267026. https://modeldb.science/267026
- Tecuatl C, Ljungquist B, Ascoli GA (2024). *Accelerating the continuous community sharing of digital neuromorphology data.* FASEB BioAdvances 6(7):207–221. https://doi.org/10.1096/fba.2024-00048
- FlyWire Consortium (2024). *Neuronal wiring diagram of an adult brain.* Nature. https://doi.org/10.1038/s41586-024-07558-y
- Wang et al. (2025 preprint). Whole-fly-brain model on Loihi 2. https://arxiv.org/abs/2508.16792

NeuroMorpho.Org reconstructions are included under CC BY 4.0. See [`data/source/neuromorpho/README.md`](data/source/neuromorpho/README.md) for the required attribution and source URLs.
