// -----------------------------
// Handle API error (unchanged logic, only formatted cleaner)
// -----------------------------
export function handleApiError(apiError, targets = {}) {
  if (!apiError?.value) return { success: true }

  const err = apiError.value
  const errorBlock = err.error || {}

  const statusCode = errorBlock.code || err.status || err.statusCode
  const message = errorBlock.message || err.message || 'An unexpected error occurred'
  const details = errorBlock.details || null

  const formErrors = targets.formErrors || null
  const generalError = targets.errorMessage || null

  // 🔴 Validation Error
  if (statusCode === '2' && details) {
    if (formErrors) formErrors.value = details

    return { success: false, type: 'validation', errors: details }
  }

  // 🔶 General error
  if (generalError) generalError.value = message

  return { success: false, type: 'error', message }
}
