import { describe, expect, it, vi } from "vitest"
import { BREVO_SEND_URL, BrevoMailProvider } from "@/lib/mail/brevo"
import { deliverMail, isOutboxEnabled, resolveMailProvider } from "@/lib/mail/config"
import { LogMailProvider, MAIL_NOT_CONFIGURED_MESSAGE } from "@/lib/mail/log"
import { InvalidMailboxError, maskEmail, parseMailbox } from "@/lib/mail/mailbox"
import { buildGoogleAccountResetMail, buildPasswordResetMail, escapeHtml } from "@/lib/mail/templates"
import type { MailMessage, MailProvider } from "@/lib/mail/types"
import { MailDeliveryStatus, MailKind, MailProviderKind } from "@/types/enums"

const MESSAGE: MailMessage = { to: "ana@example.com", kind: MailKind.PasswordReset, subject: "Asunto", text: "Texto con enlace", html: "<p>Hola</p>" }

function silentLogger() {
  return { warn: vi.fn<(message: string) => void>() }
}

function dependencies() {
  return { storeMail: vi.fn<(message: MailMessage) => Promise<void>>(async () => undefined), logger: silentLogger() }
}

describe("parseMailbox", () => {
  it("accepts a bare address and a named mailbox", () => {
    expect(parseMailbox("no-reply@adhorarium.app")).toEqual({ email: "no-reply@adhorarium.app", name: null })
    expect(parseMailbox("AdHorarium <no-reply@adhorarium.app>")).toEqual({ email: "no-reply@adhorarium.app", name: "AdHorarium" })
    expect(parseMailbox('"Ad Horarium" <a@b.co>')).toEqual({ email: "a@b.co", name: "Ad Horarium" })
  })

  it("rejects anything that is not an address", () => {
    expect(() => parseMailbox("AdHorarium")).toThrow(InvalidMailboxError)
    expect(() => parseMailbox("Name <not-an-email>")).toThrow(InvalidMailboxError)
  })

  it("masks addresses for logs", () => {
    expect(maskEmail("ana@example.com")).toBe("a***@example.com")
    expect(maskEmail("broken")).toBe("***")
  })
})

describe("resolveMailProvider", () => {
  it("logs instead of sending when BREVO_API_KEY is missing", () => {
    expect(resolveMailProvider({}, dependencies()).kind).toBe(MailProviderKind.Log)
    expect(resolveMailProvider({ MAIL_FROM: "a@b.co", BREVO_API_KEY: "  " }, dependencies()).kind).toBe(MailProviderKind.Log)
  })

  it("logs instead of sending when MAIL_FROM is missing or invalid", () => {
    expect(resolveMailProvider({ BREVO_API_KEY: "key" }, dependencies()).kind).toBe(MailProviderKind.Log)
    expect(resolveMailProvider({ BREVO_API_KEY: "key", MAIL_FROM: "nope" }, dependencies()).kind).toBe(MailProviderKind.Log)
  })

  it("uses Brevo when both variables are set", () => {
    expect(resolveMailProvider({ BREVO_API_KEY: "key", MAIL_FROM: "AdHorarium <a@b.co>" }, dependencies()).kind).toBe(MailProviderKind.Brevo)
  })

  it("uses the outbox only when MAIL_OUTBOX=1 outside Vercel production", () => {
    expect(isOutboxEnabled({ MAIL_OUTBOX: "1" })).toBe(true)
    expect(isOutboxEnabled({ MAIL_OUTBOX: "1", VERCEL_ENV: "preview" })).toBe(true)
    expect(isOutboxEnabled({ MAIL_OUTBOX: "1", VERCEL_ENV: "production" })).toBe(false)
    expect(isOutboxEnabled({ MAIL_OUTBOX: "true" })).toBe(false)
    const env = { MAIL_OUTBOX: "1", BREVO_API_KEY: "key", MAIL_FROM: "a@b.co" }
    expect(resolveMailProvider(env, dependencies()).kind).toBe(MailProviderKind.Outbox)
    expect(resolveMailProvider({ ...env, VERCEL_ENV: "production" }, dependencies()).kind).toBe(MailProviderKind.Brevo)
  })

  it("stores the message in the outbox", async () => {
    const deps = dependencies()
    const result = await resolveMailProvider({ MAIL_OUTBOX: "1" }, deps).send(MESSAGE)
    expect(result).toEqual({ status: MailDeliveryStatus.Sent, provider: MailProviderKind.Outbox })
    expect(deps.storeMail).toHaveBeenCalledWith(MESSAGE)
  })
})

