"use client";

import { useActionState, useEffect } from "react";
import { saveDashboardDisciplines } from "@/app/actions/dashboard-preferences";
import { withSiteBasePath } from "@/lib/site-paths.mjs";

const INITIAL_STATE = { status: "idle" } as const;

type PreferencesFormProps = {
  children: React.ReactNode;
};

export function PreferencesForm({ children }: PreferencesFormProps) {
  const [state, formAction] = useActionState(
    saveDashboardDisciplines,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.status === "success") {
      window.location.assign(withSiteBasePath("/dashboard"));
    }
  }, [state.status]);

  return (
    <form
      action={formAction}
      className="mt-6 rounded-3xl border p-5 sm:p-7"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
    >
      {children}
    </form>
  );
}
