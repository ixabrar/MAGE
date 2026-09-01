from arm.gating import GatingNetwork
from arm.config import MIN_MODEL_WEIGHT
from arm.reliability import ReliabilityCalculator
from arm.error_profile import ErrorProfileBuilder
from arm.arm import ARM
from arm.schemas import ModelPrediction

def make_pred(model_name, age_bins, confidence):
    return ModelPrediction(model_name=model_name, predicted_age=28.0, confidence=confidence, age_bins=age_bins)

# Build a profile with strong evidence so historical reliability is clearly above 0.5+0.5*conf
# Need ~40 samples for evidence_score ~0.8, and low MAE for performance_score ~1.0
arm_strong = ARM()
import random
random.seed(42)
for i in range(40):
    actual = 30.0 + random.uniform(-1, 1)
    predicted = actual + random.uniform(-0.2, 0.2)
    arm_strong.add_history('dorsal', actual, predicted, '18-25', 0.9)
arm_strong.build_profiles()

r_hist = arm_strong.compute_weights([make_pred('dorsal', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, 1.0)])[0].reliability
print(f'Strong history reliability (conf=1.0): {r_hist:.6f}')

for conf in [0.0, 0.5, 1.0]:
    r = arm_strong.compute_weights([make_pred('dorsal', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, conf)])[0]
    cap = 0.5 + 0.5 * conf
    print(f'  conf={conf}: cap={cap:.4f}, reliability={r.reliability:.6f}, weight={r.weight:.6f}')

# Asymmetric confidence: both models have same strong history, different confidence
arm_asym = ARM()
for i in range(40):
    actual = 30.0 + random.uniform(-1, 1)
    predicted = actual + random.uniform(-0.2, 0.2)
    arm_asym.add_history('dorsal', actual, predicted, '18-25', 0.9)
    arm_asym.add_history('face', actual, predicted, '18-25', 0.9)
arm_asym.build_profiles()

print()
print('=== Asymmetric confidence two-model case ===')
for conf_d, conf_f in [(0.9, 0.9), (0.2, 0.9), (0.0, 0.9)]:
    results = arm_asym.compute_weights([
        make_pred('dorsal', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, conf_d),
        make_pred('face', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, conf_f),
    ])
    print(f'  dorsal conf={conf_d}, face conf={conf_f}: dorsal weight={results[0].weight:.6f}, face weight={results[1].weight:.6f}')

# MIN_MODEL_WEIGHT check with strong history + low confidence
arm_mw = ARM()
for i in range(40):
    actual = 30.0 + random.uniform(-1, 1)
    predicted = actual + random.uniform(-0.2, 0.2)
    arm_mw.add_history('dorsal', actual, predicted, '18-25', 0.9)
    arm_mw.add_history('face', actual, predicted, '18-25', 0.9)
    arm_mw.add_history('blood', actual, predicted, '18-25', 0.9)
arm_mw.build_profiles()

results_mw = arm_mw.compute_weights([
    make_pred('dorsal', {'18-25': 1.0}, 0.0),
    make_pred('face', {'18-25': 1.0}, 0.0),
    make_pred('blood', {'18-25': 1.0}, 0.0),
])
weights_mw = [r.weight for r in results_mw]
print(f'All strong history + conf=0.0 weights: {weights_mw}')
print(f'MIN_MODEL_WEIGHT enforced? {all(w >= 0.01 - 1e-12 for w in weights_mw)}')

# Poor model (MAE high, few samples) + high confidence - should stay poor
arm_poor = ARM()
for i in range(3):
    arm_poor.add_history('dorsal', 20.0 + i, 35.0 + i, '18-25', 0.7)
arm_poor.build_profiles()

r_poor_highconf = arm_poor.compute_weights([make_pred('dorsal', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, 1.0)])[0].reliability
print(f'Poor model + high conf: {r_poor_highconf:.6f} (not auto-trustworthy)')
