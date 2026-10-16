import { beforeEach, describe, expect, it, vi } from "vitest"
import { SubjectStatus } from "@/types/enums"

import { useUserSubjectsStore } from "@/stores/useUserSubjectsStore"

const { updateMySubjectStateAction } = vi.hoisted(() => ({ updateMySubjectStateAction: vi.fn() }))

vi.mock("@/app/actions/student", () => ({
  getMySubjectStatesAction: vi.fn(),
  updateMySubjectStateAction,
}))

describe("user subjects store", () => {
  beforeEach(() => {
    updateMySubjectStateAction.mockReset()
    useUserSubjectsStore.setState({
      userSubjects: { 1: { status: SubjectStatus.Regular, grade: null } },
      isLoading: false,
      error: null,
    })
  })

  it("keeps the optimistic state when the server saves the change", async () => {
    updateMySubjectStateAction.mockResolvedValue({ ok: true, data: null })

    const result = await useUserSubjectsStore.getState().updateUserSubjectState(1, SubjectStatus.Promocionada, 8)

    expect(result.ok).toBe(true)
    expect(useUserSubjectsStore.getState().userSubjects[1]).toEqual({ status: SubjectStatus.Promocionada, grade: 8 })
    expect(useUserSubjectsStore.getState().isLoading).toBe(false)
  })

  it("restores the previous state and reports the error when saving fails", async () => {
    updateMySubjectStateAction.mockResolvedValue({ ok: false, error: "No autorizado" })

    const result = await useUserSubjectsStore.getState().updateUserSubjectState(1, SubjectStatus.Cursando, null)

    expect(result).toEqual({ ok: false, error: "No autorizado" })
    expect(useUserSubjectsStore.getState().userSubjects[1]).toEqual({ status: SubjectStatus.Regular, grade: null })
    expect(useUserSubjectsStore.getState().error).toBe("No autorizado")
  })

  it("removes an optimistic entry for a subject that had no stored state", async () => {
    updateMySubjectStateAction.mockResolvedValue({ ok: false, error: "Error" })

    await useUserSubjectsStore.getState().updateUserSubjectState(2, SubjectStatus.Cursando, null)

    expect(useUserSubjectsStore.getState().userSubjects[2]).toBeUndefined()
  })
})
