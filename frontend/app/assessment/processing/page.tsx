import { Suspense } from "react";
import AssessmentProcessingInner from "./AssessmentProcessingInner";

export default function AssessmentProcessingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-sm text-[#bcbac9]">Initializing processing pipeline…</div>}>
      <AssessmentProcessingInner />
    </Suspense>
  );
}
