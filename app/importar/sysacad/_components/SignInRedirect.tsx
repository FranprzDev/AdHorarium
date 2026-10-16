"use client"

import { useEffect } from "react"
import { SYSACAD_IMPORT_PATH } from "@/lib/sysacad/payload"
import { stashFragmentFromLocation } from "@/lib/sysacad/stash"

/** Keeps the SysAcad data of the URL fragment in this tab and sends the student to sign in, coming back here. */
export function SignInRedirect() {
  useEffect(() => {
    stashFragmentFromLocation()
    window.location.replace(`/ingresar?callbackUrl=${encodeURIComponent(SYSACAD_IMPORT_PATH)}`)
  }, [])
  return null
}
