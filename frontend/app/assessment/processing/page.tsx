import { Suspense } from "react";
import AssessmentProcessingInner from "./AssessmentProcessingInner";

export default function AssessmentProcessingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black px-6 py-16 text-sm text-white" style={{ color: "#bcbac9" }}>Loading processing step…</div>}>
      <AssessmentProcessingInner />
    </Suspense>
  );
}
