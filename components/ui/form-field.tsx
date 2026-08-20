export function FormField({
  label, name, type = "text", placeholder, required, defaultValue, step,
}: {
  label: string; name: string; type?: string; placeholder?: string;
  required?: boolean; defaultValue?: string | number; step?: string;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-700">{label}</label>
      <input name={name} type={type} placeholder={placeholder} required={required}
        defaultValue={defaultValue} step={step}
        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder:text-slate-300" />
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mb-4 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl px-3 py-2">
      {message}
    </p>
  );
}
