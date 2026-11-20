import { ReactNode } from "react";

type Column<T> = {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  render?: (item: T) => ReactNode;
};

type AdminTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
};

export default function AdminTable<T>({ columns, data, keyExtractor }: AdminTableProps<T>) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-sm font-semibold text-gray-700 ${
                    column.align === "center"
                      ? "text-center"
                      : column.align === "right"
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={keyExtractor(item)} className="hover:bg-gray-50 transition-colors">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 text-sm text-gray-800 ${
                      column.align === "center"
                        ? "text-center"
                        : column.align === "right"
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    {column.render
                      ? column.render(item)
                      : String((item as any)[column.key] || "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
