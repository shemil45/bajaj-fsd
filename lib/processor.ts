import type { HierarchyObject, HierarchyResult, ProcessorResult } from "@/types";

type ParsedEdge = {
  raw: string;
  parent: string;
  child: string;
};

class UnionFind {
  private parent = new Map<string, string>();

  add(value: string) {
    if (!this.parent.has(value)) {
      this.parent.set(value, value);
    }
  }

  find(value: string): string {
    const current = this.parent.get(value);
    if (!current) {
      this.parent.set(value, value);
      return value;
    }

    if (current === value) {
      return value;
    }

    const root = this.find(current);
    this.parent.set(value, root);
    return root;
  }

  union(a: string, b: string) {
    this.add(a);
    this.add(b);

    const rootA = this.find(a);
    const rootB = this.find(b);

    if (rootA !== rootB) {
      this.parent.set(rootB, rootA);
    }
  }
}

const EDGE_PATTERN = /^[A-Z]->[A-Z]$/;

function normalizeEntry(entry: unknown): string {
  return typeof entry === "string" ? entry.trim() : "";
}

function parseEdges(entries: unknown[]): {
  invalidEntries: string[];
  uniqueEdges: ParsedEdge[];
  duplicateEdges: string[];
} {
  const invalidEntries: string[] = [];
  const duplicateEdges: string[] = [];
  const uniqueEdges: ParsedEdge[] = [];
  const seenEdges = new Set<string>();

  for (const entry of entries) {
    const raw = normalizeEntry(entry);

    if (!raw || !EDGE_PATTERN.test(raw)) {
      invalidEntries.push(raw || String(entry));
      continue;
    }

    const [parent, child] = raw.split("->");

    if (parent === child) {
      invalidEntries.push(raw);
      continue;
    }

    if (seenEdges.has(raw)) {
      if (!duplicateEdges.includes(raw)) {
        duplicateEdges.push(raw);
      }
      continue;
    }

    seenEdges.add(raw);
    uniqueEdges.push({ raw, parent, child });
  }

  return { invalidEntries, uniqueEdges, duplicateEdges };
}

function groupComponents(edges: ParsedEdge[]) {
  const adjacency = new Map<string, string[]>();
  const nodes = new Set<string>();
  const childSet = new Set<string>();
  const childToParent = new Map<string, string>();
  const unionFind = new UnionFind();

  for (const { parent, child } of edges) {
    nodes.add(parent);
    nodes.add(child);
    unionFind.union(parent, child);

    if (childToParent.has(child)) {
      continue;
    }

    childToParent.set(child, parent);
    childSet.add(child);

    const currentChildren = adjacency.get(parent) ?? [];
    currentChildren.push(child);
    adjacency.set(parent, currentChildren);
  }

  for (const node of nodes) {
    unionFind.add(node);
  }

  const components = new Map<string, Set<string>>();

  for (const node of nodes) {
    const root = unionFind.find(node);
    const current = components.get(root) ?? new Set<string>();
    current.add(node);
    components.set(root, current);
  }

  return { adjacency, childSet, components };
}

function detectCycle(nodes: string[], adjacency: Map<string, string[]>) {
  const visited = new Set<string>();
  const stack = new Set<string>();

  const visit = (node: string): boolean => {
    visited.add(node);
    stack.add(node);

    const children = adjacency.get(node) ?? [];
    for (const child of children) {
      if (!visited.has(child) && visit(child)) {
        return true;
      }

      if (stack.has(child)) {
        return true;
      }
    }

    stack.delete(node);
    return false;
  };

  for (const node of nodes) {
    if (!visited.has(node) && visit(node)) {
      return true;
    }
  }

  return false;
}

function buildTree(
  node: string,
  adjacency: Map<string, string[]>,
  visited = new Set<string>(),
): HierarchyObject {
  const children = [...(adjacency.get(node) ?? [])].sort();
  const branch: HierarchyObject = {};
  const nextVisited = new Set(visited);
  nextVisited.add(node);

  for (const child of children) {
    if (nextVisited.has(child)) {
      branch[child] = {};
      continue;
    }

    branch[child] = buildTree(child, adjacency, nextVisited);
  }

  return branch;
}

function measureDepth(tree: HierarchyObject): number {
  const children = Object.values(tree);
  if (children.length === 0) {
    return 1;
  }

  return 1 + Math.max(...children.map(measureDepth));
}

function buildComponentResult(
  component: Set<string>,
  adjacency: Map<string, string[]>,
  childSet: Set<string>,
): HierarchyResult {
  const nodes = [...component].sort();
  const hasCycle = detectCycle(nodes, adjacency);

  const root =
    nodes.find((node) => !childSet.has(node)) ??
    [...nodes].sort((a, b) => a.localeCompare(b))[0];

  const tree = { [root]: buildTree(root, adjacency) };

  if (hasCycle) {
    return {
      root,
      has_cycle: true,
      tree,
    };
  }

  return {
    root,
    has_cycle: false,
    tree,
    depth: measureDepth(tree),
  };
}

export function processInput(data: unknown): ProcessorResult {
  const entries = Array.isArray(data) ? data : [];
  const { invalidEntries, uniqueEdges, duplicateEdges } = parseEdges(entries);
  const { adjacency, childSet, components } = groupComponents(uniqueEdges);

  const hierarchies = [...components.values()]
    .map((component) => buildComponentResult(component, adjacency, childSet))
    .sort((a, b) => a.root.localeCompare(b.root));

  const nonCyclicTrees = hierarchies.filter((item) => !item.has_cycle);

  const largestTreeRoot =
    nonCyclicTrees
      .sort((a, b) => {
        const depthDifference = (b.depth ?? 0) - (a.depth ?? 0);
        if (depthDifference !== 0) {
          return depthDifference;
        }

        return a.root.localeCompare(b.root);
      })[0]?.root ?? null;

  return {
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    hierarchies,
    summary: {
      total_trees: nonCyclicTrees.length,
      total_cycles: hierarchies.length - nonCyclicTrees.length,
      largest_tree_root: largestTreeRoot,
    },
  };
}
