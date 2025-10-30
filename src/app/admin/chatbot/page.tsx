"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Search, Plus, Save, X, MessageSquare } from "lucide-react"

type Intent = {
  id: string
  question: string
  answer: string
  updatedAt: string
}

export default function ChatbotAdminPage() {
  const [intents, setIntents] = useState<Intent[]>([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [testing, setTesting] = useState(false)
  const [selected, setSelected] = useState<Intent | null>(null)
  const [form, setForm] = useState({ question: "", answer: "" })
  const [saving, setSaving] = useState(false)
  const [testInput, setTestInput] = useState("")
  const [testMessages, setTestMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])

  useEffect(() => {
    fetchIntents()
  }, [])

  const fetchIntents = async () => {
    try {
      const res = await fetch("/api/qa")
      const data = await res.json()
      if (data.success) {
        const mapped: Intent[] = data.data.map((q: { id: string; question: string; answer: string; updatedAt: string }) => ({
          id: q.id,
          question: q.question,
          answer: q.answer,
          updatedAt: q.updatedAt,
        }))
        setIntents(mapped)
      }
    } catch {
      // noop
    }
  }

  const filtered = useMemo(() =>
    intents.filter(i =>
      i.question.toLowerCase().includes(search.toLowerCase()) ||
      i.answer.toLowerCase().includes(search.toLowerCase())
    ), [intents, search]
  )

  const onEdit = (intent?: Intent) => {
    const base = intent ?? null
    setSelected(base)
    setForm({
      question: base?.question ?? "",
      answer: base?.answer ?? "",
    })
    setOpen(true)
  }

  const onSave = async () => {
    if (!form.question.trim()) return
    if (!form.answer.trim()) return
    setSaving(true)
    try {
      const isNew = !selected
      const url = isNew ? "/api/qa" : `/api/qa/${selected!.id}`
      const method = isNew ? "POST" : "PUT"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: form.question, answer: form.answer })
      })
      if (res.ok) {
        await fetchIntents()
        setOpen(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const runTest = async () => {
    if (!testInput.trim()) return
    const prompt = testInput.trim()
    setTestMessages(m => [...m, { role: "user", content: prompt }])
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, context: "admin-test" })
      })
      const data = await res.json()
      const reply = data?.reply ?? "No hay respuesta."
      setTestMessages(m => [...m, { role: "assistant", content: reply }])
    } catch {
      setTestMessages(m => [...m, { role: "assistant", content: "Error al probar." }])
    } finally {
      setTestInput("")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chatbot</h1>
          <p className="text-gray-600 mt-1">Intenciones y respuestas</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar patrón o respuesta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => onEdit()}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva intención
          </Button>
          <Button variant="outline" onClick={() => setTesting(true)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Probar
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="divide-y">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Sin intenciones</div>
            ) : (
              filtered.map((i) => (
                <div key={i.id} className="py-4 grid grid-cols-12 gap-4 items-start">
                  <div className="col-span-5">
                    <div className="font-medium text-gray-900">{i.question}</div>
                    <div className="text-xs text-gray-500 mt-1">Última edición: {new Date(i.updatedAt).toLocaleString()}</div>
                  </div>
                  <div className="col-span-6 text-gray-700 line-clamp-2">{i.answer}</div>
                  <div className="col-span-1 text-right">
                    <Button size="sm" variant="outline" onClick={() => onEdit(i)}>Editar</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Editor Panel */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle>{selected ? "Editar intención" : "Nueva intención"}</SheetTitle>
          </SheetHeader>
          <Separator />
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patrón de pregunta</label>
              <Input
                value={form.question}
                onChange={(e) => setForm(f => ({ ...f, question: e.target.value }))}
                aria-invalid={!form.question.trim()}
              />
              {!form.question.trim() && (
                <p className="text-xs text-red-600 mt-1">Ingresa un patrón de pregunta.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Respuesta</label>
              <Textarea
                value={form.answer}
                onChange={(e) => setForm(f => ({ ...f, answer: e.target.value }))}
                rows={8}
                aria-invalid={!form.answer.trim()}
              />
              {!form.answer.trim() && (
                <p className="text-xs text-red-600 mt-1">Ingresa una respuesta.</p>
              )}
            </div>
          </div>
          <Separator />
          <SheetFooter className="p-4 border-t bg-white sticky bottom-0">
            <div className="flex w-full justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={onSave} disabled={saving || !form.question.trim() || !form.answer.trim()}>
                <Save className="mr-2 h-4 w-4" />
                Guardar
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Test Panel */}
      <Sheet open={testing} onOpenChange={setTesting}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle>Prueba rápida</SheetTitle>
          </SheetHeader>
          <Separator />
          <div className="p-6 h-full flex flex-col gap-3">
            <div className="flex-1 overflow-y-auto space-y-3">
              {testMessages.map((m, idx) => (
                <div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
                  <div className={
                    "inline-block px-3 py-2 rounded-md max-w-[85%] " +
                    (m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900")
                  }>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Escribe para probar..."
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") runTest() }}
              />
              <Button onClick={runTest}>Enviar</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}



