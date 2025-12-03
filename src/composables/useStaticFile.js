export const useStaticFile = filePath => {
  return import.meta.env.VITE_API_BASE_URL_STATIC + filePath
}
