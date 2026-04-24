"use client";

import { FormEvent, useState } from "react";
import type { ApiResponse, HierarchyObject, HierarchyResult } from "@/types";

const SAMPLE_INPUT = `A->B
A->C
B->D
E->F`;

function parseTextareaInput(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function TreeNode({ node, branch }: { node: string; branch: HierarchyObject }) {
  const children = Object.entries(branch);

  return (
    <li className="ml-4 list-none">
      <div className="rounded-2xl border border-[color:var(--line)] bg-white/70 px-3 py-2 text-sm font-semibold shadow-sm">
        {node}
      </div>
      {children.length > 0 ? (
        <ul className="mt-3 space-y-3 border-l border-dashed border-[color:var(--line)] pl-4">
          {children.map(([child, childBranch]) => (
            <TreeNode key={child} node={child} branch={childBranch} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function HierarchyCard({ hierarchy }: { hierarchy: HierarchyResult }) {
  const [root, branch] = Object.entries(hierarchy.tree)[0];

  return (
    <article className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] backdrop-blur">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-teal-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
          {hierarchy.has_cycle ? "Cycle" : "Tree"}
        </span>
        <span className="text-sm text-stone-700">Root: {hierarchy.root}</span>
        <span className="text-sm text-stone-700">
          Depth: {hierarchy.has_cycle ? "Not applicable" : hierarchy.depth}
        </span>
      </div>
      <ul className="space-y-3">
        <TreeNode node={root} branch={branch} />
      </ul>
    </article>
  );
}

function BadgeList({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "amber" | "rose";
}) {
  if (items.length === 0) {
    return null;
  }

  const toneClasses =
    tone === "amber"
      ? "border-amber-300 bg-amber-100/80 text-amber-900"
      : "border-rose-300 bg-rose-100/80 text-rose-900";

  return (
    <section className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow)] backdrop-blur">
      <h3 className="mb-4 text-lg font-semibold">{label}</h3>
      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <span
            key={item}
            className={`rounded-full border px-3 py-1 text-sm font-medium ${toneClasses}`}
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const [input, setInput] = useState(SAMPLE_INPUT);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/bfhl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: parseTextareaInput(input),
        }),
      });

      const payload = (await response.json()) as ApiResponse | { error?: string };
      const errorMessage = "error" in payload ? payload.error : undefined;

      if (!response.ok || !("is_success" in payload) || !payload.is_success) {
        setResult(null);
        setError(errorMessage ?? "Request failed. Please try again.");
        return;
      }

      setResult(payload);
    } catch {
      setResult(null);
      setError("Unable to reach the API. Please verify the local server and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[36px] border border-[color:var(--line)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow)] backdrop-blur">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-teal-800">
            SRM Full Stack Engineering Challenge
          </p>
          <h1 className="text-4xl font-black tracking-tight text-stone-900 sm:text-5xl">
            BFHL hierarchy analyzer built with Next.js 16
          </h1>
          <p className="mt-4 text-base leading-7 text-stone-700">
            Submit comma-separated or newline-separated edges, inspect trees and cycles, and
            review invalid or duplicate entries in one place.
          </p>
        </div>
      </section>

      <section className="rounded-[32px] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-6 shadow-[var(--shadow)]">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="edges" className="mb-2 block text-sm font-semibold text-stone-800">
              Input edges
            </label>
            <textarea
              id="edges"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-h-64 w-full rounded-[24px] border border-[color:var(--line)] bg-white px-4 py-4 text-sm leading-6 text-stone-900 shadow-inner outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
              placeholder="A->B, B->C, C->D"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Processing..." : "Submit"}
            </button>
          </div>
        </form>
      </section>

      {error ? (
        <section className="rounded-[24px] border border-rose-300 bg-rose-50 px-5 py-4 text-sm text-rose-900 shadow-sm">
          {error}
        </section>
      ) : null}

      {result ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                User ID
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-900">{result.user_id}</p>
            </div>
            <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Email
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-900">{result.email_id}</p>
            </div>
            <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Roll Number
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-900">
                {result.college_roll_number}
              </p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Total Trees
              </p>
              <p className="mt-2 text-3xl font-black text-stone-900">
                {result.summary.total_trees}
              </p>
            </div>
            <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Total Cycles
              </p>
              <p className="mt-2 text-3xl font-black text-stone-900">
                {result.summary.total_cycles}
              </p>
            </div>
            <div className="rounded-[28px] border border-[color:var(--line)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Largest Tree Root
              </p>
              <p className="mt-2 text-3xl font-black text-stone-900">
                {result.summary.largest_tree_root ?? "None"}
              </p>
            </div>
          </section>

          <section className="grid gap-6">
            {result.hierarchies.map((hierarchy) => (
              <HierarchyCard key={`${hierarchy.root}-${hierarchy.has_cycle}`} hierarchy={hierarchy} />
            ))}
          </section>

          <BadgeList label="Invalid Entries" items={result.invalid_entries} tone="rose" />
          <BadgeList label="Duplicate Edges" items={result.duplicate_edges} tone="amber" />
        </>
      ) : null}
    </main>
  );
}
