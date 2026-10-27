export function Table({ columns, data, loading, onRowClick }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8" role="status" aria-label="Memuat data">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-slate-400">
        Data tidak ditemukan
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="app-table min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-900/80">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 sm:px-5"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-950">
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-3 text-sm text-slate-700 dark:text-slate-200 sm:px-5">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
