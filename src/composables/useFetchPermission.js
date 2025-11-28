import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useFetchPermission = () => {
  const permissions = ref([])
  const totalItems = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const totalPages = ref(0)
  const loading = ref(false)

  const fetchPermissionsPagination = async ({ page, size, query, sort, order }) => {
    loading.value = true

    try {

      const { data: response } = await useApi(createUrl('/permissions/pagination', {
        query: {
          page,
          size,
          query,
          sort,
          order,
        },
      }))
        .get()
        .json()


      const res = response.value

      console.log(res)
      permissions.value = res.data ?? []
      totalItems.value = res.pagination.total_items
      currentPage.value = res.pagination.current_page
      pageSize.value = res.pagination.page_size
      totalPages.value = res.pagination.total_pages
      loading.value = false
    } catch (err) {
      console.error('Failed to fetch permissions:', err)
    }
  }

  const fetchPermissions = async () => {
    loading.value = true

    try {

      const { data: response } = await useApi(createUrl('/permissions', {}))
        .get()
        .json()


      const res = response.value

      console.log(res)
      permissions.value = res.data ?? []
     
      loading.value = false
    } catch
    (err) {
      console.error('Failed to fetch permissions:', err)
    }
  }

  return {
    permissions,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    loading,
    fetchPermissions,
  }
}
