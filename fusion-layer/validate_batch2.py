from arm.gating import GatingNetwork
from arm.config import MIN_MODEL_WEIGHT
from arm.reliability import ReliabilityCalculator
from arm.error_profile import ModelErrorProfile, ErrorProfileBuilder
from arm.arm import ARM
from arm.schemas import ModelPrediction

gating = GatingNetwork()
print('MIN_MODEL_WEIGHT:', MIN_MODEL_WEIGHT)
print()

print('=== BATCH 1 REGRESSION ===')

# 1. Extreme 2-model
w = gating.calculate_weights({'dorsal': 0.001, 'face': 0.999})
print('Extreme 2-model:', w, 'SUM:', sum(w.values()), 'all>=0.01?', all(v >= 0.01 - 1e-12 for v in w.values()))

# 2. Extreme 3-model
w = gating.calculate_weights({'dorsal': 0.001, 'face': 0.001, 'blood': 0.998})
print('Extreme 3-model:', w, 'SUM:', sum(w.values()), 'all>=0.01?', all(v >= 0.01 - 1e-12 for v in w.values()))

# 3. Normal case
w = gating.calculate_weights({'dorsal': 0.2, 'face': 0.8, 'blood': 0.5})
print('Normal case:', w, 'SUM:', sum(w.values()), 'proportional?', abs(w['face']/w['dorsal'] - 0.8/0.2) < 0.01)

# 4. Single model
w = gating.calculate_weights({'dorsal': 0.2})
print('Single model:', w, 'weight==1.0?', w['dorsal'] == 1.0)

# 5. All-zero
w = gating.calculate_weights({'dorsal': 0.0, 'face': 0.0, 'blood': 0.0})
print('All-zero:', w, 'SUM:', sum(w.values()), 'equal?', all(abs(v - 1/3) < 1e-12 for v in w.values()))

# 6. Negative reliability
try:
    gating.calculate_weights({'dorsal': -0.1, 'face': 0.5})
    print('Negative: FAIL - no exception')
except ValueError:
    print('Negative reliability: ValueError raised')

print()
print('=== BATCH 2 CONFIDENCE TESTS ===')

def make_pred(model_name, age_bins, confidence):
    return ModelPrediction(model_name=model_name, predicted_age=28.0, confidence=confidence, age_bins=age_bins)

# Build profile: 18-25: MAE 10, 3 samples; 36-45: MAE 1, 3 samples
arm = ARM()
for i in range(3):
    arm.add_history('dorsal', 20.0 + i, 30.0 + i, '18-25', 0.7)
for i in range(3):
    arm.add_history('dorsal', 36.0 + i*2, 37.0 + i*2, '36-45', 0.9)
arm.build_profiles()

# Test: dorsal with all weight on 18-25 (poor performance)
base = arm.compute_weights([make_pred('dorsal', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, 1.0)])[0].reliability
print(f'Dorsal baseline (conf=1.0, all 18-25): reliability={base:.6f}')

for conf in [0.0, 0.5, 1.0]:
    r = arm.compute_weights([make_pred('dorsal', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, conf)])[0]
    print(f'  conf={conf}: reliability={r.reliability:.6f}, weight={r.weight:.6f}')

# Good history (MAE ~0.1) + confidence sweep
arm2 = ARM()
for i in range(3):
    arm2.add_history('dorsal', 30.0 + i, 30.5 + i*0.1, '18-25', 0.9)
arm2.build_profiles()

r_good_conf1 = arm2.compute_weights([make_pred('dorsal', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, 1.0)])[0].reliability
print(f'Good history (MAE~0.1) conf=1.0: {r_good_conf1:.6f}')

r_good_conf0 = arm2.compute_weights([make_pred('dorsal', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, 0.0)])[0].reliability
print(f'Good history (MAE~0.1) conf=0.0: {r_good_conf0:.6f} (expected 0.5)')

r_good_conf05 = arm2.compute_weights([make_pred('dorsal', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, 0.5)])[0].reliability
print(f'Good history (MAE~0.1) conf=0.5: {r_good_conf05:.6f} (expected ~0.75 capped)')

# Poor history + conf 0 / 1 should be unchanged
arm3 = ARM()
for i in range(3):
    arm3.add_history('dorsal', 20.0 + i, 35.0 + i, '18-25', 0.7)  # MAE ~15
arm3.build_profiles()

r_poor_conf0 = arm3.compute_weights([make_pred('dorsal', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, 0.0)])[0].reliability
r_poor_conf1 = arm3.compute_weights([make_pred('dorsal', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, 1.0)])[0].reliability
print(f'Poor history (MAE~15) conf=0.0: {r_poor_conf0:.6f}')
print(f'Poor history (MAE~15) conf=1.0: {r_poor_conf1:.6f}')
print(f'Poor model unchanged by confidence? {abs(r_poor_conf0 - r_poor_conf1) < 1e-10}')

