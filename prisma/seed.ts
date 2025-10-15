import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create a default admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@banking-agent.com' },
    update: {},
    create: {
      email: 'admin@banking-agent.com',
      name: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
    },
  })

  // Create a default branch
  const branch = await prisma.branch.upsert({
    where: { code: 'MAIN-001' },
    update: {},
    create: {
      name: 'Sede Principal',
      code: 'MAIN-001',
      address: 'Av. Principal 123, Lima, Perú',
      city: 'Lima',
      country: 'PE',
    },
  })

  // Create a default agent module
  const agentModule = await prisma.agentModule.upsert({
    where: { 
      branchId_code: {
        branchId: branch.id,
        code: 'MOD-001'
      }
    },
    update: {},
    create: {
      branchId: branch.id,
      name: 'Módulo Principal',
      code: 'MOD-001',
      isActive: true,
    },
  })

  // Create some sample FAQs
  const faqs = await Promise.all([
    prisma.fAQ.upsert({
      where: { id: 'faq-001' },
      update: {},
      create: {
        title: '¿Cómo puedo retirar dinero?',
        answer: 'Puede retirar dinero en cualquiera de nuestros módulos de atención. Solo necesita presentar su DNI y proporcionar los datos de su cuenta.',
        tags: ['retiro', 'dinero', 'cuenta'],
        status: 'PUBLISHED',
      },
    }),
    prisma.fAQ.upsert({
      where: { id: 'faq-002' },
      update: {},
      create: {
        title: '¿Cuáles son los horarios de atención?',
        answer: 'Nuestros horarios de atención son de lunes a viernes de 9:00 AM a 6:00 PM, y los sábados de 9:00 AM a 1:00 PM.',
        tags: ['horarios', 'atención'],
        status: 'PUBLISHED',
      },
    }),
  ])

  console.log('✅ Seed completed successfully!')
  console.log(`👤 Admin user created: ${admin.email}`)
  console.log(`🏢 Branch created: ${branch.name}`)
  console.log(`🏪 Module created: ${agentModule.name}`)
  console.log(`❓ FAQs created: ${faqs.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
