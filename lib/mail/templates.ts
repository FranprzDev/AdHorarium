import type { MailMessage } from "@/lib/mail/types"
import { MailKind } from "@/types/enums"

const BRAND = "AdHorarium"

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character)
}

type MailContent = {
  greetingName: string | null
  paragraphs: string[]
  action: { label: string; url: string } | null
  footer: string
}

function greeting(name: string | null): string {
  return name ? `Hola, ${name}:` : "Hola:"
}

function renderText(content: MailContent): string {
  const lines = [greeting(content.greetingName), "", ...content.paragraphs.flatMap((paragraph) => [paragraph, ""])]
  if (content.action) lines.push(`${content.action.label}: ${content.action.url}`, "")
  lines.push(content.footer, "", `— ${BRAND}`)
  return lines.join("\n")
}

function renderHtml(content: MailContent): string {
  const paragraphs = content.paragraphs.map((paragraph) => `<p style="margin:0 0 16px">${escapeHtml(paragraph)}</p>`).join("")
  const action = content.action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(content.action.url)}" style="display:inline-block;background:#1b2a4a;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${escapeHtml(content.action.label)}</a></p><p style="margin:0 0 16px;font-size:13px;color:#555555">Si el botón no funciona, copiá este enlace en tu navegador:<br><span style="word-break:break-all">${escapeHtml(content.action.url)}</span></p>`
    : ""
  return `<!doctype html><html lang="es"><body style="margin:0;padding:24px;background:#f6f5f1;font-family:Arial,Helvetica,sans-serif;color:#1b2a4a"><div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px"><p style="margin:0 0 24px;font-size:20px;font-weight:700">${BRAND}</p><p style="margin:0 0 16px">${escapeHtml(greeting(content.greetingName))}</p>${paragraphs}${action}<p style="margin:24px 0 0;font-size:13px;color:#555555">${escapeHtml(content.footer)}</p></div></body></html>`
}

function buildMail(to: string, kind: MailKind, subject: string, content: MailContent): MailMessage {
  return { to, kind, subject, text: renderText(content), html: renderHtml(content) }
}

export function buildPasswordResetMail(to: string, name: string | null, resetUrl: string, validMinutes: number): MailMessage {
  return buildMail(to, MailKind.PasswordReset, `Restablecé tu contraseña de ${BRAND}`, {
    greetingName: name,
    paragraphs: [
      `Recibimos un pedido para restablecer la contraseña de tu cuenta de ${BRAND}.`,
      `El enlace vale por ${validMinutes} minutos y se puede usar una sola vez.`,
    ],
    action: { label: "Elegir una contraseña nueva", url: resetUrl },
    footer: "Si no lo pediste vos, ignorá este email: tu contraseña no cambia.",
  })
}

export function buildGoogleAccountResetMail(to: string, name: string | null, signInUrl: string): MailMessage {
  return buildMail(to, MailKind.PasswordResetGoogleAccount, `Tu cuenta de ${BRAND} usa Google`, {
    greetingName: name,
    paragraphs: [
      `Recibimos un pedido para restablecer la contraseña de tu cuenta de ${BRAND}, pero tu cuenta no tiene contraseña: ingresás con Google.`,
      "Para entrar, usá el botón «Continuar con Google» en la página de inicio de sesión.",
    ],
    action: { label: "Ir a iniciar sesión", url: signInUrl },
    footer: "Si no lo pediste vos, ignorá este email.",
  })
}

export function buildEmailVerificationMail(to: string, name: string | null, verifyUrl: string, validHours: number): MailMessage {
  return buildMail(to, MailKind.EmailVerification, `Confirmá tu email en ${BRAND}`, {
    greetingName: name,
    paragraphs: [
      `Gracias por crear tu cuenta de ${BRAND}. Confirmá que este email es tuyo para poder recuperar tu cuenta si olvidás la contraseña.`,
      `El enlace vale por ${validHours} horas. Si vence, pedí uno nuevo desde el aviso en tu panel.`,
    ],
    action: { label: "Confirmar mi email", url: verifyUrl },
    footer: "Si no creaste una cuenta, ignorá este email.",
  })
}
