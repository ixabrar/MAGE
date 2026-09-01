"""
config.py
=========

CENTRAL CONFIGURATION FOR ARM
-----------------------------

This file contains configuration shared by the
Adaptive Reliability Module (ARM).

WHY DO WE NEED THIS?

Different ARM components need to agree on things such as:

    - age-bin definitions
    - available models
    - data locations
    - reliability parameters

Instead of hardcoding these values in multiple files,
we define them here.

ARCHITECTURE:

                    config.py
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
    error_profile  reliability   gating


IMPORTANT:
This file contains CONFIGURATION.

It does NOT contain the actual reliability algorithm.

The algorithm will live in:

    reliability.py
    gating.py
"""


# ============================================================
# AGE BINS
# ============================================================

"""
The common age categories used by the Fusion Layer.

Every model should eventually provide probabilities
using these same categories.

Example:

    {
        "18-25": 0.20,
        "26-35": 0.50,
        "36-45": 0.20,
        "46+": 0.10
    }

Keeping these definitions centralized prevents different
models/components from accidentally using incompatible
age groups.
"""

AGE_BINS = [
    "18-25",
    "26-35",
    "36-45",
    "46+"
]


# ============================================================
# SUPPORTED MODELS
# ============================================================

"""
Models currently expected by the Fusion Layer.

These are the initial models:

    - dorsal
    - face
    - blood

The architecture should NOT depend permanently on having
exactly three models.

Later we can add models without redesigning ARM.
"""

SUPPORTED_MODELS = [
    "dorsal",
    "face",
    "blood"
]


# ============================================================
# ERROR HISTORY
# ============================================================

"""
Location of the temporary error-history storage.

During development we use JSON.

Later this can be replaced by:

    - database
    - CSV/Parquet dataset
    - experiment tracking system
    - another persistent storage system

The ARM logic should not fundamentally depend on JSON.
"""

ERROR_HISTORY_FILE = "data/error_history.json"


# ============================================================
# RELIABILITY SETTINGS
# ============================================================

"""
These settings will control how reliability is calculated.

We are intentionally keeping the first version simple.

As we test ARM, these values can be tuned based on
validation experiments.

IMPORTANT:
These are starting configuration values, NOT scientifically
validated final values.
"""

# Number of observations needed before historical statistics
# become reasonably meaningful.
MIN_HISTORY_SAMPLES = 10


# ============================================================
# GATING SETTINGS
# ============================================================

"""
Settings related to dynamic model weighting.

The gating system will eventually produce weights such as:

    Dorsal → 0.18
    Face   → 0.61
    Blood  → 0.21

The weights must eventually satisfy:

    sum(weights) = 1
"""

# Prevent a model from receiving a completely zero weight
# during the initial development phase.

MIN_MODEL_WEIGHT = 0.01


# ============================================================
# DEVELOPMENT SETTINGS
# ============================================================

"""
Development mode allows us to distinguish our prototype
environment from a future production system.
"""

DEVELOPMENT_MODE = True