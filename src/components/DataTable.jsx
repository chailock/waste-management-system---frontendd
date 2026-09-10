import React from 'react';
import Loading from './Loading';

/**
 * Generic, reusable data table.
 *
 * columns: [{ key, label, render?(row) }]
 * data: array of row objects
 * actions?(row): ReactNode — rendered in the trailing "Actions" column
 */
export default function DataTable({ columns, data, loading, emptyMessage = 'No records found.', actions }) {
  if (loading) {
    return <Loading label="Loading data…" />;
  }

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          padding: '2.5rem 1rem',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius)',
          background: '#fafbfa',
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
        <thead>
          <tr style={{ background: '#f4f7f5', textAlign: 'left' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '0.7rem 0.9rem',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  borderBottom: '1px solid var(--color-border)',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.label}
              </th>
            ))}
            {actions && (
              <th style={{ padding: '0.7rem 0.9rem', borderBottom: '1px solid var(--color-border)' }}>
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row.id ?? idx}
              style={{
                borderBottom: idx === data.length - 1 ? 'none' : '1px solid var(--color-border)',
                background: '#fff',
              }}
            >
              {columns.map((col) => (
                <td key={col.key} style={{ padding: '0.65rem 0.9rem', verticalAlign: 'middle' }}>
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
              {actions && (
                <td style={{ padding: '0.65rem 0.9rem', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>{actions(row)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
