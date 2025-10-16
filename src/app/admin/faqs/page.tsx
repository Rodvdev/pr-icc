"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Edit, Trash2, CheckCircle } from "lucide-react"
import type { FAQ, QAPair } from "@prisma/client"

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [qaPairs, setQaPairs] = useState<QAPair[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [faqsRes, qaRes] = await Promise.all([
        fetch("/api/faqs"),
        fetch("/api/qa")
      ])
      
      const [faqsData, qaData] = await Promise.all([
        faqsRes.json(),
        qaRes.json()
      ])
      
      if (faqsData.success) setFaqs(faqsData.data)
      if (qaData.success) setQaPairs(qaData.data)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (id: string) => {
    try {
      const response = await fetch(`/api/faqs/${id}/publish`, {
        method: "POST"
      })
      
      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error publishing FAQ:", error)
    }
  }

  const filteredFaqs = faqs.filter(faq =>
    faq.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredQAs = qaPairs.filter(qa =>
    qa.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    qa.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Base de Conocimiento</h1>
          <p className="text-gray-600 mt-1">
            Gestiona FAQs y dataset para el chatbot
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            Refrescar Dataset
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva FAQ
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{faqs.length}</div>
            <p className="text-sm text-gray-600">Total FAQs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {faqs.filter(f => f.status === "PUBLISHED").length}
            </div>
            <p className="text-sm text-gray-600">Publicadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {faqs.filter(f => f.status === "DRAFT").length}
            </div>
            <p className="text-sm text-gray-600">Borradores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{qaPairs.length}</div>
            <p className="text-sm text-gray-600">Pares QA</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar en la base de conocimiento..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="faqs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="faqs">FAQs ({faqs.length})</TabsTrigger>
          <TabsTrigger value="qa">Pares QA ({qaPairs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="faqs" className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Cargando...</div>
          ) : filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No se encontraron FAQs
            </div>
          ) : (
            filteredFaqs.map((faq) => (
              <Card key={faq.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{faq.title}</h3>
                        <Badge variant={
                          faq.status === "PUBLISHED" ? "default" :
                          faq.status === "DRAFT" ? "secondary" :
                          "outline"
                        }>
                          {faq.status}
                        </Badge>
                        {faq.tags.length > 0 && (
                          <div className="flex gap-1">
                            {faq.tags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {faq.answer}
                      </p>
                      {faq.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {faq.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {faq.status === "DRAFT" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePublish(faq.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Publicar
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="qa" className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Cargando...</div>
          ) : filteredQAs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No se encontraron pares QA
            </div>
          ) : (
            filteredQAs.map((qa) => (
              <Card key={qa.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{qa.question}</h3>
                        <Badge variant={qa.isActive ? "default" : "secondary"}>
                          {qa.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {qa.answer}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

