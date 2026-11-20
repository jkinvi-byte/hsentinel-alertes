import 'server-only'
import { listerAjoutees as listerJs } from '../../web/lib/applications.js'
import type { ApplicationAjoutee } from './applications-types'

// D-56 : les applications ajoutées par le client, lues côté serveur pour les pages (jamais un texte chiffré).
export const listerAjoutees = listerJs as () => Promise<ApplicationAjoutee[]>
