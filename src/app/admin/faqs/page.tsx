"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Save, X, Eye, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type FAQ = {
  id: string
  title: string
  answer: string
  category: string | null
  status: "DRAFT" | "PUBLISHED"
  updatedAt: string
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<FAQ | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: "", answer: "", category: "General", status: "DRAFT" as "DRAFT" | "PUBLISHED" })

  useEffect(() => {
    fetchFaqs()
  }, [])

  const fetchFaqs = async () => {
    try {
      const res = await fetch("/api/faqs")
      const data = await res.json()
      if (data.success) setFaqs(data.data)
    } catch {
      // noop
    }
  }

  const filtered = useMemo(() =>
    faqs.filter(f =>
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
    ), [faqs, search]
  )

  const openEditor = (faq?: FAQ) => {
    const f = faq ?? null
    setSelected(f)
    setForm({
      title: f?.title ?? "",
      answer: f?.answer ?? "",
      category: f?.category ?? "General",
      status: f?.status ?? "DRAFT",
    })
    setOpen(true)
  }

  const saveFAQ = async () => {
    if (!form.title.trim()) return
    if (!form.answer.trim()) return
    setSaving(true)
    try {
      const isNew = !selected
      const url = isNew ? "/api/faqs" : `/api/faqs/${selected!.id}`
      const method = isNew ? "POST" : "PUT"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, answer: form.answer, category: form.category, status: form.status })
      })
      if (res.ok) {
        await fetchFaqs()
        setOpen(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const publishFAQ = async (id: string) => {
    try {
      const res = await fetch(`/api/faqs/${id}/publish`, { method: "POST" })
      if (res.ok) fetchFaqs()
    } catch {
      // noop
    }
  }

  const preview = selected ?? filtered[0] ?? null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">Configura las preguntas frecuentes del chatbot</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título o contenido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
          <Button variant="bank" onClick={() => openEditor()}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva FAQ
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.map((faq) => (
          <div key={faq.id} className="bank-card p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground">{faq.title}</h3>
                  <span className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    faq.status === "PUBLISHED" 
                      ? "bg-bank-success/10 text-bank-success" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {faq.status === "PUBLISHED" ? "Publicado" : "Borrador"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{faq.category || "General"}</p>
                <p className="text-sm text-muted-foreground">{new Date(faq.updatedAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                {faq.status === "DRAFT" && (
                  <Button size="sm" variant="outline" onClick={() => publishFAQ(faq.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Publicar
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => openEditor(faq)}>
                  Editar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
              <TableHeader>
                <TableRow>
                  <TableHead>Pregunta</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última edición</TableHead>
                  <TableHead className="w-[1%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">Sin resultados</TableCell>
                  </TableRow>
                ) : filtered.map(f => (
                  <TableRow key={f.id} className="cursor-pointer" onClick={() => setSelected(f)}>
                    <TableCell className="font-medium">{f.title}</TableCell>
                    <TableCell>{f.category || "General"}</TableCell>
                    <TableCell>
                      <span className={
                        "px-2 py-1 rounded text-xs font-medium " +
                        (f.status === "PUBLISHED" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700")
                      }>
                        {f.status === "PUBLISHED" ? "Publicada" : "Borrador"}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(f.updatedAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {f.status === "DRAFT" && (
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); publishFAQ(f.id) }}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Publicar
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openEditor(f) }}>Editar</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5 xl:col-span-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Preview (kiosko/cliente)</span>
              </div>
            </div>
            {preview ? (
              <div className="space-y-2">
                <div className="text-base font-semibold text-gray-900">{preview.title}</div>
                <div className="text-xs text-gray-500">Categoría: {preview.category || "General"}</div>
                <Separator className="my-2" />
                <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                  {preview.answer}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Selecciona una FAQ para ver su vista previa.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Editor Panel */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle>{selected ? "Editar FAQ" : "Crear FAQ"}</SheetTitle>
          </SheetHeader>
          <Separator />
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <Input
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                aria-invalid={!form.title.trim()}
              />
              {!form.title.trim() && (
                <p className="text-xs text-red-600 mt-1">Ingresa un título.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Respuesta</label>
              <Textarea
                value={form.answer}
                onChange={(e) => setForm(f => ({ ...f, answer: e.target.value }))}
                rows={10}
                aria-invalid={!form.answer.trim()}
              />
              {!form.answer.trim() && (
                <p className="text-xs text-red-600 mt-1">Ingresa una respuesta.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Cuentas">Cuentas</SelectItem>
                    <SelectItem value="Tarjetas">Tarjetas</SelectItem>
                    <SelectItem value="Préstamos">Préstamos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <Select value={form.status} onValueChange={(v: "DRAFT" | "PUBLISHED") => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Borrador</SelectItem>
                    <SelectItem value="PUBLISHED">Publicada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Separator />
          <SheetFooter className="p-4 border-t bg-white sticky bottom-0">
            <div className="flex w-full justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={saveFAQ} disabled={saving || !form.title.trim() || !form.answer.trim()}>
                <Save className="mr-2 h-4 w-4" />
                Guardar
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

