interface PageHeaderProps {
  title: string;
  action?: React.ReactNode;
  description?: string;
}

export function PageHeader({ title, action, description }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="text-gray-600 mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}