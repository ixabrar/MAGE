import { Suspense } from "react";
import AssessmentResultInner from "./AssessmentResultInner";

export default function AssessmentResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black px-6 py-16 text-sm text-white" style={{ color: "#bcbac9" }}>Loading result…</div>}>
      <AssessmentResultInner />
    </Suspense>
  );
}
