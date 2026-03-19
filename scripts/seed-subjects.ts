import { getSql } from '@/lib/neon'

async function seedSubjects() {
  const sql = getSql()

  console.log('Seeding materias iniciales...')

  // Materias para ISI (Ingeniería en Sistemas de Información)
  const isiSubjects = [
    'Programación I',
    'Matemática I',
    'Programación II',
    'Matemática II',
    'Estructuras de Datos',
    'Algoritmos',
    'Base de Datos I',
    'Diseño de Software',
    'Redes de Computadoras',
    'Seguridad Informática',
  ]

  // Materias para Ciclo Básico
  const cbSubjects = [
    'Análisis Matemático',
    'Álgebra Lineal',
    'Física I',
    'Física II',
    'Química General',
    'Introducción a la Ingeniería',
  ]

  try {
    // Get career IDs
    const careers = await sql`SELECT id, code FROM careers WHERE code IN ('ISI', 'CB')`
    const isiId = careers.find((c: any) => c.code === 'ISI')?.id
    const cbId = careers.find((c: any) => c.code === 'CB')?.id

    if (!isiId || !cbId) {
      console.error('Carreras no encontradas')
      return
    }

    // Insert ISI subjects
    for (const subjectName of isiSubjects) {
      const existing = await sql`
        SELECT id FROM subjects WHERE name = ${subjectName} AND career_id = ${isiId}
      `
      if (existing.length === 0) {
        await sql`
          INSERT INTO subjects (name, career_id) VALUES (${subjectName}, ${isiId})
        `
        console.log(`✓ Creada materia: ${subjectName}`)
      }
    }

    // Insert CB subjects
    for (const subjectName of cbSubjects) {
      const existing = await sql`
        SELECT id FROM subjects WHERE name = ${subjectName} AND career_id = ${cbId}
      `
      if (existing.length === 0) {
        await sql`
          INSERT INTO subjects (name, career_id) VALUES (${subjectName}, ${cbId})
        `
        console.log(`✓ Creada materia: ${subjectName}`)
      }
    }

    console.log('Seed completado exitosamente')
  } catch (error) {
    console.error('Error durante seed:', error)
  }
}

seedSubjects()
