export default function Table({ columns, data, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-primary-600 to-primary-700">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {column.accessor ? column.accessor(row) : row[column.key]}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(row)}
                      className="text-primary-600 hover:text-primary-900 font-semibold"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(row)}
                      className="text-red-600 hover:text-red-900 font-semibold"
                    >
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
}
