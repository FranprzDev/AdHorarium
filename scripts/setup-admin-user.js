import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zskivnhqfpwlbmdmvuty.supabase.co"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY environment variable is required")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAdminUser() {
  console.log("Setting up admin user...")

  try {
    // Create admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "admin@example.com",
      password: "fran123",
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes("already registered")) {
        console.log("Admin user already exists, finding existing user...")

        // Get existing user
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) throw listError

        const existingUser = existingUsers.users.find((u) => u.email === "admin@example.com")
        if (!existingUser) {
          throw new Error("Could not find existing admin user")
        }

        console.log("Found existing admin user:", existingUser.id)

        // Check if already in admin_users table
        const { data: adminCheck, error: adminCheckError } = await supabase
          .from("admin_users")
          .select("id")
          .eq("user_id", existingUser.id)
          .single()

        if (adminCheckError && adminCheckError.code !== "PGRST116") {
          throw adminCheckError
        }

        if (adminCheck) {
          console.log("User is already an admin!")
          return
        }

        // Add to admin_users table
        const { error: adminError } = await supabase.from("admin_users").insert([{ user_id: existingUser.id }])

        if (adminError) throw adminError

        console.log("Existing user added to admin_users table!")
        return
      }

      throw authError
    }

    console.log("Admin user created:", authData.user.id)

    // Add user to admin_users table
    const { error: adminError } = await supabase.from("admin_users").insert([{ user_id: authData.user.id }])

    if (adminError) throw adminError

    console.log("Admin user setup complete!")
    console.log("You can now login with the admin credentials")
  } catch (error) {
    console.error("Error setting up admin user:", error)
  }
}

setupAdminUser()