describe("LogMailProvider", () => {
  it("reports not configured without the body in production", async () => {
    const logger = silentLogger()
    const result = await new LogMailProvider({ reason: "BREVO_API_KEY no está definida", includeBody: false, logger }).send(MESSAGE)
    expect(result).toEqual({ status: MailDeliveryStatus.NotConfigured, provider: MailProviderKind.Log })
    expect(logger.warn).toHaveBeenCalledTimes(1)
    const [line] = logger.warn.mock.calls[0]
    expect(line).toContain(MAIL_NOT_CONFIGURED_MESSAGE)
    expect(line).toContain("a***@example.com")
    expect(line).not.toContain("Texto con enlace")
  })

  it("prints the body during local development", async () => {
    const logger = silentLogger()
    await new LogMailProvider({ reason: "dev", includeBody: true, logger }).send(MESSAGE)
    expect(logger.warn.mock.calls[1][0]).toContain("Texto con enlace")
  })
})

describe("BrevoMailProvider", () => {
  it("posts the transactional email with the api key header", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ messageId: "1" }), { status: 201 }))
    const provider = new BrevoMailProvider({ apiKey: "secret", sender: { email: "a@b.co", name: "AdHorarium" }, fetch: fetchMock })
    expect(await provider.send(MESSAGE)).toEqual({ status: MailDeliveryStatus.Sent, provider: MailProviderKind.Brevo })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(BREVO_SEND_URL)
    expect(init?.method).toBe("POST")
    expect(new Headers(init?.headers).get("api-key")).toBe("secret")
    expect(JSON.parse(String(init?.body))).toEqual({
      sender: { email: "a@b.co", name: "AdHorarium" },
      to: [{ email: "ana@example.com" }],
      subject: "Asunto",
      htmlContent: "<p>Hola</p>",
      textContent: "Texto con enlace",
      tags: [MailKind.PasswordReset],
    })
  })

  it("reports a rejected request as failed", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    const fetchMock = vi.fn<typeof fetch>(async () => new Response("unauthorized", { status: 401 }))
    const provider = new BrevoMailProvider({ apiKey: "bad", sender: { email: "a@b.co", name: null }, fetch: fetchMock })
    expect((await provider.send(MESSAGE)).status).toBe(MailDeliveryStatus.Failed)
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).sender).toEqual({ email: "a@b.co" })
  })
})

describe("deliverMail", () => {
  it("never throws when the provider fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    const broken: MailProvider = {
      kind: MailProviderKind.Brevo,
      send: async () => {
        throw new TypeError("network down")
      },
    }
    expect(await deliverMail(broken, MESSAGE)).toEqual({ status: MailDeliveryStatus.Failed, provider: MailProviderKind.Brevo })
  })
})

describe("templates", () => {
  it("escapes HTML in user supplied values", () => {
    expect(escapeHtml(`<b>"x" & 'y'</b>`)).toBe("&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;")
    const mail = buildPasswordResetMail("a@b.co", "<script>", "https://adhorarium.vercel.app/restablecer?token=abc", 30)
    expect(mail.html).not.toContain("<script>")
    expect(mail.html).toContain("&lt;script&gt;")
  })

  it("includes the reset link and its validity in both bodies", () => {
    const url = "https://adhorarium.vercel.app/restablecer?token=abc"
    const mail = buildPasswordResetMail("a@b.co", "Ana", url, 30)
    expect(mail.kind).toBe(MailKind.PasswordReset)
    expect(mail.text).toContain(url)
    expect(mail.text).toContain("30 minutos")
    expect(mail.html).toContain(url)
  })

  it("tells Google accounts to sign in with Google", () => {
    const mail = buildGoogleAccountResetMail("a@b.co", null, "https://adhorarium.vercel.app/ingresar")
    expect(mail.kind).toBe(MailKind.PasswordResetGoogleAccount)
    expect(mail.text).toContain("Continuar con Google")
    expect(mail.text).not.toContain("restablecer?token")
  })
})
