export function alertFilters(params) {
  const application = params.get('application') || null
  const rawLimit = params.get('limite')
  if (application && !/^[a-z0-9-]{1,40}$/.test(application)) throw new Error('L’application demandée est invalide.')
  if (rawLimit !== null && !/^\d{1,3}$/.test(rawLimit)) throw new Error('La limite doit être comprise entre 1 et 200.')
  const limite = rawLimit === null ? 50 : Number(rawLimit)
  if (limite < 1 || limite > 200) throw new Error('La limite doit être comprise entre 1 et 200.')
  return { application, limite }
}
