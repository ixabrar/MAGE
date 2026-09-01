"""
gating.py
=========

PURPOSE:
Implement the dynamic weighting / gating component.

CORE IDEA:
The Fusion Layer should NOT always use fixed weights.

Instead, the system should eventually learn:

    "For THIS input, which model should I trust more?"

Phase 1:
    Deterministic reliability-based weighting.

Phase 2:
    Richer input-dependent weighting.

Phase 3:
    Optional trainable gating network.

IMPORTANT:
This implementation guarantees that:

    - reliability values are non-negative
    - weights are non-negative
    - weights sum to 1.0
    - single-model input gets weight 1.0
    - all-zero reliabilities fall back to equal weights
    - MIN_MODEL_WEIGHT is genuinely enforced
    - relative reliability is preserved where possible
    - model ordering remains deterministic
"""

from typing import Dict

from .config import MIN_MODEL_WEIGHT


class GatingNetwork:
    """
    Deterministic reliability-to-weight converter.

    Converts per-model reliability scores into normalized fusion
    weights.

    The minimum model weight is guaranteed after normalization.
    """

    def calculate_weights(
        self,
        reliabilities: Dict[str, float],
    ) -> Dict[str, float]:
        """
        Convert reliability scores into normalized weights.

        Rules:
            - reliability values must be non-negative
            - weights must be non-negative
            - weights must sum to approximately 1.0
            - no fixed model weights
            - works with 1, 2, or 3+ models
            - single model gets weight 1.0
            - all-zero reliabilities fall back to equal weights
            - MIN_MODEL_WEIGHT is genuinely enforced

        Example:

            Input:
                {
                    "dorsal": 0.2,
                    "face": 0.8,
                    "blood": 0.5
                }

            Output will be reliability-proportional,
            subject to the configured minimum weight floor.
        """

        # ---------------------------------------------------------
        # Empty input
        # ---------------------------------------------------------

        if not reliabilities:
            return {}

        # ---------------------------------------------------------
        # Validate reliability values
        # ---------------------------------------------------------

        for model_name, reliability in reliabilities.items():

            if reliability < 0:
                raise ValueError(
                    f"Reliability for {model_name} must be non-negative. "
                    f"Got: {reliability}"
                )

        model_names = list(reliabilities.keys())

        # ---------------------------------------------------------
        # Single-model case
        # ---------------------------------------------------------
        #
        # With only one model, it must receive all available
        # fusion weight regardless of its reliability score.
        #

        if len(model_names) == 1:
            return {
                model_names[0]: 1.0
            }

        # ---------------------------------------------------------
        # Calculate total reliability
        # ---------------------------------------------------------

        total_reliability = sum(
            reliabilities.values()
        )

        # ---------------------------------------------------------
        # All-zero fallback
        # ---------------------------------------------------------
        #
        # If every model has zero reliability, there is no
        # information that allows us to prefer one model.
        # Therefore use equal weights.
        #

        if total_reliability == 0.0:

            equal_weight = (
                1.0 / len(model_names)
            )

            return {
                name: equal_weight
                for name in model_names
            }

        # ---------------------------------------------------------
        # Validate minimum weight configuration
        # ---------------------------------------------------------

        min_weight = MIN_MODEL_WEIGHT

        if min_weight < 0:
            raise ValueError(
                "MIN_MODEL_WEIGHT cannot be negative"
            )

        # It is mathematically impossible for every model to
        # receive at least min_weight if:
        #
        #     min_weight * number_of_models > 1
        #

        if min_weight * len(model_names) > 1.0:
            raise ValueError(
                f"MIN_MODEL_WEIGHT={min_weight} is impossible "
                f"for {len(model_names)} models."
            )

        # ---------------------------------------------------------
        # No minimum floor
        # ---------------------------------------------------------
        #
        # If MIN_MODEL_WEIGHT is zero, simply normalize reliability.
        #

        if min_weight == 0:

            return {
                name: reliability / total_reliability
                for name, reliability in reliabilities.items()
            }

        # ---------------------------------------------------------
        # Reliability-based lower-bounded normalization
        # ---------------------------------------------------------
        #
        # We progressively lock models that would otherwise receive
        # less than MIN_MODEL_WEIGHT.
        #
        # Example:
        #
        #     dorsal = 0.001
        #     face   = 0.999
        #
        # Raw weights:
        #
        #     dorsal = 0.001
        #     face   = 0.999
        #
        # Instead of simply clamping and then renormalizing
        # (which can push dorsal below the floor again), we lock
        # dorsal at 0.01 and redistribute the remaining 0.99
        # to face.
        #

        weights: Dict[str, float] = {}

        # Use a list rather than a set so that model ordering remains
        # deterministic and follows the input dictionary.
        unfixed = list(model_names)

        # Total weight that has not yet been assigned.
        remaining_mass = 1.0

        while unfixed:

            # -----------------------------------------------------
            # Calculate reliability of currently unfixed models
            # -----------------------------------------------------

            remaining_reliability = sum(
                reliabilities[name]
                for name in unfixed
            )

            # -----------------------------------------------------
            # If all remaining reliabilities are zero
            # -----------------------------------------------------
            #
            # There is no reliability information left with which
            # to distinguish the remaining models.
            #
            # Therefore distribute the remaining mass equally.
            #

            if remaining_reliability == 0.0:

                equal_weight = (
                    remaining_mass / len(unfixed)
                )

                for name in unfixed:
                    weights[name] = equal_weight

                break

            changed = False

            # -----------------------------------------------------
            # Find models that would fall below the floor
            # -----------------------------------------------------
            #
            # Work on a copy because models may be removed from
            # unfixed during this loop.
            #

            for name in unfixed.copy():

                proposed_weight = (
                    remaining_mass
                    * reliabilities[name]
                    / remaining_reliability
                )

                # This model would violate the minimum weight.
                # Lock it at the minimum.
                if proposed_weight < min_weight:

                    weights[name] = min_weight

                    remaining_mass -= min_weight

                    unfixed.remove(name)

                    changed = True

            # -----------------------------------------------------
            # All remaining models satisfy the floor
            # -----------------------------------------------------
            #
            # Distribute the remaining mass proportionally according
            # to their reliability.
            #

            if not changed:

                for name in unfixed:

                    weights[name] = (
                        remaining_mass
                        * reliabilities[name]
                        / remaining_reliability
                    )

                break

        # ---------------------------------------------------------
        # Final normalization
        # ---------------------------------------------------------
        #
        # Protect against tiny floating-point errors.
        #
        # Example:
        #
        #     0.1 + 0.2 + 0.7
        #
        # may internally differ from exactly 1.0.
        #

        total_weight = sum(
            weights.values()
        )

        if total_weight > 0.0:

            weights = {
                name: weight / total_weight
                for name, weight in weights.items()
            }

        return weights