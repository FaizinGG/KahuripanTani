export default function PlaceholderPage({ title = 'Halaman', description = 'Bagian ini akan tersedia pada pembaruan berikutnya.' }) {
  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
      <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
      <p className="mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}
