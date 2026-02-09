# Opik experiments (fixed dataset)

Compare model or prompt versions on a reproducible set of inputs.

## Dataset

`dataset.py` defines a small fixed set of synthetic board/goals/tasks/journal items. Use this for regression tests and A/B comparison in Opik.

## Run experiment

From the `backend` directory:

```bash
# Use current .env (OPIK_API_KEY, LLM_PROVIDER, etc.)
python -m scripts.experiments.run_experiment --label openai

# Compare with another provider (run separately)
# Set env then:
python -m scripts.experiments.run_experiment --label gemini
```

With `OPIK_API_KEY` set, each dataset item produces a trace in Opik. Run with different `LLM_PROVIDER` (or prompt versions) and compare traces and metrics in the Opik dashboard to see "version B vs version A" with data.

## Output

- Console: per-item alignment score, action length, synergy pairs; then summary averages.
- Optional: `--output results.json` writes full results for comparison.
