"""
PFM implementation validation.

Tests:
  1.  Single-model identity
  2.  Two-model weighted age
  3.  Three-model weighted age
  4.  Two-model probability mixture
  5.  Missing age bins
  6.  Probability sum == 1
  7.  Weighted confidence
  8.  Confidence changes only fused_confidence, not fused age/distribution
  9.  Empty input
  10. Mismatched lengths
  11. Missing ARM result
  12. Duplicate prediction names
  13. Duplicate ARM names
  14. Negative weights
  15. Weights not summing to 1
  16. Extreme 0.01/0.99 weights
  17. Known hand-calculated fusion case
  18. Single model weight 1.0
"""
from arm.schemas import ModelPrediction
from arm.arm import ARM, ARMModelResult
from arm.pfm import PredictionFusionModule, FusionResult

pfm = PredictionFusionModule()
arm = ARM()

# Build a dorsal history for ARM to produce weights.
for i in range(3):
    arm.add_history('dorsal', 30.0 + i, 30.5 + i*0.1, '18-25', 0.9)
arm.build_profiles()

def pred(name, age_bins, confidence=0.8, predicted_age=30.0):
    return ModelPrediction(model_name=name, predicted_age=predicted_age, confidence=confidence, age_bins=age_bins)

def arm_res(name, weight, reliability=0.8, evidence=0.5):
    return ARMModelResult(model_name=name, reliability=reliability, evidence_strength=evidence, weight=weight, age_bin_reliability={})

print('=== 1. Single-model identity ===')
r1 = pfm.fuse([pred('dorsal', {'18-25': 0.5, '26-35': 0.3, '36-45': 0.2, '46+': 0.0})], [arm_res('dorsal', 1.0)])
print('fused_age_bins:', r1.fused_age_bins)
print('fused_predicted_age:', r1.fused_predicted_age)
print('fused_confidence:', r1.fused_confidence)
print('model_contributions:', r1.model_contributions)
print('identity?', r1.fused_age_bins == {'18-25': 0.5, '26-35': 0.3, '36-45': 0.2, '46+': 0.0} and r1.fused_predicted_age == 30.0 and r1.fused_confidence == 0.8)

print()
print('=== 2. Two-model weighted age ===')
r2 = pfm.fuse([pred('d', {'18-25': 1.0}, predicted_age=30.0), pred('f', {'18-25': 1.0}, predicted_age=40.0)], [arm_res('d', 0.3), arm_res('f', 0.7)])
print('fused_predicted_age:', r2.fused_predicted_age, 'expected 37.0')
print('model_contributions:', r2.model_contributions)

print()
print('=== 3. Three-model weighted age ===')
r3 = pfm.fuse([pred('d', {'18-25': 1.0}, predicted_age=30.0), pred('f', {'18-25': 1.0}, predicted_age=40.0), pred('b', {'18-25': 1.0}, predicted_age=50.0)], [arm_res('d', 0.2), arm_res('f', 0.5), arm_res('b', 0.3)])
print('fused_predicted_age:', r3.fused_predicted_age, 'expected 41.0')
print('model_contributions:', r3.model_contributions)

print()
print('=== 4. Two-model probability mixture ===')
r4 = pfm.fuse([pred('d', {'18-25': 1.0}), pred('f', {'18-25': 0.0, '26-35': 1.0})], [arm_res('d', 0.4), arm_res('f', 0.6)])
print('fused_age_bins:', r4.fused_age_bins)
print('SUM:', sum(r4.fused_age_bins.values()))

print()
print('=== 5. Missing age bins ===')
r5 = pfm.fuse([pred('d', {'18-25': 1.0}), pred('f', {'26-35': 1.0})], [arm_res('d', 0.5), arm_res('f', 0.5)])
print('fused_age_bins:', r5.fused_age_bins)
print('SUM:', sum(r5.fused_age_bins.values()))

print()
print('=== 6. Probability sum == 1 ===')
print('single sum:', abs(sum(r1.fused_age_bins.values()) - 1.0) < 1e-12)
print('two-model sum:', abs(sum(r4.fused_age_bins.values()) - 1.0) < 1e-12)
print('missing bins sum:', abs(sum(r5.fused_age_bins.values()) - 1.0) < 1e-12)

print()
print('=== 7. Weighted confidence ===')
r7 = pfm.fuse([pred('d', {'18-25': 1.0}, confidence=0.3), pred('f', {'18-25': 1.0}, confidence=0.9)], [arm_res('d', 0.4), arm_res('f', 0.6)])
print('fused_confidence:', r7.fused_confidence, 'expected', 0.3*0.4 + 0.9*0.6)

