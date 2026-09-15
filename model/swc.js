/** Parse and project a standard seven-column SWC morphology. */

export function parseSWC(text) {
  const nodes = [];
  const byId = new Map();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const values = line.split(/\s+/).map(Number);
    if (values.length < 7 || values.some((value) => !Number.isFinite(value))) continue;
    const [id, type, x, y, z, radius, parentId] = values;
    const node = { id, type, x, y, z, radius, parentId };
    nodes.push(node);
    byId.set(id, node);
  }

  const segments = nodes
    .filter((node) => node.parentId !== -1 && byId.has(node.parentId))
    .map((node) => ({ from: byId.get(node.parentId), to: node }));

  return { nodes, segments };
}

export function morphologyBounds(nodes) {
  const axes = ["x", "y", "z"];
  return Object.fromEntries(
    axes.map((axis) => {
      const values = nodes.map((node) => node[axis]);
      return [axis, { min: Math.min(...values), max: Math.max(...values) }];
    }),
  );
}

export function projectMorphology(morphology, projection = "xy") {
  const axisPairs = { xy: ["x", "y"], xz: ["x", "z"], yz: ["y", "z"] };
  const [horizontal, vertical] = axisPairs[projection] ?? axisPairs.xy;
  return {
    nodes: morphology.nodes.map((node) => ({ ...node, horizontal: node[horizontal], vertical: node[vertical] })),
    segments: morphology.segments.map(({ from, to }) => ({
      from: { ...from, horizontal: from[horizontal], vertical: from[vertical] },
      to: { ...to, horizontal: to[horizontal], vertical: to[vertical] },
    })),
    horizontal,
    vertical,
  };
}

export function swcSummary(morphology) {
  const childCounts = new Map();
  for (const node of morphology.nodes) {
    childCounts.set(node.parentId, (childCounts.get(node.parentId) ?? 0) + 1);
  }
  const byId = new Map(morphology.nodes.map((node) => [node.id, node]));
  const somaNodes = morphology.nodes.filter((node) => node.type === 1);
  const dendriteNodes = morphology.nodes.filter((node) => node.type === 3 || node.type === 4);
  const axonNodes = morphology.nodes.filter((node) => node.type === 2);
  return {
    nodes: morphology.nodes.length,
    segments: morphology.segments.length,
    somaNodes: somaNodes.length,
    dendriteNodes: dendriteNodes.length,
    axonNodes: axonNodes.length,
    branchPoints: [...childCounts.entries()].filter(
      ([id, count]) => count > 1 && byId.get(id)?.type !== 1,
    ).length,
    roots: morphology.nodes.filter((node) => node.parentId === -1).length,
    bounds: morphologyBounds(morphology.nodes),
  };
}
