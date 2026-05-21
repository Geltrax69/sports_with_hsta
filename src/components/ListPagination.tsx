type Props = {
  page: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function ListPagination({ page, totalItems, pageSize, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = Math.min(safePage * pageSize, totalItems)

  if (totalItems <= pageSize) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-gray-200 mt-6">
      <p className="text-sm font-medium text-gray-700">
        Showing {start}–{end} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="px-3 py-1.5 rounded-lg border-2 border-gray-300 text-gray-900 font-bold disabled:opacity-40 hover:bg-gray-50"
        >
          Previous
        </button>
        <span className="text-sm font-bold text-gray-800 px-2">
          Page {safePage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="px-3 py-1.5 rounded-lg border-2 border-gray-300 text-gray-900 font-bold disabled:opacity-40 hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
