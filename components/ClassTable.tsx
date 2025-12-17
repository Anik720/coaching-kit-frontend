
import { Button } from "./Button";
import { DeleteIcon, EditIcon } from "./Icons";
import { ClassType } from "./types";



interface ClassTableProps {
  classes: ClassType[];
  onEdit: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}

export default function ClassTable({ classes, onEdit, onDelete }: ClassTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              #
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Class Name
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {classes.map((cls, idx) => (
            <tr key={cls.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm text-gray-900">{idx + 1}</td>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{cls.name}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 p-1"
                    onClick={() => onEdit(cls.id, cls.name)}
                  >
                    <EditIcon className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-800 p-1"
                    onClick={() => onDelete(cls.id)}
                  >
                    <DeleteIcon className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}