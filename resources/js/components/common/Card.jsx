export function Card({ children, className = '' }) {
  return (
    <div className={`h-full rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.16)] dark:border-slate-800/80 dark:bg-slate-950/95 ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({ title, value, icon: Icon, color = 'blue' }) {
  const colorClass = {
    blue: 'from-sky-500 to-cyan-500 text-white',
    green: 'from-emerald-500 to-teal-500 text-white',
    red: 'from-rose-500 to-orange-500 text-white',
    yellow: 'from-amber-400 to-orange-400 text-slate-950',
  };

  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br ${colorClass[color]}`}>
        <Icon className="h-8 w-8" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </Card>
  );
}
