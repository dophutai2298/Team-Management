import { Suspense } from "react";

import { VerifyEmailForm } from "@/components/auth-forms";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
