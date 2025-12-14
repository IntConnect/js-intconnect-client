export const useStaticFile = filePath => {
  if (!filePath) return ''

  const base = import.meta.env.VITE_API_BASE_URL_STATIC.replace(/\/$/, '')

  const path = filePath
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/')

  return `${base}/${path}`
}
