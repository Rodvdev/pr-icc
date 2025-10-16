import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed for Phase 1-2 development...')

  // ========== USERS (ADMIN & AGENTS) ==========
  console.log('👥 Creating users...')
  
  const defaultPassword = await hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@banking-agent.com' },
    update: {},
    create: {
      email: 'admin@banking-agent.com',
      name: 'Admin',
      phone: '+51 999 888 777',
      password: defaultPassword,
      passwordUpdatedAt: new Date(),
      role: 'ADMIN',
      isActive: true,
    },
  })

  const agent1 = await prisma.user.upsert({
    where: { email: 'agent1@banking-agent.com' },
    update: {},
    create: {
      email: 'agent1@banking-agent.com',
      name: 'María García',
      phone: '+51 999 111 222',
      password: defaultPassword,
      passwordUpdatedAt: new Date(),
      role: 'AGENT',
      isActive: true,
    },
  })

  const agent2 = await prisma.user.upsert({
    where: { email: 'agent2@banking-agent.com' },
    update: {},
    create: {
      email: 'agent2@banking-agent.com',
      name: 'Carlos Pérez',
      phone: '+51 999 333 444',
      password: defaultPassword,
      passwordUpdatedAt: new Date(),
      role: 'AGENT',
      isActive: true,
    },
  })

  // ========== BRANCHES ==========
  console.log('🏢 Creating branches...')

  const mainBranch = await prisma.branch.upsert({
    where: { code: 'MAIN-001' },
    update: {},
    create: {
      name: 'Sede Principal - San Isidro',
      code: 'MAIN-001',
      address: 'Av. Javier Prado Este 4200, San Isidro',
      city: 'Lima',
      country: 'PE',
      admins: {
        connect: [{ id: admin.id }]
      }
    },
  })

  const mirafloresBranch = await prisma.branch.upsert({
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
  })

  const surquilloBranch = await prisma.branch.upsert({
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
  })

  // ========== AGENT MODULES ==========
  console.log('🏪 Creating agent modules...')

  const modules = await Promise.all([
    // Main Branch Modules
    prisma.agentModule.upsert({
      where: { 
        branchId_code: {
          branchId: mainBranch.id,
          code: 'MOD-001'
        }
      },
      update: {},
      create: {
        branchId: mainBranch.id,
        name: 'Módulo de Atención 1',
        code: 'MOD-001',
        isActive: true,
      },
    }),
    prisma.agentModule.upsert({
      where: { 
        branchId_code: {
          branchId: mainBranch.id,
          code: 'MOD-002'
        }
      },
      update: {},
      create: {
        branchId: mainBranch.id,
        name: 'Módulo de Atención 2',
        code: 'MOD-002',
        isActive: true,
      },
    }),
    prisma.agentModule.upsert({
      where: { 
        branchId_code: {
          branchId: mainBranch.id,
          code: 'KIOSK-001'
        }
      },
      update: {},
      create: {
        branchId: mainBranch.id,
        name: 'Kiosco de Auto-atención 1',
        code: 'KIOSK-001',
        isActive: true,
      },
    }),
    // Miraflores Modules
    prisma.agentModule.upsert({
      where: { 
        branchId_code: {
          branchId: mirafloresBranch.id,
          code: 'MOD-001'
        }
      },
      update: {},
      create: {
        branchId: mirafloresBranch.id,
        name: 'Módulo de Atención 1',
        code: 'MOD-001',
        isActive: true,
      },
    }),
    // Surquillo Modules
    prisma.agentModule.upsert({
    where: { 
      branchId_code: {
          branchId: surquilloBranch.id,
        code: 'MOD-001'
      }
    },
    update: {},
    create: {
        branchId: surquilloBranch.id,
        name: 'Módulo de Atención 1',
      code: 'MOD-001',
      isActive: true,
      },
    }),
  ])

  // ========== CAMERAS ==========
  console.log('📹 Creating cameras...')

  const cameras = await Promise.all([
    prisma.camera.create({
      data: {
        branchId: mainBranch.id,
        moduleId: modules[0].id,
        name: 'Cámara Módulo Principal - Frontal',
        streamUrl: 'rtsp://192.168.1.100/stream1',
        status: 'ONLINE',
        lastHeartbeat: new Date(),
        ownerUserId: admin.id,
      },
    }),
    prisma.camera.create({
      data: {
        branchId: mainBranch.id,
        moduleId: modules[1].id,
        name: 'Cámara Módulo 2 - Frontal',
        streamUrl: 'rtsp://192.168.1.101/stream1',
        status: 'ONLINE',
        lastHeartbeat: new Date(),
        ownerUserId: agent1.id,
      },
    }),
    prisma.camera.create({
      data: {
        branchId: mainBranch.id,
        moduleId: modules[2].id,
        name: 'Cámara Kiosco - Superior',
        streamUrl: 'rtsp://192.168.1.102/stream1',
        status: 'OFFLINE',
        lastHeartbeat: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        ownerUserId: admin.id,
      },
    }),
    prisma.camera.create({
      data: {
        branchId: mirafloresBranch.id,
        moduleId: modules[3].id,
        name: 'Cámara Miraflores - Frontal',
        streamUrl: 'rtsp://192.168.2.100/stream1',
        status: 'ONLINE',
        lastHeartbeat: new Date(),
        ownerUserId: agent1.id,
      },
    }),
  ])

  // ========== CLIENTS ==========
  console.log('👤 Creating test clients...')

  const clientPassword = await hash('client123', 12)

  const client1 = await prisma.client.upsert({
    where: { email: 'sharon.aiquipa@utec.edu.pe' },
    update: {},
    create: {
      dni: '72134682',
      name: 'Sharon Alejandra Aiquipa Meza',
      email: 'sharon.aiquipa@utec.edu.pe',
      phone: '+51945246362',
      status: 'ACTIVE',
      hashedPassword: clientPassword,
      passwordUpdatedAt: new Date(),
      locale: 'es-PE',
    },
  })

  const client2 = await prisma.client.upsert({
    where: { email: 'carlos.izaguirre@utec.edu.pe' },
    update: {},
    create: {
      dni: '12345678',
      name: 'Carlos Daniel Izaguirre Zavaleta',
      email: 'carlos.izaguirre@utec.edu.pe',
      phone: '+51920276358',
      status: 'ACTIVE',
      hashedPassword: clientPassword,
      passwordUpdatedAt: new Date(),
      locale: 'es-PE',
    },
  })

  const client3 = await prisma.client.upsert({
    where: { email: 'rodrigo.vasquezdevel@utec.edu.pe' },
    update: {},
    create: {
      dni: '70669690',
      name: 'Rodrigo Vasquez De Velasco',
      email: 'rodrigo.vasquezdevel@utec.edu.pe',
      phone: '+51949833976',
      status: 'ACTIVE',
      hashedPassword: clientPassword,
      passwordUpdatedAt: new Date(),
      locale: 'es-PE',
    },
  })

  // ========== FACIAL PROFILES ==========
  console.log('🤖 Creating facial profiles...')

  await Promise.all([
    prisma.facialProfile.create({
      data: {
        clientId: client1.id,
        provider: 'azure-vision',
        providerFaceId: `azure-face-${client1.id}`,
        version: 'v1.0',
        embedding: { vector: [0.1, 0.2, 0.3, 0.4, 0.5] }, // Mock embedding
        imageUrl: '/uploads/faces/juan-perez.jpg',
        isActive: true,
      },
    }),
    prisma.facialProfile.create({
      data: {
        clientId: client2.id,
        provider: 'azure-vision',
        providerFaceId: `azure-face-${client2.id}`,
        version: 'v1.0',
        embedding: { vector: [0.6, 0.7, 0.8, 0.9, 1.0] }, // Mock embedding
        imageUrl: '/uploads/faces/maria-silva.jpg',
        isActive: true,
      },
    }),
  ])

  // ========== REGISTRATION REQUESTS ==========
  console.log('📝 Creating registration requests...')

  await prisma.registrationRequest.create({
    data: {
      clientId: client3.id,
      branchId: mainBranch.id,
      status: 'PENDING',
      reason: 'Nuevo registro requiere aprobación',
    },
  })

  // ========== FAQs ==========
  console.log('❓ Creating FAQs...')

  const faqs = await Promise.all([
    prisma.fAQ.upsert({
      where: { id: 'faq-001' },
      update: {},
      create: {
        id: 'faq-001',
        title: '¿Cómo puedo retirar dinero?',
        answer: 'Puede retirar dinero en cualquiera de nuestros módulos de atención. Solo necesita presentar su DNI y proporcionar los datos de su cuenta. También puede usar nuestros cajeros automáticos disponibles 24/7.',
        tags: ['retiro', 'dinero', 'cuenta', 'atm'],
        status: 'PUBLISHED',
      },
    }),
    prisma.fAQ.upsert({
      where: { id: 'faq-002' },
      update: {},
      create: {
        id: 'faq-002',
        title: '¿Cuáles son los horarios de atención?',
        answer: 'Nuestros horarios de atención son de lunes a viernes de 9:00 AM a 6:00 PM, y los sábados de 9:00 AM a 1:00 PM. Los domingos y feriados permanecemos cerrados.',
        tags: ['horarios', 'atención', 'servicio'],
        status: 'PUBLISHED',
      },
    }),
    prisma.fAQ.upsert({
      where: { id: 'faq-003' },
      update: {},
      create: {
        id: 'faq-003',
        title: '¿Cómo puedo abrir una cuenta?',
        answer: 'Para abrir una cuenta necesita: DNI vigente, comprobante de domicilio (recibo de luz/agua) y un depósito inicial de S/. 50. El proceso toma aproximadamente 15 minutos.',
        tags: ['cuenta', 'apertura', 'requisitos'],
        status: 'PUBLISHED',
      },
    }),
    prisma.fAQ.upsert({
      where: { id: 'faq-004' },
      update: {},
      create: {
        id: 'faq-004',
        title: '¿Cuánto cuesta el mantenimiento de cuenta?',
        answer: 'El mantenimiento de la cuenta básica es de S/. 0 si mantiene un saldo promedio de S/. 500. La cuenta premium tiene un costo de S/. 10 mensuales con beneficios adicionales.',
        tags: ['costo', 'mantenimiento', 'cuenta', 'tarifas'],
        status: 'PUBLISHED',
      },
    }),
    prisma.fAQ.upsert({
      where: { id: 'faq-005' },
      update: {},
      create: {
        id: 'faq-005',
        title: '¿Qué hacer si olvido mi contraseña de banca por internet?',
        answer: 'Puede recuperar su contraseña desde nuestra página web usando la opción "Olvidé mi contraseña". Recibirá un código en su celular o email registrado. También puede acercarse a cualquier sucursal con su DNI.',
        tags: ['contraseña', 'recuperar', 'banca internet', 'seguridad'],
        status: 'PUBLISHED',
      },
    }),
    prisma.fAQ.upsert({
      where: { id: 'faq-006' },
      update: {},
      create: {
        id: 'faq-006',
        title: '¿Qué documentos necesito para un préstamo personal?',
        answer: 'Necesita: DNI, últimas 3 boletas de pago, declaración jurada de ingresos, y comprobante de domicilio. Un ejecutivo evaluará su solicitud en 24-48 horas.',
        tags: ['préstamo', 'crédito', 'documentos', 'requisitos'],
        status: 'PUBLISHED',
      },
    }),
    prisma.fAQ.create({
      data: {
        title: '¿Cómo reportar una tarjeta robada? (BORRADOR)',
        answer: 'Llame inmediatamente al 0800-12345 o use nuestra app móvil para bloquear su tarjeta. Disponible 24/7.',
        tags: ['tarjeta', 'robo', 'seguridad', 'emergencia'],
        status: 'DRAFT',
      },
    }),
  ])

  // ========== QA PAIRS ==========
  console.log('💬 Creating QA pairs...')

  const qaPairs = await Promise.all([
    prisma.qAPair.create({
      data: {
        question: '¿Dónde están ubicadas sus sucursales?',
        answer: 'Contamos con 3 sucursales principales en Lima: San Isidro (Av. Javier Prado Este 4200), Miraflores (Av. Larco 1301) y Surquillo (Av. Angamos Este 2681). Todas abiertas de lunes a sábado.',
        metadata: { category: 'ubicaciones', priority: 'high' },
        isActive: true,
      },
    }),
    prisma.qAPair.create({
      data: {
        question: '¿Cuál es el monto mínimo para apertura de cuenta?',
        answer: 'El monto mínimo de apertura es S/. 50 para cuentas de ahorro y S/. 200 para cuentas corriente.',
        metadata: { category: 'cuentas', priority: 'high' },
        isActive: true,
      },
    }),
    prisma.qAPair.create({
      data: {
        question: '¿Puedo hacer transferencias internacionales?',
        answer: 'Sí, ofrecemos transferencias internacionales vía SWIFT. El costo es de S/. 45 por transferencia y el procesamiento toma 2-3 días hábiles.',
        metadata: { category: 'transferencias', priority: 'medium' },
        isActive: true,
      },
    }),
    prisma.qAPair.create({
      data: {
        question: '¿Tienen servicios de banca móvil?',
        answer: 'Sí, nuestra app BankingAgent está disponible para iOS y Android. Puede consultar saldos, hacer transferencias, pagar servicios y más.',
        metadata: { category: 'digital', priority: 'high' },
        isActive: true,
      },
    }),
  ])

  // ========== CHAT SESSIONS (EXAMPLES) ==========
  console.log('💬 Creating sample chat sessions...')

  const chatSession1 = await prisma.chatSession.create({
    data: {
      clientId: client1.id,
      startedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    },
  })

  await Promise.all([
    prisma.chatMessage.create({
      data: {
        sessionId: chatSession1.id,
        actor: 'CLIENT',
        content: '¿Cuáles son los horarios de atención?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60),
      },
    }),
    prisma.chatMessage.create({
      data: {
        sessionId: chatSession1.id,
        actor: 'BOT',
        content: 'Nuestros horarios de atención son de lunes a viernes de 9:00 AM a 6:00 PM, y los sábados de 9:00 AM a 1:00 PM. ¿Te puedo ayudar con algo más?',
        intent: 'horarios',
        metadata: { confidence: 0.95, source: 'faq-002' },
        createdAt: new Date(Date.now() - 1000 * 60 * 59),
      },
    }),
    prisma.chatMessage.create({
      data: {
        sessionId: chatSession1.id,
        actor: 'CLIENT',
        content: '¿Puedo ir hoy en la tarde?',
        createdAt: new Date(Date.now() - 1000 * 60 * 58),
      },
    }),
    prisma.chatMessage.create({
      data: {
        sessionId: chatSession1.id,
        actor: 'BOT',
        content: 'Sí, puedes visitarnos hoy. Recuerda que cerramos a las 6:00 PM. ¿Necesitas información sobre algún trámite específico?',
        metadata: { confidence: 0.88 },
        createdAt: new Date(Date.now() - 1000 * 60 * 57),
      },
    }),
  ])

  // ========== VISITS ==========
  console.log('🚶 Creating sample visits...')

  await Promise.all([
    prisma.visit.create({
      data: {
        clientId: client1.id,
        branchId: mainBranch.id,
        moduleId: modules[0].id,
        status: 'COMPLETED',
        purpose: 'Consulta de saldo',
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        assignedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 300000), // 5 min later
        finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 900000), // 15 min later
      },
    }),
    prisma.visit.create({
      data: {
        clientId: client2.id,
        branchId: mirafloresBranch.id,
        moduleId: modules[3].id,
        status: 'COMPLETED',
        purpose: 'Retiro de dinero',
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        assignedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 + 120000), // 2 min later
        finishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 + 600000), // 10 min later
      },
    }),
    prisma.visit.create({
      data: {
        clientId: client1.id,
        branchId: mainBranch.id,
        moduleId: modules[1].id,
        status: 'WAITING',
        purpose: 'Apertura de cuenta',
        startedAt: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
      },
    }),
  ])

  // ========== AUDIT LOGS ==========
  console.log('📋 Creating audit logs...')

  await Promise.all([
    prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        targetClientId: client1.id,
        action: 'REGISTRATION_APPROVED',
        details: { 
          branch: mainBranch.name,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
    }),
    prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        action: 'FAQ_PUBLISHED',
        details: { 
          faqId: faqs[0].id,
          title: faqs[0].title,
          tags: faqs[0].tags
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
      },
    }),
    prisma.auditLog.create({
      data: {
        actorUserId: agent1.id,
        targetClientId: client2.id,
        action: 'CLIENT_INFO_UPDATED',
        details: { 
          changes: { phone: '+51 987 111 222' },
          branch: mirafloresBranch.name
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      },
    }),
  ])

  // ========== CAMERA LOGS ==========
  console.log('📹 Creating camera logs...')

  await Promise.all([
    prisma.cameraLog.create({
      data: {
        cameraId: cameras[0].id,
        level: 'INFO',
        message: 'Camera stream started successfully',
        meta: { resolution: '1920x1080', fps: 30 },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
    }),
    prisma.cameraLog.create({
      data: {
        cameraId: cameras[2].id,
        level: 'ERROR',
        message: 'Connection timeout - camera offline',
        meta: { lastHeartbeat: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
        createdAt: new Date(Date.now() - 1000 * 60 * 25),
      },
    }),
    prisma.cameraLog.create({
      data: {
        cameraId: cameras[1].id,
        level: 'WARN',
        message: 'Low frame rate detected',
        meta: { currentFps: 15, expectedFps: 30 },
        createdAt: new Date(Date.now() - 1000 * 60 * 5),
      },
    }),
  ])

  // ========== DETECTION EVENTS (MOCK) ==========
  console.log('🔍 Creating detection events...')

  await Promise.all([
    prisma.detectionEvent.create({
      data: {
        cameraId: cameras[0].id,
        clientId: client1.id,
        status: 'MATCHED',
        confidence: 0.96,
        snapshotUrl: '/uploads/detections/detection-001.jpg',
        metadata: { 
          boundingBox: { x: 120, y: 80, width: 200, height: 250 },
          landmarks: { leftEye: [150, 120], rightEye: [250, 120] }
        },
        occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
    }),
    prisma.detectionEvent.create({
      data: {
        cameraId: cameras[1].id,
        clientId: client2.id,
        status: 'MATCHED',
        confidence: 0.92,
        snapshotUrl: '/uploads/detections/detection-002.jpg',
        metadata: { 
          boundingBox: { x: 100, y: 60, width: 220, height: 270 }
        },
        occurredAt: new Date(Date.now() - 1000 * 60 * 60),
      },
    }),
    prisma.detectionEvent.create({
      data: {
        cameraId: cameras[0].id,
        status: 'UNKNOWN',
        confidence: 0.45,
        snapshotUrl: '/uploads/detections/detection-003.jpg',
        metadata: { 
          boundingBox: { x: 180, y: 100, width: 180, height: 220 },
          reason: 'No matching profile found'
        },
        occurredAt: new Date(Date.now() - 1000 * 60 * 30),
      },
    }),
  ])

  console.log('\n✅ Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   👥 Users: 3 (1 admin, 2 agents)`)
  console.log(`   🏢 Branches: 3`)
  console.log(`   🏪 Modules: ${modules.length}`)
  console.log(`   📹 Cameras: ${cameras.length}`)
  console.log(`   👤 Clients: 3`)
  console.log(`   🤖 Facial Profiles: 2`)
  console.log(`   📝 Registration Requests: 2 (1 approved, 1 pending)`)
  console.log(`   ❓ FAQs: ${faqs.length}`)
  console.log(`   💬 QA Pairs: ${qaPairs.length}`)
  console.log(`   💬 Chat Sessions: 1`)
  console.log(`   🚶 Visits: 3`)
  console.log(`   🔍 Detection Events: 3`)
  console.log('\n🔐 Test Credentials:')
  console.log(`   Admin:  admin@banking-agent.com / admin123`)
  console.log(`   Agent:  agent1@banking-agent.com / admin123`)
  console.log(`   Client: sharon.aiquipa@utec.edu.pe / client123`)
  console.log('\n📝 Note: All passwords are "admin123" for testing')
  console.log('   Users (admins/agents) authenticate via NextAuth.js')
  console.log('   Clients authenticate with Credentials provider')
  console.log('\n🚀 Ready for Phase 1-2 development!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
