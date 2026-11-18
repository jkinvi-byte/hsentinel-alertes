export async function consoleRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/console/${path}`, { cache: 'no-store', ...options })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.erreur || 'La console est momentanément indisponible.')
  return body as T
}
export const postJson = <T>(path: string, body: unknown) => consoleRequest<T>(path, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})
