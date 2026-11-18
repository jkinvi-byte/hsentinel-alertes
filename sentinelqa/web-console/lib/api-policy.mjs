// Une seule garde d'origine pour les deux webs : celle de web/lib, qui compare l'origine à l'hôte réellement appelé.
export { memeOrigine as sameOrigin } from '../../web/lib/acces-operateur.js'
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
