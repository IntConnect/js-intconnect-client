import { useApi } from '@/composables/useApi'

export const roleService = {
  async createRole(payload) {
    const { data, error } = await useApi('/roles')
      .post(payload)
      .json()

    if (error.value) throw error.value

    return data.value
  },

  async getRoles() {
    const { data, error } = await useApi('/roles')
      .get()
      .json()

    if (error.value) throw error.value

    return data.value
  },

  async getRoleById(id) {
    const { data, error } = await useApi(`/roles/${id}`)
      .get()
      .json()

    if (error.value) throw error.value

    return data.value
  },
}
