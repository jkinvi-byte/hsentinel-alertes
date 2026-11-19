import type { RoleMatrix } from './audit-types'

export type Module = 'qa' | 'pentest'
export type ResultStatus = 'passed' | 'failed' | 'inconclusive' | 'skipped'
export type Result = { id: string; type: string; title: string; expected: string; observed: string; status: ResultStatus; reason: string; evidence: string[]; classification: string }
export type Mission = {
  id: string; module: Module; title: string; target: string; createdAt: string; status: string;
  error: string | null; interruption: string; stopRequested: boolean; canStop: boolean; duration: number | null; costH: number | null; costHf: number | null;
  results: Result[]; summary: Record<ResultStatus, number>; hasReport: boolean; legacy: boolean;
  coverage: { endpoints: number | null; activeExecuted: number | null; activeAuthorized: number | null; formsObserved: number | null; formsSubmitted: number | null; businessFormsSubmitted: number | null; mutations: number | null; accessResources: number | null; accessDiscovered: number | null; identities: number | null; methods: string[]; pythonMethods: string[]; measurementSource: string; limitations: string } | null;
  matrix: RoleMatrix | null;
  rulesExecuted: string[]; rulesSkipped: { id: string; reason: string }[];
  securityFindings: { demonstrated: number; configuration: number; candidates: number } | null;
  inference: { status: string; reason: string } | null;
  sessions: { id: string; replay: string | null; status: string; cost: number | null }[];
  evidence: { id: string; title: string; url: string | null; image: string | null; method: string; httpStatus: number | null; bytes: number | null; redirect: string | null; capturedAt: string }[];
}
export type Event = { id: number; quand: string; type: string; message: string }
export type Plan = { titre: string; etapes: string[]; criteres: { id: string; type: string; description: string; valeur: string }[]; hors_perimetre: string[]; inconnues: string[] }
export type Catalog = {
  qa: { id: string; name: string; url: string; available: boolean; connexion: boolean; modes: string[]; limits: Record<string, { max_steps: number; max_time_s: number; max_pages?: number }> }[];
  pentest: { id: string; targetId: string; targetIds: string[]; targets: { id: string; name: string; url: string; maxSteps: number; maxTime: number }[]; name: string; target: string; url: string; available: boolean; writes?: boolean; expected: string; limitations: string; maxSteps: number; maxTime: number }[];
}
export type RunnerKey = { id: string | number; jwk: JsonWebKey }
export type TestAccount = { identifiant: string; motDePasse: string; identite: string[] }
