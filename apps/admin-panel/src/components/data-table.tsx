import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

export type SortState = { key: string; direction: 'asc' | 'desc' } | null

export type Column<T> = {
  key: string
  header: string
  render: (row: T) => React.ReactNode
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right'
  numeric?: boolean
}

export function DataTable<T>({ rows, columns, sort, onSort, getRowKey }: { rows: T[]; columns: Column<T>[]; sort: SortState; onSort: (sort: SortState) => void; getRowKey: (row: T) => string }) {
  const sorted = sort
    ? [...rows].sort((a, b) => {
        const column = columns.find((candidate) => candidate.key === sort.key)
        const left = column?.sortValue?.(a)
        const right = column?.sortValue?.(b)
        if (left === undefined || right === undefined) return 0
        const result = typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right), 'pt-BR', { sensitivity: 'base' })
        return sort.direction === 'asc' ? result : -result
      })
    : rows

  function toggle(column: Column<T>) {
    if (!column.sortValue) return
    if (sort?.key !== column.key) return onSort({ key: column.key, direction: 'asc' })
    if (sort.direction === 'asc') return onSort({ key: column.key, direction: 'desc' })
    onSort(null)
  }

  return <div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-left"><thead className="bg-surface-soft text-[10px] font-normal uppercase tracking-widest text-ink-muted"><tr>{columns.map((column) => <th key={column.key} className={`px-4 py-3 ${column.align === 'right' ? 'text-right' : ''} ${column.numeric ? 'tabular-nums' : ''}`}>{column.sortValue ? <button onClick={() => toggle(column)} className="inline-flex items-center gap-1.5 hover:text-primary">{column.header}{sort?.key === column.key ? sort.direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} /> : <ArrowUpDown size={13} />}</button> : column.header}</th>)}</tr></thead><tbody>{sorted.map((row) => <tr key={getRowKey(row)} className="border-t border-hairline transition-colors duration-150 hover:bg-surface-soft">{columns.map((column) => <td key={column.key} className={`px-4 py-3 ${column.align === 'right' ? 'text-right' : ''} ${column.numeric ? 'tabular-nums' : ''}`}>{column.render(row)}</td>)}</tr>)}</tbody></table></div>
}
