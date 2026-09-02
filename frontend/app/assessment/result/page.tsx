import { Suspense } from "react";
import AssessmentResultInner from "./AssessmentResultInner";

export default function AssessmentResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-sm text-[#bcbac9]">Loading assessment results…</div>}>
      <AssessmentResultInner />
    </Suspense>
  );
}
