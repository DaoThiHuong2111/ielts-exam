'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminHomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to quiz management page since it's the only admin page
    router.replace('/admin/quiz')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-lg">Redirecting to Quiz Management...</div>
    </div>
  )
}