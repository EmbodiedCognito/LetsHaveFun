# NeuroMorpho.Org source reconstructions

These are the three mouse M1 ipRGC reconstructions returned by the Schwartz archive in NeuroMorpho.Org release 8.6.124 when audited on 15 September 2026.

| Cell | NeuroMorpho ID | Preserved domains | Role here |
| --- | --- | --- | --- |
| `070320Ac10` | `NMO_251644` | dendrites, soma; no axon | selected reference morphology |
| `080119Ac1` | `NMO_251639` | dendrites, soma; no axon | comparison candidate |
| `042419Ac7` | `NMO_251705` | dendrites; no soma or axon | comparison candidate |

All three files are marked `No Diameter, 3D, Angles`. Their fixed 0.125 µm dendritic radius is a standardisation placeholder, not a measured calibre. All have physical-integrity status `Dendrites Moderate` and no shrinkage correction.

## Attribution and licence

NeuroMorpho.Org data are available under CC BY 4.0. Use requires all of the following citations:

1. Goetz J, Jessen ZF, Jacobi A, et al. (2022). Unified classification of mouse retinal ganglion cells using function, morphology, and gene expression. *Cell Reports* 40, 111040. https://doi.org/10.1016/j.celrep.2022.111040
2. NeuroMorpho.Org (RRID:SCR_002145).
3. Tecuatl C, Ljungquist B, Ascoli GA (2024). Accelerating the continuous community sharing of digital neuromorphology data. *FASEB BioAdvances* 6(7), 207–221. https://doi.org/10.1096/fba.2024-00048

The source study’s traced-RGC dataset is also available as Schwartz G (2022), *Traced Retinal Ganglion Cells – RGCtypes.org*, Mendeley Data v1, https://doi.org/10.17632/8f435gyybb.1, CC BY 4.0.

Direct programmatic downloads used the URLs prescribed by the NeuroMorpho.Org terms of use:

- https://neuromorpho.org/dableFiles/schwartz/CNG%20version/070320Ac10.CNG.swc
- https://neuromorpho.org/dableFiles/schwartz/CNG%20version/080119Ac1.CNG.swc
- https://neuromorpho.org/dableFiles/schwartz/CNG%20version/042419Ac7.CNG.swc

The committed `070320Ac10.CNG.swc` is a privacy-sanitised copy: a conversion-contact
email address and a contributor workstation path were removed from the upstream
header. The 3,758 SWC geometry records are unchanged; the manifest records the
checksum of this committed copy.
