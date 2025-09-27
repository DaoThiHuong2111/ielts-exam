import Link from 'next/link'
import { ReactNode } from 'react'

interface GuidelineHeroProps {
  title: string
  breadcrumbText: string
  illustration?: ReactNode
}

export default function GuidelineHero({ 
  title, 
  breadcrumbText, 
  illustration 
}: GuidelineHeroProps) {
  return (
    <section className="relative bg-gradient-to-r from-teal-800 to-teal-600 text-white py-20 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-400 transform rotate-45 -translate-x-16 -translate-y-16 opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-yellow-400 transform rotate-45 translate-x-20 translate-y-20 opacity-20"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-orange-400 transform rotate-45 opacity-30"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Content */}
          <div className="flex-1 max-w-2xl">
            {/* Breadcrumb */}
            <nav className="mb-6">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link href="/" className="hover:text-yellow-300 transition-colors">
                    Trang chủ
                  </Link>
                </li>
                <li className="text-yellow-300">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                <li className="text-yellow-300">{breadcrumbText}</li>
              </ol>
            </nav>

            {/* Main Title */}
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              {title}
            </h1>
          </div>

          {/* Illustration */}
          {illustration && (
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
                  {illustration}
                  
                  {/* Animation indicators */}
                  <div className="mt-6 flex justify-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Logo at bottom center */}
      
    </section>
  )
}