"use client";

import { useTransition } from "react";
import { toggleCompatibility } from "@/lib/actions/admin-actions";

export function CompatibilityToggle({
  variantId, componentId, linked,
}: { variantId: string; componentId: string; linked: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      checked={linked}
      disabled={isPending}
      onChange={() => startTransition(() => toggleCompatibility(variantId, componentId, linked))}
      className="rounded"
    />
  );
}
