const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const API_BASE_URL = (configuredBaseUrl || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('无法连接数据服务，请检查接口地址和网络状态')
  }
  if (!response.ok) throw new ApiError(`数据服务返回异常（HTTP ${response.status}）`, response.status)
  try {
    return await response.json() as T
  } catch {
    throw new ApiError('数据服务返回的内容不是有效 JSON')
  }
}
