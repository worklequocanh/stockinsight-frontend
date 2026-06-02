export function buildQuery(params) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value))
    }
  })

  return query.toString()
}

export function parseApiError(error, fallback) {
  return error?.response?.data?.message || fallback
}
