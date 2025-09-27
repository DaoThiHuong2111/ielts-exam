import { apiFetch } from "@/lib/axios-backend"

export const getUserBe = async () => {
  try {
    const resUser = await apiFetch<any>('/v1/users/me')
    return resUser?.data
  } catch (error) {
    console.log(error)
    return undefined
  }
}