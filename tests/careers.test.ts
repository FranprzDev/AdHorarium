import { describe, expect, it } from "vitest"
import { careerLabel } from "@/lib/careers"

const sistemas2023 = { name: "Ingeniería en Sistemas de Información", plan: "2023" }
const sistemas2008 = { name: "Ingeniería en Sistemas de Información", plan: "2008" }
const electronica = { name: "Ingeniería Electrónica", plan: "2025a" }
const careers = [sistemas2023, sistemas2008, electronica]

describe("careerLabel", () => {
  it("keeps the plain name for a career offered on one plan", () => {
    expect(careerLabel(electronica, careers)).toBe("Ingeniería Electrónica")
  })

  it("keeps the plain name on the newest plan and names the older plan", () => {
    expect(careerLabel(sistemas2023, careers)).toBe("Ingeniería en Sistemas de Información")
    expect(careerLabel(sistemas2008, careers)).toBe("Ingeniería en Sistemas de Información (Plan 2008)")
  })

  it("does not depend on the order of the list", () => {
    expect(careerLabel(sistemas2008, [...careers].reverse())).toBe("Ingeniería en Sistemas de Información (Plan 2008)")
  })
})
