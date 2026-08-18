"use client";

export function VariantSelector({
  options, selectedVariantId,
}: { options: { id: string; label: string }[]; selectedVariantId?: string }) {
  return (
    <form method="get" className="max-w-md">
      <select
        name="variantId"
        defaultValue={selectedVariantId}
        onChange={(e) => e.target.form?.requestSubmit()}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      >
        {options.map((v) => (
          <option key={v.id} value={v.id}>{v.label}</option>
        ))}
      </select>
    </form>
  );
}
