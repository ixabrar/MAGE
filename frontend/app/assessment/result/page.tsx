import { Suspense } from "react";
import AssessmentResultInner from "./AssessmentResultInner";

export default function AssessmentResultPage() {
  return (
    <Suspense fallback={<div className="mt-16 text-sm" style={{ color: "#bcbac9" }}>Loading result…</div>}>
      <AssessmentResultInner />
    </Suspense>
  );
}
