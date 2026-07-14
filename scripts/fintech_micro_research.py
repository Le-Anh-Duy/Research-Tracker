"""A deterministic, dependency-free micro study for Research Navigator demos."""

import json
import random
from pathlib import Path


def metrics(labels, predictions):
    tp = sum(label and prediction for label, prediction in zip(labels, predictions))
    fp = sum(not label and prediction for label, prediction in zip(labels, predictions))
    fn = sum(label and not prediction for label, prediction in zip(labels, predictions))
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    return {
        "precision": round(precision, 3),
        "recall": round(recall, 3),
        "f1": round(2 * precision * recall / (precision + recall), 3) if precision + recall else 0.0,
    }


def main():
    random.seed(7)
    rows = []
    for _ in range(800):
        dti = random.random()
        late_payments = random.random()
        cash_volatility = random.random()
        income_stability = random.random()
        risk_signal = 0.35 * dti + 0.35 * late_payments + 0.2 * cash_volatility + 0.1 * (1 - income_stability)
        default = risk_signal + random.uniform(-0.16, 0.16) > 0.55
        rows.append((dti, late_payments, cash_volatility, income_stability, default))

    labels = [row[4] for row in rows]
    dti_only = [row[0] > 0.52 for row in rows]
    behavioral_score = [0.35 * row[0] + 0.35 * row[1] + 0.2 * row[2] + 0.1 * (1 - row[3]) > 0.52 for row in rows]
    high_dti_rule = [row[0] > 0.75 for row in rows]

    result = {
        "dataset": {"rows": len(rows), "seed": 7, "synthetic": True},
        "dti_only": metrics(labels, dti_only),
        "behavioral_score": metrics(labels, behavioral_score),
        "high_dti_dead_end": metrics(labels, high_dti_rule),
    }
    output = Path("research_data/artifacts/fintech_micro_results.json")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
