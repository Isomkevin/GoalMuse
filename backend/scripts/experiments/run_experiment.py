#!/usr/bin/env python3
"""
Run the insights pipeline on the fixed dataset for Opik experiments.
Use to compare model or prompt versions: run with different LLM_PROVIDER (or env) and compare results in Opik.

Usage:
  cd backend && python -m scripts.experiments.run_experiment [--label openai]
  OPIK_API_KEY=xxx LLM_PROVIDER=openai python -m scripts.experiments.run_experiment --label openai
  OPIK_API_KEY=xxx LLM_PROVIDER=gemini python -m scripts.experiments.run_experiment --label gemini

Then compare traces and metrics in the Opik dashboard for the two runs.
"""
import argparse
import json
import os
import sys

# Ensure backend root is on path (run_experiment.py is in backend/scripts/experiments/)
_backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, _backend_root)

from app.agents import run_alignment, run_optimization, run_synergy
from app.agents._opik import track_agent
from app.config import settings
from scripts.experiments.dataset import FIXED_DATASET


@track_agent(name="insights")
def run_insights_for_item(goals_data: list, tasks_data: list, journal_snippets: list[str], completed_count: int):
    """Run all three agents (creates one Opik trace per item when Opik is configured)."""
    alignment = run_alignment(goals_data, tasks_data, journal_snippets)
    synergy = run_synergy(goals_data)
    optimization = run_optimization(goals_data, tasks_data, completed_count)
    return alignment, synergy, optimization


def main():
    parser = argparse.ArgumentParser(description="Run fixed dataset through insights pipeline for Opik experiments.")
    parser.add_argument("--label", default="", help="Label for this run (e.g. openai, gemini) for Opik metadata")
    parser.add_argument("--output", default="", help="Write results JSON to this path")
    args = parser.parse_args()

    if args.label and settings.opik_api_key:
        os.environ.setdefault("OPIK_EXPERIMENT_LABEL", args.label)

    provider = settings.llm_provider or "openai"
    has_llm = bool(
        (provider == "openai" and settings.openai_api_key)
        or (provider == "openrouter" and settings.openrouter_api_key)
        or (provider == "gemini" and settings.google_api_key)
    )
    if not has_llm:
        print("Warning: No LLM API key set for provider", provider, "- agents may return fallbacks.", file=sys.stderr)

    results = []
    for item in FIXED_DATASET:
        item_id = item.get("id", "?")
        goals_data = item["goals"]
        tasks_data = item["tasks"]
        journal_snippets = item.get("journal_snippets", [])
        completed_count = item.get("completed_count", 0)
        try:
            alignment, synergy, optimization = run_insights_for_item(
                goals_data, tasks_data, journal_snippets, completed_count
            )
            row = {
                "item_id": item_id,
                "alignment_score": alignment.get("score", 0),
                "alignment_explanation_len": len(alignment.get("explanation", "")),
                "optimization_action": optimization.get("action", ""),
                "optimization_reason_len": len(optimization.get("reason", "")),
                "synergy_pairs": len(synergy.get("pairs", [])),
                "compound_actions": len(synergy.get("compound_actions", [])),
            }
            results.append(row)
            print(
                f"{item_id}: alignment={row['alignment_score']} "
                f"action_len={len(row['optimization_action'])} "
                f"pairs={row['synergy_pairs']}"
            )
        except Exception as e:
            print(f"{item_id}: ERROR {e}", file=sys.stderr)
            results.append({"item_id": item_id, "error": str(e)})

    # Summary
    ok = [r for r in results if "error" not in r]
    if ok:
        avg_align = sum(r["alignment_score"] for r in ok) / len(ok)
        avg_action_len = sum(len(r["optimization_action"]) for r in ok) / len(ok)
        print(f"\nSummary (n={len(ok)}): avg alignment_score={avg_align:.1f} avg action_len={avg_action_len:.0f}")
        print(f"Provider: {provider}  Label: {args.label or '(none)'}")

    if args.output:
        with open(args.output, "w") as f:
            json.dump({"provider": provider, "label": args.label, "results": results}, f, indent=2)
        print(f"Wrote {args.output}")

    return 0 if results else 1


if __name__ == "__main__":
    sys.exit(main())
