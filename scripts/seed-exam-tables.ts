import { createClient } from "@supabase/supabase-js"
import materiasDB from "../data/materias.db"

// This script is meant to be run manually to seed the database with exam tables data

async function seedExamTables() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log("Fetching careers...")
    const { data: careers, error: careersError } = await supabase.from("careers").select("id, name")

    if (careersError) throw careersError

    if (!careers || careers.length === 0) {
      throw new Error("No careers found in the database")
    }

    console.log("Fetching exam tables...")
    const { data: examTables, error: examTablesError } = await supabase.from("exam_tables").select("id, name")

    if (examTablesError) throw examTablesError

    if (!examTables || examTables.length === 0) {
      throw new Error("No exam tables found in the database")
    }

    // Map career names to IDs
    const careerMap = new Map(careers.map((career) => [career.name, career.id]))

    // Map exam table names to IDs
    const examTableMap = new Map(examTables.map((table) => [table.name, table.id]))

    // Prepare subjects for insertion
    const subjects = []

    for (const [careerName, tables] of Object.entries(materiasDB)) {
      const careerId = careerMap.get(careerName)

      if (!careerId) {
        console.warn(`Career not found in database: ${careerName}`)
        continue
      }

      for (const [tableName, tableSubjects] of Object.entries(tables)) {
        const examTableId = examTableMap.get(tableName)

        if (!examTableId) {
          console.warn(`Exam table not found in database: ${tableName}`)
          continue
        }

        for (const subjectName of tableSubjects) {
          subjects.push({
            name: subjectName,
            career_id: careerId,
            exam_table_id: examTableId,
          })
        }
      }
    }

    console.log(`Inserting ${subjects.length} subjects...`)

    // Insert subjects in batches to avoid hitting request size limits
    const batchSize = 100
    for (let i = 0; i < subjects.length; i += batchSize) {
      const batch = subjects.slice(i, i + batchSize)
      const { error } = await supabase.from("subjects").upsert(batch, { onConflict: "name,career_id" })

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error)
      } else {
        console.log(`Inserted batch ${i / batchSize + 1} of ${Math.ceil(subjects.length / batchSize)}`)
      }
    }

    console.log("Seeding completed successfully!")
  } catch (error) {
    console.error("Error seeding database:", error)
  }
}

seedExamTables()
