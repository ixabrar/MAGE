import { Suspense } from "react";
import AssessmentProcessingInner from "./AssessmentProcessingInner";

export default function AssessmentProcessingPage() {
  return (
    <Suspense fallback={<div className="mt-16 text-sm" style={{ color: "#bcbac9" }}>Loading processing step…</div>}>
      <AssessmentProcessingInner />
    </Suspense>
  );
}
