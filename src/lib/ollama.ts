import type { Achievement } from '../types/achievement'
import { formatDisplayDate } from './dates'

export const DEFAULT_OLLAMA_MODEL = 'qwen2.5:3b'
export const OLLAMA_MODEL_STORAGE_KEY = 'devlog.ollama.model.v1'
export const OLLAMA_BASE_URL = '/ollama'

const REQUEST_TIMEOUT_MS = 60_000

export type OllamaErrorKind =
  | 'unreachable'
  | 'cors'
  | 'model_missing'
  | 'timeout'
  | 'http'
  | 'empty'
  | 'unknown'

export class OllamaRequestError extends Error {
  kind: OllamaErrorKind

  constructor(kind: OllamaErrorKind, message: string) {
    super(message)
    this.name = 'OllamaRequestError'
    this.kind = kind
  }
}

export function readStoredOllamaModel(): string {
  try {
    const raw = window.localStorage.getItem(OLLAMA_MODEL_STORAGE_KEY)
    if (raw && raw.trim()) return raw.trim()
  } catch {
    // ignore
  }
  return DEFAULT_OLLAMA_MODEL
}

export function persistOllamaModel(model: string): void {
  try {
    window.localStorage.setItem(OLLAMA_MODEL_STORAGE_KEY, model.trim())
  } catch {
    // ignore
  }
}

function buildEvidenceBlock(achievements: Achievement[]): string {
  const withEvidence = achievements.filter((a) => a.evidenceUrl)
  if (withEvidence.length === 0) {
    return 'No evidence URLs were recorded for these achievements.'
  }
  return withEvidence
    .map(
      (a) =>
        `- ${a.title} (${formatDisplayDate(a.date)}): ${a.evidenceUrl}`,
    )
    .join('\n')
}

export function buildGroundedPrompt(
  achievements: Achievement[],
  period: { start: string; end: string },
): string {
  const records = achievements
    .map((a, i) => {
      const parts = [
        `Achievement ${i + 1}:`,
        `Title: ${a.title}`,
        `Date: ${a.date}`,
        `Category: ${a.category}`,
        `Notes: ${a.notes}`,
      ]
      if (a.impact) parts.push(`Impact: ${a.impact}`)
      if (a.evidenceUrl) parts.push(`Evidence URL: ${a.evidenceUrl}`)
      return parts.join('\n')
    })
    .join('\n\n')

  return [
    'You are helping write a professional self-review summary.',
    'Ground ONLY on the achievement records below.',
    'Do NOT invent metrics, outcomes, numbers, titles, or facts that are not explicitly present.',
    'Do NOT add achievements that are not listed.',
    'If impact or evidence is missing, say so briefly rather than guessing.',
    'Write concise Markdown with short sections by category when useful.',
    'Include a final "Evidence" section listing the original evidence URLs exactly as provided (or note that none were recorded).',
    '',
    `Period: ${period.start} to ${period.end}`,
    `Achievement count: ${achievements.length}`,
    '',
    '=== ACHIEVEMENT RECORDS (SOURCE OF TRUTH) ===',
    records,
    '',
    '=== EVIDENCE URLS (COPY VERBATIM) ===',
    buildEvidenceBlock(achievements),
  ].join('\n')
}

interface GenerateResponse {
  response?: string
  error?: string
}

function classifyFetchFailure(err: unknown): OllamaRequestError {
  if (err instanceof OllamaRequestError) return err
  if (err instanceof DOMException && err.name === 'AbortError') {
    return new OllamaRequestError(
      'timeout',
      `Ollama request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`,
    )
  }
  const message = err instanceof Error ? err.message : String(err)
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
    return new OllamaRequestError(
      'unreachable',
      'Could not reach Ollama. Is it running on 127.0.0.1:11434? If the browser blocked the request, set OLLAMA_ORIGINS for your Vite origin (see README).',
    )
  }
  return new OllamaRequestError('unknown', message || 'Ollama request failed.')
}

export async function generateOllamaSummary(options: {
  achievements: Achievement[]
  period: { start: string; end: string }
  model: string
  signal?: AbortSignal
}): Promise<string> {
  const { achievements, period, model, signal } = options
  if (achievements.length === 0) {
    throw new OllamaRequestError(
      'empty',
      'No achievements in this period to summarize.',
    )
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const onOuterAbort = () => controller.abort()
  signal?.addEventListener('abort', onOuterAbort)

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model.trim() || DEFAULT_OLLAMA_MODEL,
        prompt: buildGroundedPrompt(achievements, period),
        stream: false,
        options: {
          temperature: 0.2,
        },
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      let detail = ''
      try {
        const body = (await res.json()) as GenerateResponse
        detail = body.error ?? ''
      } catch {
        detail = await res.text().catch(() => '')
      }

      if (res.status === 404 || /not found|pull/i.test(detail)) {
        throw new OllamaRequestError(
          'model_missing',
          `Model “${model}” was not found. Pull it with: ollama pull ${model}`,
        )
      }

      throw new OllamaRequestError(
        'http',
        detail || `Ollama returned HTTP ${res.status}.`,
      )
    }

    const data = (await res.json()) as GenerateResponse
    const text = data.response?.trim()
    if (!text) {
      throw new OllamaRequestError(
        'empty',
        'Ollama returned an empty response. The template review below is unchanged.',
      )
    }
    return text
  } catch (err) {
    throw classifyFetchFailure(err)
  } finally {
    window.clearTimeout(timeout)
    signal?.removeEventListener('abort', onOuterAbort)
  }
}

export function ollamaErrorHelp(kind: OllamaErrorKind): string {
  switch (kind) {
    case 'unreachable':
      return 'Start Ollama (`ollama serve`), confirm http://127.0.0.1:11434 responds, and for direct browser calls set OLLAMA_ORIGINS (e.g. http://127.0.0.1:4327). Dev/preview use a Vite proxy at /ollama.'
    case 'cors':
      return 'Browser CORS blocked the request. Prefer the Vite /ollama proxy, or set OLLAMA_ORIGINS to your app origin.'
    case 'model_missing':
      return 'Install the model locally, then retry.'
    case 'timeout':
      return 'Try a smaller model or fewer achievements, or increase patience for a cold start.'
    default:
      return 'Falling back to the deterministic template review.'
  }
}
