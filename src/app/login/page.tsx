import { Suspense } from "react";

import { SignInForm } from "@/components/auth-forms";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
