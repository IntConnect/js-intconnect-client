import { ref } from 'vue'
import { machineService } from "@/service/machineService"

export const useCreateMachine = () => {
  const loading = ref(false)
  const error = ref(null)

  const createMachine = async payload => {
    try {
      loading.value = true
      error.value = null

      // Validasi dasar
      if (!payload.name || !payload.code) {
        throw new Error('Name dan Code wajib diisi.')
      }

      if (!payload.model) {
        throw new Error('Model wajib diisi.')
      }

      // Kirim data ke API
      return await machineService.createMachine(payload)
    } catch (err) {
      let message = 'Gagal membuat machine baru'

      if (err instanceof Error) {
        message = err.message
      }

      // Jika error dari API backend
      if (err && err.response) {
        const api = err.response

        if (api.data?.message) {
          message = api.data.message
        }

        if (api.data?.details) {
          const details = api.data.details
          if (Array.isArray(details) && details.length) {
            message = details.map(d => d.message).join(', ')
          }
        }

        if (api.status === 409) {
          message = 'Machine code sudah digunakan'
        }

        if (api.status === 400) {
          message = 'Data tidak valid, periksa kembali inputan Anda'
        }
      }

      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  const resetError = () => (error.value = null)

  return {
    createMachine,
    loading,
    error,
    resetError,
  }
}
