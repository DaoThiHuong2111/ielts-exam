// app/admin/layout.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Toaster } from 'react-hot-toast'

const navItems = [
  { href: '/admin/quiz', label: 'Quiz Management' },
  { href: '/admin/user', label: 'User Management' },
  { href: '/', label: 'Back to Website' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false) // Default hidden
  const pathname = usePathname()

  return (
    <>
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="bg-white shadow-lg w-64 p-6 fixed md:static z-50 inset-y-0 left-0 transform transition-transform duration-300 ease-in-out translate-x-0">
            <h2 className="text-xl font-bold mb-8">Admin Panel</h2>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-2 rounded-lg font-medium transition-colors duration-200
                      ${isActive
                        ? 'bg-primary text-white'
                        : 'text-slate-800 hover:bg-slate-100 hover:text-primary'
                      }`
                    }
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </aside>
        )}

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black opacity-30 md:hidden z-40"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out">
          {/* Topbar */}
          <header className="bg-white shadow px-4 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="text-slate-600 font-medium">Welcome back, Admin!</span>
          </header>

          <main className="p-6 bg-gray-100 flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }}
      />
    </>
  )
}
