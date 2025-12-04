import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing test client passwords...')

  const clientPassword = await hash('client123', 12)

  const testClients = [
    { dni: '72134682', name: 'Sharon Alejandra Aiquipa Meza', email: 'sharon.aiquipa@utec.edu.pe' },
    { dni: '12345678', name: 'Carlos Daniel Izaguirre Zavaleta', email: 'carlos.izaguirre@utec.edu.pe' },
    { dni: '70669690', name: 'Rodrigo Vasquez De Velasco', email: 'rodrigo.vasquezdevel@utec.edu.pe' },
  ]

  for (const clientData of testClients) {
    try {
      // Try to find by DNI first
      let client = await prisma.client.findUnique({
        where: { dni: clientData.dni }
      })

      // If not found by DNI, try by email
      if (!client) {
        client = await prisma.client.findUnique({
          where: { email: clientData.email }
        })
      }

      if (client) {
        // Update password and ensure status is ACTIVE
        await prisma.client.update({
          where: { id: client.id },
          data: {
            hashedPassword: clientPassword,
            passwordUpdatedAt: new Date(),
            status: 'ACTIVE',
          }
        })
        console.log(`✅ Updated password for ${clientData.name} (DNI: ${clientData.dni})`)
      } else {
        // Create if doesn't exist
        await prisma.client.create({
          data: {
            dni: clientData.dni,
            name: clientData.name,
            email: clientData.email,
            phone: '+51999999999',
            status: 'ACTIVE',
            hashedPassword: clientPassword,
            passwordUpdatedAt: new Date(),
            locale: 'es-PE',
          }
        })
        console.log(`✅ Created client ${clientData.name} (DNI: ${clientData.dni})`)
      }
    } catch (error) {
      console.error(`❌ Error processing ${clientData.name}:`, error)
    }
  }

  console.log('\n✅ Password fix completed!')
  console.log('\n🔐 Test Credentials:')
  console.log('   Cliente 1 - Sharon Aiquipa:')
  console.log('   DNI: 72134682')
  console.log('   Contraseña: client123')
  console.log('\n   Cliente 2 - Carlos Izaguirre:')
  console.log('   DNI: 12345678')
  console.log('   Contraseña: client123')
  console.log('\n   Cliente 3 - Rodrigo Vasquez:')
  console.log('   DNI: 70669690')
  console.log('   Contraseña: client123')
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

