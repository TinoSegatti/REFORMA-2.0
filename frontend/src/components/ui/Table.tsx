import React from 'react';

interface TableProps {
  columns: string[];
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({ columns, children }) => {
  return (
    <div className="glass-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-white/5">
          <tr>
            {columns.map((column, index) => (
              <th key={index} className="text-left px-4 py-3 font-semibold text-foreground/80">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {children}
        </tbody>
      </table>
    </div>
  );
};

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
}

export const TableRow: React.FC<TableRowProps> = ({ children, className = '' }) => {
  return <tr className={`hover:bg-white/5 transition ${className}`}>{children}</tr>;
};

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export const TableCell: React.FC<TableCellProps> = ({ children, className = '' }) => {
  return <td className={`px-4 py-3 text-foreground/90 ${className}`}>{children}</td>;
};

