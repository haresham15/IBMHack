"""
generate_data.py
Generates a synthetic labeled dataset for the Vantage neurodivergent UI config model.

Each row represents a student's CAP profile (inputs) and their optimal UI config (outputs).
Rules are derived from the neurodivergent_ux_research.md document.

Run: python3 ml/generate_data.py
Output: ml/data/synthetic_profiles.csv
"""

import random
import json
import csv
import os
from itertools import combinations

random.seed(42)

# ── Disorder definitions ─────────────────────────────────────────────────────
ALL_DISORDERS = ["adhd", "asd", "dyslexia", "dyscalculia", "dyspraxia", "spd", "anxiety"]

DISORDER_RULES = {
    "adhd": {
        "color_theme":    "neutral",
        "font_family":    "inter",
        "font_size":      "large",
        "motion":         "reduced",
        "info_density":   "minimal",
        "large_targets":  True,
        "read_aloud":     True,
        "progress_bars":  True,
        "no_timers":      True,
    },
    "asd": {
        "color_theme":    "warm",        # warm oat/beige
        "font_family":    "atkinson",
        "font_size":      "default",
        "motion":         "off",
        "info_density":   "minimal",
        "large_targets":  False,
        "read_aloud":     True,
        "progress_bars":  True,
        "no_timers":      True,
    },
    "dyslexia": {
        "color_theme":    "cream",
        "font_family":    "lexend",
        "font_size":      "xl",          # 18-20px
        "motion":         "reduced",
        "info_density":   "moderate",
        "large_targets":  False,
        "read_aloud":     True,          # critical
        "progress_bars":  True,
        "no_timers":      False,
    },
    "dyscalculia": {
        "color_theme":    "neutral",
        "font_family":    "inter",
        "font_size":      "large",
        "motion":         "reduced",
        "info_density":   "minimal",
        "large_targets":  False,
        "read_aloud":     True,
        "progress_bars":  True,          # visual only, no percentages
        "no_timers":      True,
    },
    "dyspraxia": {
        "color_theme":    "neutral",
        "font_family":    "atkinson",
        "font_size":      "large",
        "motion":         "reduced",
        "info_density":   "moderate",
        "large_targets":  True,          # critical
        "read_aloud":     True,
        "progress_bars":  True,
        "no_timers":      False,
    },
    "spd": {
        "color_theme":    "dark",        # low-sensory / dark default
        "font_family":    "inter",
        "font_size":      "default",
        "motion":         "off",         # strict off
        "info_density":   "minimal",
        "large_targets":  False,
        "read_aloud":     False,
        "progress_bars":  True,
        "no_timers":      False,
    },
    "anxiety": {
        "color_theme":    "calm",        # cloud / sea-salt blues
        "font_family":    "nunito",
        "font_size":      "default",
        "motion":         "reduced",
        "info_density":   "moderate",
        "large_targets":  False,
        "read_aloud":     False,
        "progress_bars":  True,
        "no_timers":      True,
    },
}

# Priority rules when disorders conflict
# Higher number = higher override priority
PRIORITY = {
    "motion":         {"off": 3, "reduced": 2, "on": 1},
    "font_size":      {"xl": 3, "large": 2, "default": 1},
    "info_density":   {"minimal": 3, "moderate": 2, "full": 1},
    "color_theme":    {"dark": 2, "cream": 2, "warm": 2, "calm": 2, "neutral": 1},
    "font_family":    {"lexend": 3, "opendyslexic": 3, "atkinson": 2, "nunito": 2, "inter": 1},
}

BOOL_OUTPUTS = ["large_targets", "read_aloud", "progress_bars", "no_timers"]

def merge_disorders(disorder_list):
    """Merge rules from multiple disorders using priority/OR logic."""
    if not disorder_list:
        return {
            "color_theme":   "neutral",
            "font_family":   "inter",
            "font_size":     "default",
            "motion":        "on",
            "info_density":  "full",
            "large_targets": False,
            "read_aloud":    False,
            "progress_bars": False,
            "no_timers":     False,
        }

    result = {}
    rules = [DISORDER_RULES[d] for d in disorder_list]

    # For priority fields: take highest priority value
    for field, priority_map in PRIORITY.items():
        candidates = [r[field] for r in rules]
        result[field] = max(candidates, key=lambda v: priority_map.get(v, 0))

    # For boolean fields: OR (any disorder needing it = enable it)
    for field in BOOL_OUTPUTS:
        result[field] = any(r[field] for r in rules)

    return result

def support_level_adjustments(config, support_level):
    """Apply support_level overrides (high support = more accessibility)."""
    if support_level == "high":
        config["info_density"] = "minimal"
        config["read_aloud"] = True
        config["font_size"] = "xl" if config["font_size"] == "default" else config["font_size"]
    elif support_level == "low":
        # Don't override anything — user may prefer standard
        if config["info_density"] == "full":
            config["info_density"] = "moderate"
    return config

