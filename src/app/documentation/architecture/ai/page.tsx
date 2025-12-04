import Link from "next/link"
import { CodeBlock } from "@/components/documentation/code-block"
import { DocAlert } from "@/components/documentation/doc-alert"
import { DocNavigation } from "@/components/documentation/doc-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ArchitectureAIPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Arquitectura de IA</h1>
        <p className="text-xl text-muted-foreground">
          Detalles sobre los componentes de Inteligencia Artificial: reconocimiento facial y chatbot.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Reconocimiento Facial</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Pipeline de Procesamiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Captura de Video</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Dispositivo: ESP32 Camera Module</li>
                <li>Formato: MJPEG stream HTTP</li>
                <li>FPS: 10-30 frames por segundo</li>
                <li>Protocolo: HTTP streaming en puerto 81</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Procesamiento en Flask API</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Tecnología: Python + OpenCV + face_recognition
              </p>
              <CodeBlock
                code={`# Ejemplo de procesamiento
cap = cv2.VideoCapture(stream_url)
ret, frame = cap.read()

# Redimensionamiento para acelerar
small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

# Detección de rostros
face_locations = face_recognition.face_locations(rgb_small_frame, model="hog")

# Encoding de rostros detectados
face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)`}
                language="python"
              />
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Modelo de Encoding Facial</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Algoritmo: HOG (Histogram of Oriented Gradients) + CNN</li>
                <li>Dimensionalidad: 128 números de punto flotante</li>
                <li>Precisión: ~99.38% en Labeled Faces in the Wild</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. Comparación y Matching</h3>
              <CodeBlock
                code={`def compare_faces(known_encoding, face_encoding, threshold=0.6):
    distance = np.linalg.norm(known_encoding - face_encoding)
    match = distance <= threshold
    confidence = 1 - min(distance, 1.0)
    return match, distance, confidence

# Umbrales:
# distance < 0.4: Muy alta confianza (>90%)
# distance < 0.6: Alta confianza (80-90%)
# distance >= 0.6: No match o baja confianza`}
                language="python"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Arquitectura del Chatbot</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Pipeline de Procesamiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Recepción de Consulta</h3>
              <p className="text-sm text-muted-foreground">
                Endpoint: POST /api/chat con validaciones de sanitización, rate limiting y CSRF protection.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Recuperación de Contexto</h3>
              <CodeBlock
                code={`// Buscar FAQs relevantes
const faqResults = await faqSearch(query, [], 3)

// Buscar QA pairs relevantes
const qaResults = await qaSearch(query, 3)

// Contexto relevante
const context = {
  faqs: faqResults.items,
  qaPairs: qaResults.items
}`}
                language="typescript"
              />
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Generación de Respuesta (Rule-based)</h3>
              <CodeBlock
                code={`async generateResponse(query: string, context: RelevantContext) {
  // Priorizar FAQs con alta relevancia
  if (context.faqs.length > 0 && context.faqs[0].relevance > 0.6) {
    return {
      response: context.faqs[0].answer,
      intent: 'faq',
      confidence: context.faqs[0].relevance
    }
  }
  
  // Fallback a QA pairs
  else if (context.qaPairs.length > 0 && context.qaPairs[0].relevance > 0.6) {
    return {
      response: context.qaPairs[0].answer,
      intent: 'qa',
      confidence: context.qaPairs[0].relevance
    }
  }
  
  // Respuesta por defecto
  return {
    response: getDefaultResponse(query),
    intent: 'default',
    confidence: 0.3
  }
}`}
                language="typescript"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Futuras Mejoras</h2>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Integración con LLM</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Compatible con OpenAI GPT, Claude, o modelos locales como Ollama para mejor comprensión del lenguaje natural.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Embeddings Vectoriales</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Generar embeddings de FAQs/QA y usar búsqueda semántica con similaridad coseno para mejor matching.
            </CardContent>
          </Card>
        </div>
      </section>

      <DocAlert type="info">
        Para más detalles técnicos, consulta el documento completo en{" "}
        <Link href="/docs/ARQUITECTURA_IA.md" className="underline">docs/ARQUITECTURA_IA.md</Link>
      </DocAlert>

      {/* Navigation */}
      <DocNavigation />
    </div>
  )
}

