export function sameOrigin(request) {
  try { return new URL(request.headers.get('origin')).origin === new URL(request.url).origin }
  catch { return false }
}
export async function readBody(request, maxBytes) {
  if (Number(request.headers.get('content-length')) > maxBytes) throw new RangeError('Demande trop volumineuse.')
  const reader = request.body?.getReader()
  if (!reader) return new Uint8Array()
  const chunks = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > maxBytes) { await reader.cancel(); throw new RangeError('Demande trop volumineuse.') }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const body = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength }
  return body
}
