// 👉 IsEmpty
export const isEmpty = value => {
  if (value === null || value === undefined || value === '') return true

  return !!(Array.isArray(value) && value.length === 0)
}

// 👉 IsNullOrUndefined
export const isNullOrUndefined = value => {
  return value === null || value === undefined
}

// 👉 IsEmptyArray
export const isEmptyArray = arr => {
  return Array.isArray(arr) && arr.length === 0
}

// 👉 IsObject
export const isObject = obj => obj !== null && !!obj && typeof obj === 'object' && !Array.isArray(obj)

// 👉 IsToday
export const isToday = date => {
  const today = new Date()

  return (date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear())
}

/**
 * Convert a plain object to FormData
 * @param {Object} data - JSON object to convert
 * @param {FormData} [form] - FormData instance (for recursion)
 * @param {string} [namespace] - Key prefix for nested fields
 * @returns {FormData}
 */
export function jsonToFormData(data, form = new FormData(), namespace = '') {
  for (let property in data) {
    if (!data.hasOwnProperty(property)) continue

    const formKey = namespace ? `${namespace}.${property}` : property
    const value = data[property]

    if (value instanceof File) {
      // Single file
      form.append(formKey, value)
    } else if (Array.isArray(value)) {
      // Array: could be files or values
      value.forEach((item, index) => {
        if (item instanceof File) {
          form.append(`${formKey}[${index}]`, item)
        } else if (typeof item === 'object' && item !== null) {
          jsonToFormData(item, form, `${formKey}[${index}]`)
        } else {
          form.append(`${formKey}[${index}]`, item)
        }
      })
    } else if (typeof value === 'object' && value !== null) {
      // Nested object
      jsonToFormData(value, form, formKey)
    } else if (value !== undefined && value !== null) {
      // Primitive value
      form.append(formKey, value)
    }
  }

  return form
}


/**
 * Parse JWT token and return payload as JSON object
 * @param {string} token - JWT token
 * @returns {object|null} Parsed payload or null if invalid
 */
export function parseJwt(token) {
  try {
    // Ambil bagian payload → token.split('.')[1]
    const base64Url = token.split('.')[1]
    if (!base64Url) return null

    // Convert base64url → base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')

    // Decode base64 → UTF-8
    const jsonPayload = decodeURIComponent(atob(base64)
      .split('')
      .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(''))

    return JSON.parse(jsonPayload)
  } catch (e) {
    console.error('Invalid JWT token:', e)

    return null
  }
}


export function extractFilename(path) {
  if (!path) return ''

  return path.split('/').pop()
}


export const stripHtml = html => {
  if (!html) return ''
  const div = document.createElement('div')

  div.innerHTML = html

  return div.textContent || div.innerText || ''
}

export const getFileName = file => {
  return file?.[0]?.file?.name || '-'
}
