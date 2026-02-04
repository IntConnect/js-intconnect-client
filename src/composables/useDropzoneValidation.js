import { ref } from 'vue'

export function useDropzoneValidation(options = {}) {
  const {
    resetFilesOnError = true,
  } = options

  // 🔴 error sekarang OBJECT
  const errors = ref({})

  function handleFileRejected(field, rejection) {
    if (!field || !rejection) return

    errors.value[field] = {
      code: rejection.type,
      message: mapErrorMessage(rejection.type, rejection.message),
      raw: rejection,
    }

  }

  function clearError(field) {
    if (!field) return
    delete errors.value[field]
  }

  function clearAllErrors() {
    errors.value = {}
  }

  return {
    errors,
    handleFileRejected,
    clearError,
    clearAllErrors,
  }
}

/* =========================
   ERROR MAPPER
========================= */
function mapErrorMessage(code, fallback) {
  console.log(code, fallback)
  switch (code) {
  case 'file-too-large':
    return 'The file size exceeds the allowed limit.'
  case 'file-invalid-type':
    return 'The selected file type is not supported.'
  case 'too-many-files':
    return 'You have selected more files than allowed.'
  default:
    return fallback || 'File upload failed.'
  }
}
