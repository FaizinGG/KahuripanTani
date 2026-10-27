import { useId } from 'react';

export function FormInput({
  label,
  type = 'text',
  error,
  required = false,
  ...props
}) {
  const generatedId = useId();
  const fieldId = props.id || generatedId;

  return (
    <div className="mb-4">
      <label htmlFor={fieldId} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={fieldId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={`min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-950 ${
          error ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
        }`}
        {...props}
      />
      {error && <p id={`${fieldId}-error`} className="mt-1 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

export function FormSelect({
  label,
  options = [],
  error,
  required = false,
  ...props
}) {
  const generatedId = useId();
  const fieldId = props.id || generatedId;

  return (
    <div className="mb-4">
        <label htmlFor={fieldId} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={fieldId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={`min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-950 ${
          error ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
        }`}
        {...props}
      >
        <option value="">Pilih {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p id={`${fieldId}-error`} className="mt-1 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

export function FormTextarea({
  label,
  error,
  required = false,
  ...props
}) {
  const generatedId = useId();
  const fieldId = props.id || generatedId;

  return (
    <div className="mb-4">
      <label htmlFor={fieldId} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={fieldId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-950 ${
          error ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
        }`}
        rows="4"
        {...props}
      ></textarea>
      {error && <p id={`${fieldId}-error`} className="mt-1 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
