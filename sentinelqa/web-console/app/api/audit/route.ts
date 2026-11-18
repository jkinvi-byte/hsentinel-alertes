// L'ancien endpoint de simulation ne lance plus d'audit fictif.
export function GET() { return Response.json({ erreur: 'Utilisez la console des missions.' }, { status: 410 }) }
export const POST = GET