# Asymmetric confidence two-model case
arm4 = ARM()
for i in range(3):
    arm4.add_history('dorsal', 30.0 + i, 30.5 + i*0.1, '18-25', 0.9)
    arm4.add_history('face', 30.0 + i, 30.5 + i*0.1, '18-25', 0.9)
arm4.build_profiles()

pred_low = make_pred('dorsal', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, 0.2)
pred_high = make_pred('face', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, 0.9)
results = arm4.compute_weights([pred_low, pred_high])
print(f'Asymmetric conf: dorsal(conf=0.2) reliability={results[0].reliability:.6f}, weight={results[0].weight:.6f}')
print(f'Asymmetric conf: face(conf=0.9) reliability={results[1].reliability:.6f}, weight={results[1].weight:.6f}')
print(f'Low-conf model gets lower weight? {results[0].weight < results[1].weight}')

# Single model with confidence variation
r_single_low = arm4.compute_weights([make_pred('dorsal', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, 0.2)])[0]
r_single_high = arm4.compute_weights([make_pred('dorsal', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, 0.9)])[0]
print(f'Single model conf=0.2: weight={r_single_low.weight}, reliability={r_single_low.reliability:.6f}')
print(f'Single model conf=0.9: weight={r_single_high.weight}, reliability={r_single_high.reliability:.6f}')
print(f'Single model weight always 1.0? {r_single_low.weight == 1.0 and r_single_high.weight == 1.0}')

# No-history model with confidence
arm5 = ARM()
arm5.build_profiles()
r_nohist = arm5.compute_weights([make_pred('unknown', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, 0.3)])[0]
print(f'No-history conf=0.3: reliability={r_nohist.reliability:.6f} (expected 0.5)')
r_nohist2 = arm5.compute_weights([make_pred('unknown', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, 0.0)])[0]
print(f'No-history conf=0.0: reliability={r_nohist2.reliability:.6f} (expected 0.5)')

# Confidence sweep stays in [0,1]
sweep_ok = True
for conf in [0.0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0]:
    r = arm.compute_weights([make_pred('dorsal', {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, conf)])[0]
    if not (0.0 <= r.reliability <= 1.0):
        sweep_ok = False
        print(f'Sweep FAIL at conf={conf}: reliability={r.reliability}')
print(f'Confidence sweep [0,1] valid? {sweep_ok}')

# MIN_MODEL_WEIGHT enforced with low confidence
arm6 = ARM()
for i in range(3):
    arm6.add_history('dorsal', 20.0 + i, 30.0 + i, '18-25', 0.7)
    arm6.add_history('face', 20.0 + i, 30.0 + i, '18-25', 0.7)
    arm6.add_history('blood', 20.0 + i, 30.0 + i, '18-25', 0.7)
arm6.build_profiles()

res_all_low = arm6.compute_weights([make_pred(m, {'18-25': 1.0, '26-35': 0.0, '36-45': 0.0, '46+': 0.0}, 0.0) for m in ['dorsal', 'face', 'blood']])
weights_all_low = [r.weight for r in res_all_low]
print(f'All low conf weights: {weights_all_low}')
print(f'All low conf MIN_MODEL_WEIGHT enforced? {all(w >= 0.01 - 1e-12 for w in weights_all_low)}')

# Changing confidence actually changes weight in multi-model case
arm7 = ARM()
for i in range(3):
    arm7.add_history('dorsal', 30.0 + i, 30.5 + i*0.1, '18-25', 0.9)
    arm7.add_history('face', 30.0 + i, 30.5 + i*0.1, '18-25', 0.9)
arm7.build_profiles()

r_d_high = arm7.compute_weights([make_pred('dorsal', {'18-25': 1.0}, 0.9), make_pred('face', {'18-25': 1.0}, 0.9)])[0]
r_d_low = arm7.compute_weights([make_pred('dorsal', {'18-25': 1.0}, 0.2), make_pred('face', {'18-25': 1.0}, 0.9)])[0]
print(f'Confidence change affects weight? dorsal high={r_d_high.weight:.4f}, dorsal low={r_d_low.weight:.4f}')

print()
print('=== BATCH 1 REMAINING CHECKS ===')
# Evidence-aware
builder = ErrorProfileBuilder()
for i in range(3):
    builder.record_prediction('dorsal', 20.0+i, 30.0+i, '18-25', 0.7)
for i in range(3):
    builder.record_prediction('dorsal', 36.0+i*2, 37.0+i*2, '36-45', 0.9)
profile = builder.build_profile('dorsal')
rc = ReliabilityCalculator()
print('Missing bin 26-35:', rc.calculate_evidence_aware_score(profile, '26-35'))

# Empty predictions
results_empty = arm.compute_weights([])
print('Empty predictions:', results_empty)

print('All tests completed.')
