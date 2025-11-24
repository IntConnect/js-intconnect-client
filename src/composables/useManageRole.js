import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export const useManageRole = () => {
  const roles = ref([])
  const loading = ref(false)

  const fetchRoles = async () => {
    loading.value = true

    try {
      const { data: response } = await useApi(createUrl('/roles', {}))
        .get()
        .json()


      const res = response.value

      roles.value = res.data ?? []
      loading.value = false
    } catch (err) {
      console.error('Failed to fetch roles:', err)
    }
  }

  return {
    roles,
    loading,
    fetchRoles,
  }
}
