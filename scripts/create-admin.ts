import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

async function createAdmin() {
  const email = 'admin@adhorarium.com'
  const password = process.env.ADMIN_PASSWORD || 'Admin123456'
  const full_name = 'Administrador'

  try {
    console.log('Creando usuario administrador...')
    
    // Check if admin already exists
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `

    if (existing.length > 0) {
      console.log('El usuario administrador ya existe:', email)
      return
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12)

    // Create admin user
    const result = await sql`
      INSERT INTO users (email, password_hash, full_name, provider, role)
      VALUES (${email}, ${password_hash}, ${full_name}, 'email', 'admin')
      RETURNING id, email, full_name, role
    `

    if (result.length === 0) {
      throw new Error('No se pudo crear el usuario administrador')
    }

    // Create admin profile
    const admin = result[0]
    await sql`
      INSERT INTO user_profiles (id) VALUES (${admin.id})
    `

    console.log('✅ Usuario administrador creado exitosamente')
    console.log(`📧 Email: ${admin.email}`)
    console.log(`🔑 Contraseña: ${password}`)
    console.log(`⚠️  POR FAVOR, cambia esta contraseña después del primer inicio de sesión`)

  } catch (error) {
    console.error('Error al crear el usuario administrador:', error)
    process.exit(1)
  }
}

createAdmin()
