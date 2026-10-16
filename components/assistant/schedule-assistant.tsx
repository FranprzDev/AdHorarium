"use client"

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, isTextUIPart, type UIMessage } from "ai"
import { MessageSquareText, RotateCcw, SendHorizontal, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { getAssistantErrorMessage } from "@/lib/assistant/errors"
import { ASSISTANT_STARTER_QUESTIONS } from "@/lib/assistant/prompt"
import { MAX_USER_MESSAGE_LENGTH } from "@/lib/assistant/request"
import { cn } from "@/lib/utils"
import { AssistantChatStatus, AssistantMessageRole } from "@/types/enums"

const ASSISTANT_API = "/api/assistant"
const INPUT_ID = "schedule-assistant-input"
const transport = new DefaultChatTransport({ api: ASSISTANT_API })

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("")
}

function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === AssistantMessageRole.User
  return (
    <li className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border bg-card text-card-foreground",
        )}
      >
        <span className="sr-only">{isUser ? "Vos: " : "Asistente: "}</span>
        {getMessageText(message)}
      </div>
    </li>
  )
}

/** Floating chat panel that answers questions about the student's plan. Read only: it never changes data. */
export function ScheduleAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const listEndRef = useRef<HTMLDivElement>(null)
  const { messages, sendMessage, status, error, stop, setMessages, clearError } = useChat({ transport })

  const isBusy = status === AssistantChatStatus.Submitted || status === AssistantChatStatus.Streaming
  const trimmed = input.trim()

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ block: "end" })
  }, [messages, status])

  const ask = async (text: string) => {
    if (!text || isBusy) return
    setInput("")
    clearError()
    await sendMessage({ text })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void ask(trimmed)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return
    event.preventDefault()
    void ask(trimmed)
  }

  const resetConversation = () => {
    stop()
    clearError()
    setMessages([])
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 h-12 gap-2 rounded-full px-5 shadow-lg"
        aria-haspopup="dialog"
      >
        <MessageSquareText className="h-5 w-5" aria-hidden="true" />
        Asistente
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b px-5 py-4 text-left">
            <p className="eyebrow">Gestor de Horarios</p>
            <SheetTitle className="font-serif text-xl">Asistente de horarios</SheetTitle>
            <SheetDescription>
              Te ayuda a ver qué materias podés cursar o rendir y a combinar comisiones sin superposiciones. Las respuestas se
              generan con IA a partir de tus materias, las comisiones cargadas y tu horario guardado; no modifica tus datos.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Podés empezar con una de estas preguntas:</p>
                <ul className="space-y-2">
                  {ASSISTANT_STARTER_QUESTIONS.map((question) => (
                    <li key={question}>
                      <button
                        type="button"
                        onClick={() => void ask(question)}
                        className="w-full rounded-lg border bg-card px-3 py-2 text-left text-sm transition-colors hover:border-brand hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {question}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="space-y-3" role="log" aria-live="polite" aria-label="Conversación con el asistente">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              </ul>
            )}
            {status === AssistantChatStatus.Submitted && (
              <p className="mt-3 text-sm text-muted-foreground" role="status">
                Pensando…
              </p>
            )}
            {error && (
              <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {getAssistantErrorMessage(error)}
              </p>
            )}
            <div ref={listEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-2 border-t px-5 py-4">
            <label htmlFor={INPUT_ID} className="sr-only">
              Escribí tu pregunta
            </label>
            <Textarea
              id={INPUT_ID}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MAX_USER_MESSAGE_LENGTH}
              rows={2}
              placeholder="Por ejemplo: ¿qué materias de tercer nivel puedo cursar?"
              className="min-h-[64px] resize-none"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground" aria-live="off">
                {input.length}/{MAX_USER_MESSAGE_LENGTH}
              </span>
              <div className="flex gap-2">
                {messages.length > 0 && (
                  <Button type="button" variant="ghost" size="sm" onClick={resetConversation}>
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Nueva conversación
                  </Button>
                )}
                {isBusy ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => stop()}>
                    <Square className="h-4 w-4" aria-hidden="true" />
                    Detener
                  </Button>
                ) : (
                  <Button type="submit" size="sm" disabled={!trimmed}>
                    <SendHorizontal className="h-4 w-4" aria-hidden="true" />
                    Enviar
                  </Button>
                )}
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
