export type HierarchyObject = {
  [node: string]: HierarchyObject;
};

export type HierarchyResult = {
  root: string;
  depth?: number;
  has_cycle: boolean;
  tree: HierarchyObject;
};

export type SummaryObject = {
  total_trees: number;
  total_cycles: number;
  largest_tree_root: string | null;
};

export type RequestBody = {
  data?: unknown;
};

export type ProcessorResult = {
  invalid_entries: string[];
  duplicate_edges: string[];
  hierarchies: HierarchyResult[];
  summary: SummaryObject;
};

export type ApiResponse = ProcessorResult & {
  is_success: boolean;
  user_id: string;
  email_id: string;
  college_roll_number: string;
};
