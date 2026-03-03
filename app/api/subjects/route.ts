import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getSession } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const careerCode = searchParams.get("careerCode")
    const careerId = searchParams.get("careerId")

    if (!careerCode && !careerId) {
      return NextResponse.json({ error: "careerCode o careerId requerido" }, { status: 400 })
    }

    const session = await getSession()
    const userId = session?.user?.id ?? null

    // Fetch subjects for the career
    let rawSubjects: any[]
    if (careerCode) {
      rawSubjects = await sql`
        SELECT s.id, s.name AS subject_name, s.id AS subject_number,
               c.code AS career_code, c.name AS career_name
        FROM subjects s
        JOIN careers c ON s.career_id = c.id
        WHERE c.code = ${careerCode}
        ORDER BY s.id
      `
    } else {
      rawSubjects = await sql`
        SELECT s.id, s.name AS subject_name, s.id AS subject_number,
               c.code AS career_code, c.name AS career_name
        FROM subjects s
        JOIN careers c ON s.career_id = c.id
        WHERE s.career_id = ${careerId!}
        ORDER BY s.id
      `
    }

    // If user is logged in, overlay their subject states
    if (userId && rawSubjects.length > 0) {
      const effectiveCode = careerCode ?? rawSubjects[0]?.career_code
      const states = await sql`
        SELECT subject_number, status, grade
        FROM user_subject_states
        WHERE user_id = ${userId}
          AND career_code = ${effectiveCode}
      `

      const statesMap: Record<number, { status: string; grade: number | null }> = {}
      for (const s of states) {
        statesMap[s.subject_number] = { status: s.status, grade: s.grade }
      }

      const subjects = rawSubjects.map((s) => ({
        ...s,
        status: statesMap[s.subject_number]?.status ?? "no_cursada",
        grade: statesMap[s.subject_number]?.grade ?? null,
      }))

      return NextResponse.json({ subjects })
    }

    const subjects = rawSubjects.map((s) => ({
      ...s,
      status: "no_cursada",
      grade: null,
    }))

    return NextResponse.json({ subjects })
  } catch (error) {
    console.error("[api/subjects] Error:", error)
    return NextResponse.json({ error: "Error al cargar materias" }, { status: 500 })
  }
}
