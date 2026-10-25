const ROMAN_NUMERALS: Record<string, string> = { "1": "i", "2": "ii", "3": "iii", "4": "iv", "5": "v" }
const STOP_WORDS = new Set(["de", "del", "la", "las", "el", "los", "y", "e", "en", "a", "para", "materia"])
const MAX_SUGGESTIONS = 5

export type MatchableSubject = { number: number; name: string }

export type SubjectMatch<T extends MatchableSubject> =
  | { kind: "found"; subject: T }
  | { kind: "ambiguous"; candidates: T[] }
  | { kind: "not_found"; suggestions: T[] }

function stem(token: string): string {
  if (token.length > 4 && token.endsWith("es")) return token.slice(0, -2)
  if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1)
  return token
}

export function tokenizeSubjectName(value: string): string[] {
  const tokens = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token.length > 0 && !STOP_WORDS.has(token))
  return tokens.map((token) => stem(ROMAN_NUMERALS[token] ?? token))
}

function isPrefixMatch(queryToken: string, subjectToken: string): boolean {
  return queryToken === subjectToken || (queryToken.length >= 4 && subjectToken.startsWith(queryToken))
}

function coversAllQueryTokens(queryTokens: ReadonlyArray<string>, subjectTokens: ReadonlyArray<string>): boolean {
  return queryTokens.every((queryToken) => subjectTokens.some((subjectToken) => isPrefixMatch(queryToken, subjectToken)))
}

function overlap(queryTokens: ReadonlyArray<string>, subjectTokens: ReadonlyArray<string>): number {
  const shared = queryTokens.filter((queryToken) => subjectTokens.some((subjectToken) => isPrefixMatch(queryToken, subjectToken)))
  return shared.length / new Set([...queryTokens, ...subjectTokens]).size
}

export function matchSubject<T extends MatchableSubject>(query: string, subjects: ReadonlyArray<T>): SubjectMatch<T> {
  const queryTokens = tokenizeSubjectName(query)
  if (queryTokens.length === 0) return { kind: "not_found", suggestions: [] }

  const tokenized = subjects.map((subject) => ({ subject, tokens: tokenizeSubjectName(subject.name) }))
  const exact = tokenized.filter(({ tokens }) => tokens.length === queryTokens.length && tokens.every((token, index) => token === queryTokens[index]))
  if (exact.length === 1) return { kind: "found", subject: exact[0].subject }

  const covering = tokenized.filter(({ tokens }) => coversAllQueryTokens(queryTokens, tokens))
  if (covering.length === 1) return { kind: "found", subject: covering[0].subject }
  if (covering.length > 1) return { kind: "ambiguous", candidates: covering.map(({ subject }) => subject) }

  const suggestions = tokenized
    .map(({ subject, tokens }) => ({ subject, score: overlap(queryTokens, tokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.subject.number - b.subject.number)
    .slice(0, MAX_SUGGESTIONS)
    .map(({ subject }) => subject)
  return { kind: "not_found", suggestions }
}
