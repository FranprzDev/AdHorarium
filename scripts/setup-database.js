import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  console.log("Setting up database...")

  try {
    // Create careers table
    const { error: careersError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS careers (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          code TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (careersError) throw careersError
    console.log("Created careers table")

    // Create exam_tables table
    const { error: examTablesError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS exam_tables (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (examTablesError) throw examTablesError
    console.log("Created exam_tables table")

    // Create user_profiles table
    const { error: userProfilesError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id),
          career_id INTEGER REFERENCES careers(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (userProfilesError) throw userProfilesError
    console.log("Created user_profiles table")

    // Create subjects table
    const { error: subjectsError } = await supabase.rpc("execute_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS subjects (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          career_id INTEGER REFERENCES careers(id),
          exam_table_id INTEGER REFERENCES exam_tables(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (subjectsError) throw subjectsError
    console.log("Created subjects table")

    // Insert initial data for careers
    const { error: insertCareersError } = await supabase.from("careers").insert([
      { name: "Ingeniería en Sistemas de Información", code: "ISI" },
      { name: "Ingeniería Electrónica", code: "IE" },
      { name: "Ingeniería Civil", code: "IC" },
      { name: "Ingeniería Mecánica", code: "IM" },
      { name: "Ingeniería en Energía Eléctrica", code: "IEE" },
    ])

    if (insertCareersError) throw insertCareersError
    console.log("Inserted career data")

    // Insert initial data for exam tables
    const { error: insertExamTablesError } = await supabase.from("exam_tables").insert([
      { name: "Mesa I", description: "Primera mesa de examen" },
      { name: "Mesa II", description: "Segunda mesa de examen" },
      { name: "Mesa III", description: "Tercera mesa de examen" },
    ])

    if (insertExamTablesError) throw insertExamTablesError
    console.log("Inserted exam tables data")

    console.log("Database setup complete!")
  } catch (error) {
    console.error("Error setting up database:", error)
  }
}

setupDatabase()
