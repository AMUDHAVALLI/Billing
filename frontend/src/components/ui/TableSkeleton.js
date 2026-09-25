export default function TableSkeleton({ columns = 5, rows = 6 }) {
  return (
    <div className="w-full max-w-full overflow-x-auto bg-white rounded-2xl shadow-xl border border-gray-100">
      <table className="w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="px-4 py-4">
                  <div
                    className="h-3 bg-gray-100 rounded animate-pulse"
                    style={{ width: `${50 + ((r * 7 + c * 13) % 40)}%` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
