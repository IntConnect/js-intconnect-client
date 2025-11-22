import { useApi } from '@/composables/useApi'

export const machineService = {
  async createMachine(payload) {
    const { data, error } = await useApi('/machines')
      .post(payload)
      .json()

    if (error.value) throw error.value

    return data.value
  },

  async getMachines() {
    const { data, error } = await useApi('/machines')
      .get()
      .json()

    if (error.value) throw error.value

    return data.value
  },

  async getMachineById(id) {
    const { data, error } = await useApi(`/machines/${id}`)
      .get()
      .json()

    if (error.value) throw error.value

    return data.value
  },
}
