#!/usr/bin/env python3
"""
Run the insights pipeline for every configured LLM provider and write a single
comparison to experiment_results/latest.json. Use this so Advanced Features
can show "How we compare (Opik)" with one command.

Usage:
  cd backend && python -m scripts.experiments.run_all_experiments

Requires API keys in env for each provider you want to compare (OPENAI_API_KEY,
OPENROUTER_API_KEY, GOOGLE_API_KEY). Skips providers without a key.
"""
import os
import subprocess
import sys

# backend root
_backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, _backend_root)

from app.config import settings


def main():
    providers_to_run = []
    if settings.openai_api_key:
        providers_to_run.append("openai")
    if settings.openrouter_api_key:
        providers_to_run.append("openrouter")
    if settings.google_api_key:
        providers_to_run.append("gemini")

    if not providers_to_run:
        print("No LLM API keys set. Set OPENAI_API_KEY, OPENROUTER_API_KEY, and/or GOOGLE_API_KEY.", file=sys.stderr)
        return 1

    env = os.environ.copy()
    for provider in providers_to_run:
        env["LLM_PROVIDER"] = provider
        cmd = [sys.executable, "-m", "scripts.experiments.run_experiment", "--label", provider]
        print(f"Running: LLM_PROVIDER={provider} python -m scripts.experiments.run_experiment --label {provider}")
        r = subprocess.run(cmd, cwd=_backend_root, env=env)
        if r.returncode != 0:
            print(f"Warning: run_experiment for {provider} exited with {r.returncode}", file=sys.stderr)

    print("\nDone. Check experiment_results/latest.json and the Opik dashboard for comparison.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
