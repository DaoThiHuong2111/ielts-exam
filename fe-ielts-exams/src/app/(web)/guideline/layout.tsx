
import { ReactNode } from 'react'

interface GuidelineLayoutProps {
  children: ReactNode
}

export default function GuidelineLayout({ children }: GuidelineLayoutProps) {
  return (
    <>
      {children}
    </>
  )
}