def sensory_flags_adjustments(config, sensory_flags):
    """Apply additional sensory flags from CAP profile."""
    if "light_sensitivity" in sensory_flags:
        config["color_theme"] = "dark"
        config["motion"] = "off"
    if "sound_sensitivity" in sensory_flags:
        config["read_aloud"] = False
    if "motion_sensitivity" in sensory_flags:
        config["motion"] = "off"
    return config

def add_noise(config, noise_level=0.08):
    """Add small random variation to simulate individual differences."""
    if random.random() < noise_level:
        config["font_size"] = random.choice(["default", "large", "xl"])
    if random.random() < noise_level:
        config["motion"] = random.choice(["on", "reduced", "off"])
    if random.random() < noise_level:
        config["read_aloud"] = not config["read_aloud"]
    return config

def generate_row():
    """Generate one synthetic student profile + UI config."""
    # Randomly pick 0-3 disorders (most students have 0-2)
    n_disorders = random.choices([0, 1, 2, 3], weights=[20, 40, 30, 10])[0]
    disorders = sorted(random.sample(ALL_DISORDERS, n_disorders)) if n_disorders > 0 else []

    # CAP profile inputs
    support_level    = random.choices(["low", "medium", "high"], weights=[25, 45, 30])[0]
    info_density_pref = random.choices(["minimal", "moderate", "full"], weights=[30, 45, 25])[0]
    time_horizon     = random.choice(["24h", "72h", "1week", "2weeks"])
    sensory_flags    = random.sample(
        ["light_sensitivity", "sound_sensitivity", "motion_sensitivity", "none"],
        k=random.randint(0, 2)
    )
    sensory_flags = [s for s in sensory_flags if s != "none"]

    # Generate optimal UI config
    config = merge_disorders(disorders)
    config = support_level_adjustments(config, support_level)
    config = sensory_flags_adjustments(config, sensory_flags)

    # User's explicit density pref can override if stronger
    density_pri = PRIORITY["info_density"]
    if density_pri.get(info_density_pref, 0) > density_pri.get(config["info_density"], 0):
        config["info_density"] = info_density_pref

    config = add_noise(config)

    return {
        # ── Inputs (features) ──────────────────────────────────────────────
        "has_adhd":          int("adhd" in disorders),
        "has_asd":           int("asd" in disorders),
        "has_dyslexia":      int("dyslexia" in disorders),
        "has_dyscalculia":   int("dyscalculia" in disorders),
        "has_dyspraxia":     int("dyspraxia" in disorders),
        "has_spd":           int("spd" in disorders),
        "has_anxiety":       int("anxiety" in disorders),
        "n_disorders":       len(disorders),
        "support_level":     support_level,
        "info_density_pref": info_density_pref,
        "time_horizon":      time_horizon,
        "light_sensitivity": int("light_sensitivity" in sensory_flags),
        "sound_sensitivity": int("sound_sensitivity" in sensory_flags),
        "motion_sensitivity":int("motion_sensitivity" in sensory_flags),

        # ── Outputs (labels) ───────────────────────────────────────────────
        "color_theme":       config["color_theme"],
        "font_family":       config["font_family"],
        "font_size":         config["font_size"],
        "motion":            config["motion"],
        "info_density":      config["info_density"],
        "large_targets":     int(config["large_targets"]),
        "read_aloud":        int(config["read_aloud"]),
        "progress_bars":     int(config["progress_bars"]),
        "no_timers":         int(config["no_timers"]),
    }

def main():
    os.makedirs("ml/data", exist_ok=True)

    N = 2000
    rows = [generate_row() for _ in range(N)]

    out_path = "ml/data/synthetic_profiles.csv"
    with open(out_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    print(f"✅ Generated {N} rows → {out_path}")

    # Quick distribution report
    import collections
    print("\nColor theme distribution:")
    themes = collections.Counter(r["color_theme"] for r in rows)
    for k, v in themes.most_common():
        print(f"  {k:12s}  {v:4d}  ({v/N*100:.1f}%)")

    print("\nMotion distribution:")
    motions = collections.Counter(r["motion"] for r in rows)
    for k, v in motions.most_common():
        print(f"  {k:12s}  {v:4d}  ({v/N*100:.1f}%)")

    print("\nDisorder prevalence (% of students):")
    for d in ["adhd", "asd", "dyslexia", "dyscalculia", "dyspraxia", "spd", "anxiety"]:
        pct = sum(r[f"has_{d}"] for r in rows) / N * 100
        print(f"  {d:14s}  {pct:.1f}%")

if __name__ == "__main__":
    main()
