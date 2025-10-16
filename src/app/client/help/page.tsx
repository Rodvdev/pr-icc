"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  MapPin,
  Send,
  CheckCircle2,
  Clock,
  CreditCard,
  Lock,
  FileText,
  Users,
  AlertCircle
} from "lucide-react"

interface FAQ {
  question: string
  answer: string
  category: string
  icon: typeof HelpCircle
}

/**
 * Página de ayuda y soporte para clientes
 * - FAQs por categoría
 * - Formulario de contacto
 * - Información de contacto
 * - Enlaces rápidos
 */
export default function ClientHelpPage() {
  const [supportForm, setSupportForm] = useState({
    subject: '',
    category: 'general',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const faqs: FAQ[] = [
    // Cuenta y Seguridad
    {
      category: 'account',
      icon: Lock,
      question: '¿Cómo cambio mi contraseña?',
      answer: 'Puedes cambiar tu contraseña desde tu perfil. Ve a "Perfil" → "Seguridad" → "Cambiar Contraseña". Necesitarás ingresar tu contraseña actual y la nueva contraseña dos veces para confirmar.'
    },
    {
      category: 'account',
      icon: Lock,
      question: '¿Qué hago si olvidé mi contraseña?',
      answer: 'Si olvidaste tu contraseña, puedes restablecerla desde la página de inicio de sesión. Haz clic en "¿Olvidaste tu contraseña?" y sigue las instrucciones. Recibirás un correo electrónico con un enlace para crear una nueva contraseña.'
    },
    {
      category: 'account',
      icon: Lock,
      question: '¿Cómo actualizo mi información personal?',
      answer: 'Ve a "Perfil" en el menú principal. Allí podrás actualizar tu nombre, email, teléfono y otros datos personales. Algunos cambios pueden requerir verificación adicional por seguridad.'
    },
    {
      category: 'account',
      icon: Lock,
      question: '¿Mi cuenta está segura?',
      answer: 'Sí, utilizamos encriptación de grado bancario y autenticación segura. Tu contraseña está hasheada y nunca la almacenamos en texto plano. Además, registramos todas las actividades importantes para tu seguridad.'
    },
    
    // Visitas y Citas
    {
      category: 'visits',
      icon: Clock,
      question: '¿Cómo puedo ver mis visitas anteriores?',
      answer: 'Ve a la sección "Visitas" en el menú principal. Allí encontrarás un historial completo de todas tus visitas al banco, incluyendo fecha, propósito y estado de cada una.'
    },
    {
      category: 'visits',
      icon: Clock,
      question: '¿Puedo agendar una cita con anticipación?',
      answer: 'Actualmente, el sistema de citas está en desarrollo. Por ahora, puedes visitarnos directamente y el sistema de reconocimiento facial te identificará automáticamente para agilizar tu atención.'
    },
    {
      category: 'visits',
      icon: Clock,
      question: '¿Qué es el reconocimiento facial y cómo funciona?',
      answer: 'El reconocimiento facial es una tecnología que permite identificarte automáticamente cuando llegas al banco. Tu foto se registró cuando creaste tu cuenta y se compara con las capturas de las cámaras en el módulo. Esto agiliza tu atención y mejora tu seguridad.'
    },
    
    // Servicios y Transacciones
    {
      category: 'services',
      icon: CreditCard,
      question: '¿Qué servicios puedo realizar en los módulos?',
      answer: 'En nuestros módulos puedes realizar retiros de dinero, depósitos, pagos de servicios, consultas de saldo, actualización de datos, y recibir asesoría personalizada sobre productos bancarios.'
    },
    {
      category: 'services',
      icon: CreditCard,
      question: '¿Cuál es el horario de atención?',
      answer: 'Nuestro horario de atención es de lunes a viernes de 9:00 AM a 6:00 PM, y sábados de 9:00 AM a 1:00 PM. Los cajeros automáticos están disponibles 24/7.'
    },
    {
      category: 'services',
      icon: CreditCard,
      question: '¿Hay límites en las transacciones?',
      answer: 'Sí, por seguridad tenemos límites diarios: retiros hasta S/ 2,000, transferencias hasta S/ 10,000. Para montos mayores, puedes solicitarlo con anticipación o realizar la operación en ventanilla con verificación adicional.'
    },
    
    // Documentos
    {
      category: 'documents',
      icon: FileText,
      question: '¿Dónde puedo ver mis documentos?',
      answer: 'Ve a la sección "Documentos" en el menú principal. Allí encontrarás todos tus estados de cuenta, certificados, constancias y otros documentos importantes que puedes descargar en formato PDF.'
    },
    {
      category: 'documents',
      icon: FileText,
      question: '¿Cómo descargo un estado de cuenta?',
      answer: 'En la sección "Documentos", selecciona "Estados de Cuenta", elige el periodo que necesitas y haz clic en el botón de descarga. El documento se generará automáticamente en formato PDF.'
    },
    
    // Soporte Técnico
    {
      category: 'technical',
      icon: AlertCircle,
      question: '¿Qué hago si el sistema no reconoce mi rostro?',
      answer: 'Si el sistema no te reconoce, asegúrate de estar bien iluminado y mirando directamente a la cámara. Si el problema persiste, puedes iniciar sesión manualmente con tu DNI y contraseña, o solicitar ayuda a un asesor en el mostrador.'
    },
    {
      category: 'technical',
      icon: AlertCircle,
      question: '¿Por qué no puedo acceder al sistema?',
      answer: 'Verifica que tu cuenta esté activa y que estés usando las credenciales correctas. Si tu cuenta fue bloqueada por seguridad o tienes problemas técnicos, contacta a soporte o acércate a una sucursal con tu DNI.'
    },
    {
      category: 'technical',
      icon: AlertCircle,
      question: '¿El sistema funciona en mi celular?',
      answer: 'Sí, nuestro sistema es completamente responsive y funciona en dispositivos móviles. Para mejor experiencia, recomendamos usar un navegador actualizado como Chrome, Safari o Firefox.'
    }
  ]

  const categories = [
    { id: 'all', name: 'Todas', icon: HelpCircle },
    { id: 'account', name: 'Cuenta y Seguridad', icon: Lock },
    { id: 'visits', name: 'Visitas y Citas', icon: Clock },
    { id: 'services', name: 'Servicios', icon: CreditCard },
    { id: 'documents', name: 'Documentos', icon: FileText },
    { id: 'technical', name: 'Soporte Técnico', icon: AlertCircle }
  ]

  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredFaqs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory)

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simular envío (en producción, llamar a API)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // TODO: Implementar endpoint real
      // await fetch('/api/client/support', {
      //   method: 'POST',
      //   body: JSON.stringify(supportForm)
      // })

      setIsSubmitted(true)
      setSupportForm({ subject: '', category: 'general', message: '' })
    } catch (error) {
      console.error('Error enviando formulario:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Centro de Ayuda</h1>
          <p className="text-gray-600 mt-1">
            Encuentra respuestas a tus preguntas o contáctanos
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Chat en Vivo</h3>
              <p className="text-sm text-gray-600 mb-3">
                Habla con nuestro asistente virtual
              </p>
              <Button size="sm" className="w-full">
                Iniciar Chat
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Llámanos</h3>
              <p className="text-sm text-gray-600 mb-2">
                Lunes a Viernes 9AM - 6PM
              </p>
              <a href="tel:08001234" className="text-sm font-semibold text-blue-600 hover:underline">
                0800-1234
              </a>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
              <p className="text-sm text-gray-600 mb-2">
                Te respondemos en 24 horas
              </p>
              <a href="mailto:soporte@banco.pe" className="text-sm font-semibold text-blue-600 hover:underline">
                soporte@banco.pe
              </a>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="faqs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="faqs">
            <HelpCircle className="w-4 h-4 mr-2" />
            Preguntas Frecuentes
          </TabsTrigger>
          <TabsTrigger value="contact">
            <Send className="w-4 h-4 mr-2" />
            Contactar Soporte
          </TabsTrigger>
        </TabsList>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-6">
          {/* Category Filter */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{category.name}</span>
                  </Button>
                )
              })}
            </div>
          </Card>

          {/* FAQs List */}
          <Card className="p-6">
            <Accordion type="single" collapsible className="space-y-2">
              {filteredFaqs.map((faq, index) => {
                const Icon = faq.icon
                return (
                  <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center space-x-3 text-left">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pl-11 text-gray-600">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>

            {filteredFaqs.length === 0 && (
              <div className="text-center py-12">
                <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No se encontraron preguntas en esta categoría</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Contact Form */}
            <Card className="lg:col-span-2 p-6">
              {!isSubmitted ? (
                <form onSubmit={handleSupportSubmit} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      Envíanos un Mensaje
                    </h2>
                    <p className="text-sm text-gray-600">
                      Completa el formulario y te responderemos lo antes posible
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Asunto *</Label>
                      <Input
                        id="subject"
                        placeholder="Describe brevemente tu consulta"
                        value={supportForm.subject}
                        onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Categoría *</Label>
                      <select
                        id="category"
                        value={supportForm.category}
                        onChange={(e) => setSupportForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="general">General</option>
                        <option value="account">Cuenta y Seguridad</option>
                        <option value="visits">Visitas</option>
                        <option value="services">Servicios</option>
                        <option value="documents">Documentos</option>
                        <option value="technical">Soporte Técnico</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensaje *</Label>
                      <Textarea
                        id="message"
                        placeholder="Describe tu consulta con el mayor detalle posible..."
                        value={supportForm.message}
                        onChange={(e) => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
                        rows={6}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Mensaje
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">¡Mensaje Enviado!</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Hemos recibido tu consulta. Te responderemos por correo electrónico 
                    en un plazo máximo de 24 horas hábiles.
                  </p>
                  <Button
                    onClick={() => setIsSubmitted(false)}
                    variant="outline"
                  >
                    Enviar Otro Mensaje
                  </Button>
                </div>
              )}
            </Card>

            {/* Contact Info */}
            <div className="space-y-4">
              <Card className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Información de Contacto</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Teléfono</p>
                      <p className="text-sm text-gray-600">0800-1234</p>
                      <p className="text-xs text-gray-500">Lun-Vie 9AM-6PM</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">soporte@banco.pe</p>
                      <p className="text-xs text-gray-500">Respuesta en 24h</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Oficina Principal</p>
                      <p className="text-sm text-gray-600">Av. Principal 123</p>
                      <p className="text-xs text-gray-500">Lima, Perú</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Redes Sociales</p>
                      <div className="flex space-x-2 mt-1">
                        <a href="#" className="text-xs text-blue-600 hover:underline">Facebook</a>
                        <span className="text-gray-300">•</span>
                        <a href="#" className="text-xs text-blue-600 hover:underline">Twitter</a>
                        <span className="text-gray-300">•</span>
                        <a href="#" className="text-xs text-blue-600 hover:underline">Instagram</a>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Atención de Emergencia
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Para reportar tarjetas robadas o perdidas, bloqueo de cuenta 
                  por seguridad, o fraude:
                </p>
                <Button variant="default" size="sm" className="w-full bg-red-600 hover:bg-red-700">
                  <Phone className="w-4 h-4 mr-2" />
                  Línea de Emergencia
                </Button>
                <p className="text-xs text-gray-600 text-center mt-2">
                  Disponible 24/7
                </p>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Additional Resources */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recursos Adicionales</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <a href="#" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Guías y Tutoriales</h3>
            <p className="text-sm text-gray-600">Aprende a usar todas las funciones del sistema</p>
          </a>

          <a href="#" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <Lock className="w-8 h-8 text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Políticas de Seguridad</h3>
            <p className="text-sm text-gray-600">Conoce cómo protegemos tu información</p>
          </a>

          <a href="#" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <AlertCircle className="w-8 h-8 text-orange-600 mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Términos y Condiciones</h3>
            <p className="text-sm text-gray-600">Lee nuestros términos de servicio</p>
          </a>
        </div>
      </Card>
    </div>
  )
}

