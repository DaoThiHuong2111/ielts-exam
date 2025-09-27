import Link from 'next/link'
import { typography, cn } from '@/lib/design-tokens'

export default function FooterApp() {
  return (
    <footer className="border-t bg-slate-50 text-slate-700">
      <div className="container mx-auto py-10 px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* Về Chúng Tôi */}
        <div>
          <h3 className={typography.footerHeading}>Về Chúng Tôi</h3>
          <ul className="space-y-2 text-base">
            <li><Link href="/about" className={typography.footerLink}>Giới Thiệu</Link></li>
            <li><Link href="/history" className={typography.footerLink}>Lịch Sử Phát Triển</Link></li>
          </ul>
        </div>

        {/* Danh Mục */}
        <div>
          <h3 className={typography.footerHeading}>Danh Mục</h3>
          <ul className="space-y-2 text-base">
            <li><Link href="/reading" className={typography.footerLink}>Reading</Link></li>
          </ul>
        </div>

        {/* Hỗ Trợ */}
        <div>
          <h3 className={typography.footerHeading}>Hỗ Trợ</h3>
          <ul className="space-y-2 text-base">
            <li><Link href="/guideline/register" className={typography.footerLink}>Hướng Dẫn Đăng Ký</Link></li>
            <li><Link href="/guideline/take-test" className={typography.footerLink}>Hướng Dẫn Làm Bài Thi</Link></li>
            <li><Link href="/guideline/review" className={typography.footerLink}>Hướng Dẫn Ôn Tập</Link></li>
            <li><Link href="/policy" className={typography.footerLink}>Chính Sách</Link></li>
          </ul>
        </div>

        {/* Theo Dõi Chúng Tôi Trên */}
        <div>
          <h3 className={typography.footerHeading}>Theo Dõi Chúng Tôi Trên</h3>
          <div className="flex space-x-4">
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="border-t border-slate-200 py-4">
        <div className={cn("container mx-auto px-6 text-center", typography.footerCopyright)}>
          © 2025 IELTS Exams. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