print()
print('=== 8. Confidence changes only fused_confidence ===')
r8a = pfm.fuse([pred('d', {'18-25': 0.5, '26-35': 0.5}, confidence=0.3)], [arm_res('d', 1.0)])
r8b = pfm.fuse([pred('d', {'18-25': 0.5, '26-35': 0.5}, confidence=0.9)], [arm_res('d', 1.0)])
print('same age_bins?', r8a.fused_age_bins == r8b.fused_age_bins)
print('same predicted_age?', r8a.fused_predicted_age == r8b.fused_predicted_age)
print('different confidence?', r8a.fused_confidence != r8b.fused_confidence)

print()
print('=== 9. Empty input ===')
try:
    pfm.fuse([], [])
    print('FAIL: no exception')
except ValueError as e:
    print('ValueError:', str(e))

print()
print('=== 10. Mismatched lengths ===')
try:
    pfm.fuse([pred('d', {'18-25': 1.0})], [arm_res('d', 1.0), arm_res('f', 0.5)])
    print('FAIL: no exception')
except ValueError as e:
    print('ValueError:', str(e))

print()
print('=== 11. Missing ARM result ===')
try:
    pfm.fuse([pred('d', {'18-25': 1.0}), pred('f', {'18-25': 1.0})], [arm_res('d', 1.0)])
    print('FAIL: no exception')
except ValueError as e:
    print('ValueError:', str(e))

print()
print('=== 12. Duplicate prediction names ===')
try:
    pfm.fuse([pred('d', {'18-25': 1.0}), pred('d', {'18-25': 1.0})], [arm_res('d', 0.5), arm_res('d', 0.5)])
    print('FAIL: no exception')
except ValueError as e:
    print('ValueError:', str(e))

print()
print('=== 13. Duplicate ARM names ===')
try:
    pfm.fuse([pred('d', {'18-25': 1.0}), pred('f', {'18-25': 1.0})], [arm_res('d', 0.5), arm_res('d', 0.5)])
    print('FAIL: no exception')
except ValueError as e:
    print('ValueError:', str(e))

print()
print('=== 14. Negative weights ===')
try:
    pfm.fuse([pred('d', {'18-25': 1.0})], [arm_res('d', -0.1)])
    print('FAIL: no exception')
except ValueError as e:
    print('ValueError:', str(e))

print()
print('=== 15. Weights not summing to 1 ===')
try:
    pfm.fuse([pred('d', {'18-25': 1.0})], [arm_res('d', 0.5)])
    print('FAIL: no exception')
except ValueError as e:
    print('ValueError:', str(e))

print()
print('=== 16. Extreme 0.01/0.99 weights ===')
r16 = pfm.fuse([pred('d', {'18-25': 1.0}), pred('f', {'18-25': 1.0})], [arm_res('d', 0.01), arm_res('f', 0.99)])
print('fused_age_bins:', r16.fused_age_bins)
print('SUM:', sum(r16.fused_age_bins.values()))
print('model_contributions:', r16.model_contributions)

print()
print('=== 17. Known hand-calculated fusion case ===')
# predictions:
#   d: 18-25=0.3, 26-35=0.7, weight=0.2
#   f: 18-25=0.8, 26-35=0.2, weight=0.8
# raw:
#   18-25 = 0.2*0.3 + 0.8*0.8 = 0.06 + 0.64 = 0.70
#   26-35 = 0.2*0.7 + 0.8*0.2 = 0.14 + 0.16 = 0.30
# fused age = 0.2*30 + 0.8*40 = 38.0
# fused conf = 0.2*0.3 + 0.8*0.9 = 0.06 + 0.72 = 0.78
r17 = pfm.fuse(
    [pred('d', {'18-25': 0.3, '26-35': 0.7}, confidence=0.3, predicted_age=30.0),
     pred('f', {'18-25': 0.8, '26-35': 0.2}, confidence=0.9, predicted_age=40.0)],
    [arm_res('d', 0.2), arm_res('f', 0.8)]
)
print('fused_age_bins:', r17.fused_age_bins)
print('fused_predicted_age:', r17.fused_predicted_age, 'expected 38.0')
print('fused_confidence:', r17.fused_confidence, 'expected 0.78')
print('model_contributions:', r17.model_contributions)

print()
print('=== 18. Single model weight 1.0 ===')
r18 = pfm.fuse([pred('d', {'18-25': 1.0})], [arm_res('d', 1.0)])
print('model_contributions:', r18.model_contributions)
print('weight == 1.0?', r18.model_contributions.get('d') == 1.0)

print()
print('=== ALL PFM TESTS COMPLETE ===')
