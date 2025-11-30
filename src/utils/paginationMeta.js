export const paginationMeta = (options, total) => {
  const start = (options.page - 1) * options.itemsPerPage + 1
  const end = Math.min(options.page * options.itemsPerPage, total)

  return `Showing ${total === 0 ? 0 : start} to ${end} of ${total} entries`
}

export const applyPaginationResponse = ({
  entries,
  totalItems,
  currentPage,
  pageSize,
  totalPages,
}, res) => {
  entries.value = res.entries ?? []
  totalItems.value = res.pagination.total_items
  currentPage.value = res.pagination.current_page
  pageSize.value = res.pagination.page_size
  totalPages.value = res.pagination.total_pages
}
