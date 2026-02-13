import React from 'react';

const Table = ({ 
  columns, 
  data, 
  emptyMessage = 'Nessun dato disponibile',
  striped = true,
  hover = true,
  compact = false,
  className = ''
}) => {
  return (
    <div className="table-container">
      <table className={`table ${striped ? 'table-striped' : ''} ${hover ? 'table-hover' : ''} ${compact ? 'table-compact' : ''} ${className}`}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} style={column.style || {}}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <td key={colIndex} style={column.cellStyle || {}}>
                    {column.render ? column.render(row) : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center py-8">
                <div className="empty-state">
                  {emptyMessage}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;