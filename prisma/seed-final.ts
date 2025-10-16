import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Final Comprehensive Seed for Phase 8 - Complete System
 * 
 * This seed includes:
 * - Multiple users across all roles
 * - Multiple branches with full configuration
 * - Complete camera setup with realistic statuses
 * - Large client database with various statuses
 * - Extensive FAQ and QA knowledge base
 * - Realistic chat history
 * - Complete visit tracking
 * - Comprehensive facial recognition data
 * - Full audit trail
 */
async function main() {
  console.log('🌱 Starting FINAL comprehensive seed for Phase 8...')

  // ========== USERS (ADMIN & AGENTS) ==========
  console.log('👥 Creating users (admins and agents)...')
  
  const defaultPassword = await hash('admin123', 12)

  const users = await Promise.all([
    // Admins
    prisma.user.upsert({
      where: { email: 'rodrigo.admin@banking-agent.com' },
      update: {},
      create: {
        email: 'rodrigo.admin@banking-agent.com',
        name: 'Rodrigo VdeV',
        phone: '+51 999 000 001',
        password: defaultPassword,
        passwordUpdatedAt: new Date(),
        role: 'ADMIN',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin.principal@banking-agent.com' },
      update: {},
      create: {
        email: 'admin.principal@banking-agent.com',
        name: 'Laura Martínez',
        phone: '+51 999 000 002',
        password: defaultPassword,
        passwordUpdatedAt: new Date(),
        role: 'ADMIN',
        isActive: true,
      },
    }),
    // Agents
    prisma.user.upsert({
      where: { email: 'maria.garcia@banking-agent.com' },
      update: {},
      create: {
        email: 'maria.garcia@banking-agent.com',
        name: 'María García Sánchez',
        phone: '+51 999 111 001',
        password: defaultPassword,
        passwordUpdatedAt: new Date(),
        role: 'AGENT',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'carlos.perez@banking-agent.com' },
      update: {},
      create: {
        email: 'carlos.perez@banking-agent.com',
        name: 'Carlos Pérez Rojas',
        phone: '+51 999 111 002',
        password: defaultPassword,
        passwordUpdatedAt: new Date(),
        role: 'AGENT',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'ana.lopez@banking-agent.com' },
      update: {},
      create: {
        email: 'ana.lopez@banking-agent.com',
        name: 'Ana López Fernández',
        phone: '+51 999 111 003',
        password: defaultPassword,
        passwordUpdatedAt: new Date(),
        role: 'AGENT',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'jose.torres@banking-agent.com' },
      update: {},
      create: {
        email: 'jose.torres@banking-agent.com',
        name: 'José Torres Vargas',
        phone: '+51 999 111 004',
        password: defaultPassword,
        passwordUpdatedAt: new Date(),
        role: 'AGENT',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'lucia.ramirez@banking-agent.com' },
      update: {},
      create: {
        email: 'lucia.ramirez@banking-agent.com',
        name: 'Lucía Ramírez Castro',
        phone: '+51 999 111 005',
        password: defaultPassword,
        passwordUpdatedAt: new Date(),
        role: 'AGENT',
        isActive: false, // Inactive agent
      },
    }),
  ])

  const [admin1, admin2, agent1, agent2, agent3, agent4, agent5] = users

  // ========== BRANCHES ==========
  console.log('🏢 Creating branches (comprehensive)...')

  const branches = await Promise.all([
    prisma.branch.upsert({
      where: { code: 'SI-001' },
      update: {},
      create: {
        name: 'Sede Principal - San Isidro',
        code: 'SI-001',
        address: 'Av. Javier Prado Este 4200, San Isidro',
        city: 'Lima',
        country: 'PE',
        admins: {
          connect: [{ id: admin1.id }, { id: admin2.id }]
        }
      },
    }),
    prisma.branch.upsert({
      where: { code: 'MFL-002' },
      update: {},
      create: {
        name: 'Sucursal Miraflores',
        code: 'MFL-002',
        address: 'Av. Larco 1301, Miraflores',
        city: 'Lima',
        country: 'PE',
        admins: {
          connect: [{ id: agent1.id }]
        }
      },
    }),
    prisma.branch.upsert({
      where: { code: 'SRQ-003' },
      update: {},
      create: {
        name: 'Sucursal Surquillo',
        code: 'SRQ-003',
        address: 'Av. Angamos Este 2681, Surquillo',
        city: 'Lima',
        country: 'PE',
        admins: {
          connect: [{ id: agent2.id }]
        }
      },
    }),
    prisma.branch.upsert({
      where: { code: 'CALL-004' },
      update: {},
      create: {
        name: 'Sucursal Callao',
        code: 'CALL-004',
        address: 'Av. Sáenz Peña 456, Callao',
        city: 'Callao',
        country: 'PE',
        admins: {
          connect: [{ id: agent3.id }]
        }
      },
    }),
    prisma.branch.upsert({
      where: { code: 'SJL-005' },
      update: {},
      create: {
        name: 'Sucursal San Juan de Lurigancho',
        code: 'SJL-005',
        address: 'Av. Próceres de la Independencia 2890, SJL',
        city: 'Lima',
        country: 'PE',
        admins: {
          connect: [{ id: agent4.id }]
        }
      },
    }),
  ])

  const [branchSI, branchMFL, branchSRQ, branchCALL, branchSJL] = branches

  // ========== AGENT MODULES ==========
  console.log('🏪 Creating agent modules (comprehensive)...')

  const modules = []
  
  // San Isidro - 4 modules + 2 kiosks
  for (let i = 1; i <= 4; i++) {
    modules.push(await prisma.agentModule.upsert({
      where: { 
        branchId_code: {
          branchId: branchSI.id,
          code: `MOD-${String(i).padStart(3, '0')}`
        }
      },
      update: {},
      create: {
        branchId: branchSI.id,
        name: `Módulo de Atención ${i}`,
        code: `MOD-${String(i).padStart(3, '0')}`,
        isActive: true,
      },
    }))
  }
  for (let i = 1; i <= 2; i++) {
    modules.push(await prisma.agentModule.upsert({
      where: { 
        branchId_code: {
          branchId: branchSI.id,
          code: `KIOSK-${String(i).padStart(3, '0')}`
        }
      },
      update: {},
      create: {
        branchId: branchSI.id,
        name: `Kiosco Auto-atención ${i}`,
        code: `KIOSK-${String(i).padStart(3, '0')}`,
        isActive: true,
      },
    }))
  }

  // Other branches - 2 modules each
  for (const branch of [branchMFL, branchSRQ, branchCALL, branchSJL]) {
    for (let i = 1; i <= 2; i++) {
      modules.push(await prisma.agentModule.upsert({
        where: { 
          branchId_code: {
            branchId: branch.id,
            code: `MOD-${String(i).padStart(3, '0')}`
          }
        },
        update: {},
        create: {
          branchId: branch.id,
          name: `Módulo de Atención ${i}`,
          code: `MOD-${String(i).padStart(3, '0')}`,
          isActive: true,
        },
      }))
    }
  }

  // ========== CAMERAS ==========
  console.log('📹 Creating cameras (comprehensive)...')

  const cameras = []
  let cameraCounter = 100

  // Create cameras for each module
  for (const module of modules) {
    const status: 'ONLINE' | 'OFFLINE' | 'ERROR' = 
      Math.random() > 0.15 ? 'ONLINE' : (Math.random() > 0.5 ? 'OFFLINE' : 'ERROR')
    
    cameras.push(await prisma.camera.create({
      data: {
        branchId: module.branchId,
        moduleId: module.id,
        name: `Cámara ${module.name}`,
        streamUrl: `rtsp://192.168.${Math.floor(cameraCounter / 256)}.${cameraCounter % 256}/stream1`,
        status,
        lastHeartbeat: status === 'ONLINE' 
          ? new Date() 
          : new Date(Date.now() - 1000 * 60 * Math.floor(Math.random() * 120)),
        ownerUserId: [admin1.id, agent1.id, agent2.id][Math.floor(Math.random() * 3)],
      },
    }))
    cameraCounter++
  }

  // ========== CLIENTS ==========
  console.log('👤 Creating clients (50 clients with various statuses)...')

  const clientPassword = await hash('client123', 12)
  const clients = []

  const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Rosa', 'Pedro', 'Carmen', 'José', 'Laura', 
                      'Miguel', 'Isabel', 'Antonio', 'Elena', 'Francisco', 'Sofía', 'Manuel', 'Patricia',
                      'Ricardo', 'Daniela', 'Fernando', 'Gabriela', 'Javier', 'Valentina', 'Roberto']
  const lastNames = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez',
                     'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Vargas']

  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName1 = lastNames[Math.floor(Math.random() * lastNames.length)]
    const lastName2 = lastNames[Math.floor(Math.random() * lastNames.length)]
    const fullName = `${firstName} ${lastName1} ${lastName2}`
    const email = `${firstName.toLowerCase()}.${lastName1.toLowerCase()}${i}@email.com`
    const dni = String(10000000 + i).padStart(8, '0')
    
    // Distribute statuses: 80% ACTIVE, 15% BLOCKED, 5% DELETED
    let status: 'ACTIVE' | 'BLOCKED' | 'DELETED' = 'ACTIVE'
    if (i % 20 === 19) status = 'DELETED'
    else if (i % 7 === 6) status = 'BLOCKED'

    clients.push(await prisma.client.create({
      data: {
        dni,
        name: fullName,
        email,
        phone: `+51 9${String(87000000 + i)}`,
        status,
        hashedPassword: clientPassword,
        passwordUpdatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * Math.floor(Math.random() * 90)),
        locale: 'es-PE',
      },
    }))
  }

  // ========== FACIAL PROFILES ==========
  console.log('🤖 Creating facial profiles (for active clients)...')

  const activeClients = clients.filter(c => c.status === 'ACTIVE')
  const facialProfiles = []

  for (let i = 0; i < Math.min(activeClients.length, 35); i++) {
    const client = activeClients[i]
    const provider = ['azure-vision', 'aws-rekognition', 'opencv'][Math.floor(Math.random() * 3)]
    
    facialProfiles.push(await prisma.facialProfile.create({
      data: {
        clientId: client.id,
        provider,
        providerFaceId: `${provider}-face-${client.id}`,
        version: 'v1.0',
        embedding: { 
          vector: Array.from({ length: 128 }, () => Math.random())
        },
        imageUrl: `/uploads/faces/${client.dni}.jpg`,
        isActive: Math.random() > 0.1, // 90% active
      },
    }))
  }

  // ========== REGISTRATION REQUESTS ==========
  console.log('📝 Creating registration requests...')

  const registrationRequests = []
  
  for (let i = 0; i < 20; i++) {
    const client = clients[i]
    let status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
    
    if (i < 12) status = 'APPROVED'
    else if (i < 15) status = 'PENDING'
    else if (i < 18) status = 'REJECTED'
    else status = 'CANCELLED'

    registrationRequests.push(await prisma.registrationRequest.create({
      data: {
        clientId: client.id,
        branchId: branches[Math.floor(Math.random() * branches.length)].id,
        status,
        reason: status === 'REJECTED' ? 'Documentación incompleta' : 
                status === 'CANCELLED' ? 'Solicitado por el cliente' : undefined,
        approverId: status === 'APPROVED' || status === 'REJECTED' ? 
                   [admin1.id, admin2.id, agent1.id][Math.floor(Math.random() * 3)] : undefined,
        decidedAt: status === 'APPROVED' || status === 'REJECTED' || status === 'CANCELLED' ?
                  new Date(Date.now() - 1000 * 60 * 60 * 24 * Math.floor(Math.random() * 30)) : undefined,
      },
    }))
  }

  // ========== FAQs ==========
  console.log('❓ Creating extensive FAQ database...')

  const faqData = [
    {
      title: '¿Cómo puedo retirar dinero?',
      answer: 'Puede retirar dinero en cualquiera de nuestros módulos de atención presentando su DNI y proporcionando los datos de su cuenta. También puede usar nuestros cajeros automáticos disponibles 24/7 con su tarjeta de débito.',
      tags: ['retiro', 'dinero', 'cuenta', 'atm', 'cajero'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Cuáles son los horarios de atención?',
      answer: 'Nuestros horarios son: Lunes a Viernes de 9:00 AM a 6:00 PM, Sábados de 9:00 AM a 1:00 PM. Domingos y feriados permanecemos cerrados. Los cajeros automáticos están disponibles 24/7.',
      tags: ['horarios', 'atención', 'servicio', 'hora'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Cómo puedo abrir una cuenta?',
      answer: 'Para abrir una cuenta necesita: DNI vigente, comprobante de domicilio (recibo de luz/agua de los últimos 3 meses) y un depósito inicial de S/. 50 para cuenta de ahorros o S/. 200 para cuenta corriente. El proceso toma aproximadamente 15 minutos.',
      tags: ['cuenta', 'apertura', 'requisitos', 'documentos'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Cuánto cuesta el mantenimiento de cuenta?',
      answer: 'Cuenta de Ahorros: S/. 0 con saldo promedio de S/. 500. Cuenta Corriente: S/. 15/mes. Cuenta Premium: S/. 25/mes con beneficios adicionales (seguros, descuentos en comercios).',
      tags: ['costo', 'mantenimiento', 'cuenta', 'tarifas', 'precio'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Qué hacer si olvido mi contraseña de banca por internet?',
      answer: 'Puede recuperar su contraseña desde nuestra web usando "Olvidé mi contraseña". Recibirá un código de verificación en su celular o email registrado. También puede acercarse a cualquier sucursal con su DNI para resetearla.',
      tags: ['contraseña', 'recuperar', 'banca internet', 'seguridad', 'olvido'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Qué documentos necesito para un préstamo personal?',
      answer: 'Documentos requeridos: DNI, últimas 3 boletas de pago o declaración jurada de ingresos, comprobante de domicilio. Un ejecutivo evaluará su solicitud en 24-48 horas. Monto máximo: 20x su ingreso mensual.',
      tags: ['préstamo', 'crédito', 'documentos', 'requisitos', 'personal'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Cómo reportar una tarjeta robada o perdida?',
      answer: 'Llame INMEDIATAMENTE al 0800-12345 (disponible 24/7) o use nuestra app móvil para bloquear su tarjeta. También puede acercarse a cualquier sucursal. El bloqueo es instantáneo. Le enviaremos una nueva tarjeta en 5-7 días hábiles.',
      tags: ['tarjeta', 'robo', 'pérdida', 'seguridad', 'emergencia', 'bloqueo'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Tienen servicios de banca móvil?',
      answer: 'Sí, nuestra app BankingAgent está disponible para iOS y Android. Funciones: consulta de saldos, transferencias entre cuentas, pago de servicios, recarga de celular, localización de sucursales y cajeros.',
      tags: ['app', 'móvil', 'banca digital', 'aplicación', 'celular'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Puedo hacer transferencias internacionales?',
      answer: 'Sí, ofrecemos transferencias vía SWIFT. Costo: S/. 45 por operación. Procesamiento: 2-3 días hábiles. Necesita: cuenta activa, datos completos del beneficiario, código SWIFT del banco destino.',
      tags: ['transferencia', 'internacional', 'swift', 'envío', 'exterior'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Cuál es el límite de transferencias por día?',
      answer: 'Cuenta Básica: S/. 2,000/día. Cuenta Premium: S/. 10,000/día. Desde banca por internet: S/. 5,000/día. Desde cajero: S/. 1,500/día. Para aumentar límites, contacte a su ejecutivo de cuenta.',
      tags: ['límite', 'transferencia', 'monto', 'máximo', 'diario'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Cómo puedo pagar mis servicios (luz, agua, teléfono)?',
      answer: 'Puede pagar en: ventanilla (presentando su recibo), cajeros automáticos, banca por internet o app móvil. Sin comisión para clientes. Los pagos se acreditan en 24 horas hábiles.',
      tags: ['pago', 'servicios', 'luz', 'agua', 'teléfono', 'recibo'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Qué tipos de tarjetas de crédito ofrecen?',
      answer: 'Tarjeta Clásica: límite hasta S/. 5,000. Tarjeta Gold: límite hasta S/. 20,000 con seguros incluidos. Tarjeta Platinum: límite hasta S/. 50,000 con acceso a salas VIP y concierge.',
      tags: ['tarjeta', 'crédito', 'tipos', 'límite', 'beneficios'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Cómo solicitar un estado de cuenta?',
      answer: 'Descargue desde banca por internet o app (PDF), solicítelo en ventanilla o llame al 0800-12345. Estados digitales son gratuitos. Estados impresos enviados por correo tienen costo de S/. 5.',
      tags: ['estado', 'cuenta', 'reporte', 'movimientos', 'extracto'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Qué es el CTS y cómo lo depositan?',
      answer: 'La CTS (Compensación por Tiempo de Servicios) es un beneficio laboral. Su empleador debe depositarla en mayo y noviembre. Usted elige el banco. Nosotros ofrecemos cuenta CTS con tasa preferencial de 3.5% anual.',
      tags: ['cts', 'compensación', 'depósito', 'laboral', 'beneficio'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Ofrecen seguros?',
      answer: 'Sí, ofrecemos: Seguro de Desgravamen (préstamos), Seguro contra Fraude (tarjetas), Seguro de Vida, Seguro Vehicular, Seguro de Hogar. Consulte condiciones con un asesor.',
      tags: ['seguro', 'protección', 'cobertura', 'vida', 'fraude'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Cómo activar mi tarjeta de débito nueva?',
      answer: 'Actívela en: cualquier cajero automático (inserte y cree su PIN), banca por internet, o llamando al 0800-12345. La activación es instantánea.',
      tags: ['activar', 'tarjeta', 'débito', 'nueva', 'pin'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Puedo solicitar un préstamo si tengo deudas en otra institución?',
      answer: 'Sí, evaluamos cada caso individualmente. Analizamos: historial crediticio, ratio de endeudamiento (máx 40% de sus ingresos), antigüedad laboral mínima 6 meses.',
      tags: ['préstamo', 'deuda', 'crédito', 'evaluación', 'historial'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Qué comisiones cobran por operaciones?',
      answer: 'Retiro en cajero propio: S/. 0. Retiro en cajero de otro banco: S/. 5. Transferencias a otros bancos: S/. 8. Consulta de saldo en ventanilla: S/. 2. Mantenimiento según tipo de cuenta.',
      tags: ['comisión', 'costo', 'operación', 'tarifa', 'cobro'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Cómo puedo reclamar por un cargo no reconocido?',
      answer: 'Presente su reclamo en cualquier sucursal con DNI y detalle de la operación, o desde banca por internet sección "Reclamos". Tiene 60 días desde el cargo. Investigamos en máximo 30 días.',
      tags: ['reclamo', 'cargo', 'fraude', 'no reconocido', 'disputa'],
      status: 'PUBLISHED' as const
    },
    {
      title: '¿Puedo cerrar mi cuenta? ¿Qué requisitos hay?',
      answer: 'Sí, puede cerrar su cuenta acercándose a cualquier sucursal con DNI. Requisitos: saldar deudas pendientes, no tener cheques por cobrar, devolver tarjetas. Sin costo de cierre.',
      tags: ['cerrar', 'cuenta', 'cancelar', 'cierre', 'requisitos'],
      status: 'PUBLISHED' as const
    },
  ]

  const faqs = []
  for (let i = 0; i < faqData.length; i++) {
    faqs.push(await prisma.fAQ.create({
      data: {
        ...faqData[i]
      }
    }))
  }

  // Add some draft FAQs
  faqs.push(await prisma.fAQ.create({
    data: {
      title: '¿Cómo funciona el nuevo sistema de reconocimiento facial?',
      answer: 'El sistema identifica automáticamente a clientes registrados al entrar a la sucursal, agilizando su atención. Es opcional y seguro.',
      tags: ['facial', 'reconocimiento', 'tecnología', 'identificación'],
      status: 'DRAFT'
    }
  }))

  // ========== QA PAIRS ==========
  console.log('💬 Creating QA pairs (comprehensive knowledge base)...')

  const qaPairs = await Promise.all([
    prisma.qAPair.create({
      data: {
        question: '¿Dónde están ubicadas sus sucursales?',
        answer: 'Tenemos 5 sucursales en Lima: San Isidro (Av. Javier Prado Este 4200), Miraflores (Av. Larco 1301), Surquillo (Av. Angamos Este 2681), Callao (Av. Sáenz Peña 456), y San Juan de Lurigancho (Av. Próceres 2890).',
        metadata: { category: 'ubicaciones', priority: 'high', lastReview: new Date().toISOString() },
        isActive: true,
      },
    }),
    prisma.qAPair.create({
      data: {
        question: '¿Cuál es el monto mínimo para apertura de cuenta?',
        answer: 'Cuenta de Ahorros: S/. 50. Cuenta Corriente: S/. 200. Cuenta Premium: S/. 500.',
        metadata: { category: 'cuentas', priority: 'high' },
        isActive: true,
      },
    }),
    prisma.qAPair.create({
      data: {
        question: '¿Cuánto demora una transferencia interbancaria?',
        answer: 'Transferencias interbancarias inmediatas (hasta S/. 10,000) se acreditan en segundos. Montos mayores se procesan en el siguiente día hábil.',
        metadata: { category: 'transferencias', priority: 'high' },
        isActive: true,
      },
    }),
    prisma.qAPair.create({
      data: {
        question: '¿Tienen estacionamiento?',
        answer: 'Sí, todas nuestras sucursales cuentan con estacionamiento gratuito para clientes. Capacidad limitada, sujeto a disponibilidad.',
        metadata: { category: 'servicios', priority: 'medium' },
        isActive: true,
      },
    }),
    prisma.qAPair.create({
      data: {
        question: '¿Puedo pagar mi tarjeta de crédito desde otro banco?',
        answer: 'Sí, puede realizar transferencias desde cualquier banco a nuestra cuenta CCI: 002-123-456789012345-67. El pago se refleja en 24 horas hábiles.',
        metadata: { category: 'pagos', priority: 'high' },
        isActive: true,
      },
    }),
    prisma.qAPair.create({
      data: {
        question: '¿Qué documentos adicionales necesito para un crédito hipotecario?',
        answer: 'Además de los documentos básicos: copia de DNI del cónyuge, minuta de compraventa, certificado de gravamen, tasación de inmueble, y declaración de impuestos (últimos 2 años para independientes).',
        metadata: { category: 'créditos', priority: 'medium' },
        isActive: true,
      },
    }),
    prisma.qAPair.create({
      data: {
        question: '¿Cómo reportar un cajero que no entregó dinero?',
        answer: 'Llame inmediatamente al 0800-12345 con el número de operación y ubicación del cajero. No se retire hasta ser atendido. Regularizamos en 24-48 horas.',
        metadata: { category: 'reclamos', priority: 'high' },
        isActive: true,
      },
    }),
    prisma.qAPair.create({
      data: {
        question: '¿Ofrecen asesoría financiera personalizada?',
        answer: 'Sí, clientes Premium tienen acceso a un ejecutivo de cuenta personal. Otros clientes pueden agendar citas con nuestros asesores financieros.',
        metadata: { category: 'servicios', priority: 'low' },
        isActive: true,
      },
    }),
  ])

  // ========== CHAT SESSIONS ==========
  console.log('💬 Creating chat sessions (realistic conversations)...')

  const chatSessions = []
  
  // Create 30 chat sessions with realistic conversations
  for (let i = 0; i < 30; i++) {
    const client = activeClients[Math.floor(Math.random() * activeClients.length)]
    const startTime = new Date(Date.now() - 1000 * 60 * 60 * 24 * Math.floor(Math.random() * 30))
    const hasEnded = Math.random() > 0.2
    
    const session = await prisma.chatSession.create({
      data: {
        clientId: Math.random() > 0.1 ? client.id : undefined,
        tempVisitorId: Math.random() > 0.9 ? `temp-${Date.now()}-${i}` : undefined,
        startedAt: startTime,
        endedAt: hasEnded ? new Date(startTime.getTime() + 1000 * 60 * Math.floor(Math.random() * 15 + 3)) : undefined,
      },
    })
    chatSessions.push(session)

    // Add messages to each session
    const conversationTemplates = [
      [
        { actor: 'CLIENT' as const, content: '¿Cuáles son los horarios?', intent: 'horarios' },
        { actor: 'BOT' as const, content: 'Nuestros horarios son de lunes a viernes de 9:00 AM a 6:00 PM, y sábados de 9:00 AM a 1:00 PM.', intent: 'horarios' },
      ],
      [
        { actor: 'CLIENT' as const, content: 'Quiero abrir una cuenta', intent: 'apertura_cuenta' },
        { actor: 'BOT' as const, content: 'Con gusto te ayudo. Para abrir una cuenta necesitas: DNI vigente, comprobante de domicilio y un depósito inicial de S/. 50. ¿Deseas agendar una cita?', intent: 'apertura_cuenta' },
        { actor: 'CLIENT' as const, content: 'Sí, para mañana', intent: 'agendar' },
      ],
      [
        { actor: 'CLIENT' as const, content: 'Olvidé mi contraseña', intent: 'recuperar_password' },
        { actor: 'BOT' as const, content: 'Puedes recuperarla desde nuestra web o app. ¿Prefieres que te ayude con el proceso?', intent: 'recuperar_password' },
      ],
    ]

    const template = conversationTemplates[Math.floor(Math.random() * conversationTemplates.length)]
    
    for (let j = 0; j < template.length; j++) {
      await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          actor: template[j].actor,
          content: template[j].content,
          intent: template[j].intent,
          metadata: template[j].actor === 'BOT' ? { confidence: 0.85 + Math.random() * 0.15 } : undefined,
          createdAt: new Date(startTime.getTime() + 1000 * 60 * j),
        },
      })
    }
  }

  // ========== VISITS ==========
  console.log('🚶 Creating visits (comprehensive visit history)...')

  const visits = []
  const visitPurposes = ['Retiro de dinero', 'Consulta de saldo', 'Apertura de cuenta', 'Pago de servicios', 
                         'Actualización de datos', 'Reclamo', 'Asesoría financiera', 'Solicitud de préstamo']

  for (let i = 0; i < 100; i++) {
    const client = activeClients[Math.floor(Math.random() * activeClients.length)]
    const branch = branches[Math.floor(Math.random() * branches.length)]
    const branchModules = modules.filter(m => m.branchId === branch.id && !m.code.includes('KIOSK'))
    const module = branchModules[Math.floor(Math.random() * branchModules.length)]
    
    const startTime = new Date(Date.now() - 1000 * 60 * 60 * 24 * Math.floor(Math.random() * 30))
    
    let status: 'WAITING' | 'IN_SERVICE' | 'COMPLETED' | 'ABANDONED'
    if (i < 5) status = 'WAITING'
    else if (i < 10) status = 'IN_SERVICE'
    else if (i < 15) status = 'ABANDONED'
    else status = 'COMPLETED'

    visits.push(await prisma.visit.create({
      data: {
        clientId: client.id,
        branchId: branch.id,
        moduleId: module.id,
        status,
        purpose: visitPurposes[Math.floor(Math.random() * visitPurposes.length)],
        startedAt: startTime,
        assignedAt: status !== 'WAITING' ? new Date(startTime.getTime() + 1000 * 60 * Math.floor(Math.random() * 5 + 1)) : undefined,
        finishedAt: status === 'COMPLETED' || status === 'ABANDONED' ? 
                   new Date(startTime.getTime() + 1000 * 60 * Math.floor(Math.random() * 20 + 5)) : undefined,
      },
    }))
  }

  // ========== DETECTION EVENTS ==========
  console.log('🔍 Creating detection events (facial recognition history)...')

  const detectionEvents = []
  
  for (let i = 0; i < 200; i++) {
    const camera = cameras[Math.floor(Math.random() * cameras.length)]
    const shouldMatch = Math.random() > 0.3
    const client = shouldMatch ? activeClients[Math.floor(Math.random() * Math.min(activeClients.length, 35))] : undefined
    
    let status: 'MATCHED' | 'NEW_FACE' | 'MULTIPLE_MATCHES' | 'UNKNOWN'
    if (client && Math.random() > 0.05) status = 'MATCHED'
    else if (Math.random() > 0.7) status = 'NEW_FACE'
    else if (Math.random() > 0.9) status = 'MULTIPLE_MATCHES'
    else status = 'UNKNOWN'

    detectionEvents.push(await prisma.detectionEvent.create({
      data: {
        cameraId: camera.id,
        clientId: status === 'MATCHED' ? client?.id : undefined,
        status,
        confidence: status === 'MATCHED' ? 0.85 + Math.random() * 0.15 : Math.random() * 0.5,
        snapshotUrl: `/uploads/detections/detection-${String(i).padStart(6, '0')}.jpg`,
        metadata: {
          boundingBox: {
            x: Math.floor(Math.random() * 200),
            y: Math.floor(Math.random() * 150),
            width: Math.floor(Math.random() * 100 + 150),
            height: Math.floor(Math.random() * 120 + 180)
          },
          processingTime: Math.floor(Math.random() * 500 + 200)
        },
        occurredAt: new Date(Date.now() - 1000 * 60 * Math.floor(Math.random() * 60 * 24 * 7)),
      },
    }))
  }

  // ========== AUDIT LOGS ==========
  console.log('📋 Creating comprehensive audit logs...')

  const auditActions = [
    'REGISTRATION_APPROVED',
    'REGISTRATION_REJECTED',
    'CLIENT_BLOCKED',
    'CLIENT_UNBLOCKED',
    'PASSWORD_RESET',
    'FAQ_PUBLISHED',
    'FAQ_ARCHIVED',
    'CAMERA_CONFIGURED',
    'USER_CREATED',
    'BRANCH_CREATED',
  ]

  const auditLogs = []
  
  for (let i = 0; i < 150; i++) {
    const actor = users[Math.floor(Math.random() * users.length)]
    const action = auditActions[Math.floor(Math.random() * auditActions.length)]
    const targetClient = Math.random() > 0.5 ? activeClients[Math.floor(Math.random() * activeClients.length)] : undefined

    auditLogs.push(await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        targetClientId: targetClient?.id,
        action,
        details: {
          action,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * Math.floor(Math.random() * 24 * 30)).toISOString(),
          ip: `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
          userAgent: 'Mozilla/5.0 (compatible; BankingAgent/1.0)'
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * Math.floor(Math.random() * 24 * 30)),
      },
    }))
  }

  // ========== CAMERA LOGS ==========
  console.log('📹 Creating camera logs...')

  const logLevels = ['INFO', 'WARN', 'ERROR']
  const logMessages = {
    INFO: [
      'Camera stream started successfully',
      'Heartbeat received',
      'Frame processed successfully',
      'Connection established',
    ],
    WARN: [
      'Low frame rate detected',
      'High latency detected',
      'Memory usage above 80%',
      'Network instability',
    ],
    ERROR: [
      'Connection timeout',
      'Stream interrupted',
      'Authentication failed',
      'Hardware malfunction detected',
    ],
  }

  for (let i = 0; i < 500; i++) {
    const camera = cameras[Math.floor(Math.random() * cameras.length)]
    const level = logLevels[Math.floor(Math.random() * logLevels.length)]
    const messages = logMessages[level as keyof typeof logMessages]
    const message = messages[Math.floor(Math.random() * messages.length)]

    await prisma.cameraLog.create({
      data: {
        cameraId: camera.id,
        level,
        message,
        meta: {
          level,
          timestamp: new Date(Date.now() - 1000 * 60 * Math.floor(Math.random() * 60 * 24 * 7)).toISOString(),
          fps: Math.floor(Math.random() * 30 + 15),
          resolution: ['1920x1080', '1280x720', '1024x768'][Math.floor(Math.random() * 3)]
        },
        createdAt: new Date(Date.now() - 1000 * 60 * Math.floor(Math.random() * 60 * 24 * 7)),
      },
    })
  }

  console.log('\n✅ FINAL COMPREHENSIVE SEED COMPLETED!')
  console.log('\n📊 COMPLETE SUMMARY:')
  console.log(`   👥 Users: ${users.length} (2 admins, ${users.length - 2} agents)`)
  console.log(`   🏢 Branches: ${branches.length}`)
  console.log(`   🏪 Modules: ${modules.length}`)
  console.log(`   📹 Cameras: ${cameras.length}`)
  console.log(`   👤 Clients: ${clients.length}`)
  console.log(`   🤖 Facial Profiles: ${facialProfiles.length}`)
  console.log(`   📝 Registration Requests: ${registrationRequests.length}`)
  console.log(`   ❓ FAQs: ${faqs.length}`)
  console.log(`   💬 QA Pairs: ${qaPairs.length}`)
  console.log(`   💬 Chat Sessions: ${chatSessions.length}`)
  console.log(`   🚶 Visits: ${visits.length}`)
  console.log(`   🔍 Detection Events: ${detectionEvents.length}`)
  console.log(`   📋 Audit Logs: ${auditLogs.length}`)
  console.log(`   📹 Camera Logs: 500+`)
  console.log('\n🔐 Test Credentials:')
  console.log(`   Admin:  rodrigo.admin@banking-agent.com / admin123`)
  console.log(`   Agent:  maria.garcia@banking-agent.com / admin123`)
  console.log(`   Client: (any from the 50 generated) / client123`)
  console.log('\n📝 Note: All passwords are "admin123" for testing')
  console.log('   Users (admins/agents) authenticate via NextAuth.js')
  console.log('   Clients authenticate with Credentials provider')
  console.log('\n🚀 System ready for Phase 8 - Full production simulation!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

