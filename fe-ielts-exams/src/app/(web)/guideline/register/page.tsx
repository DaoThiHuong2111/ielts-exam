import Link from 'next/link'
import GuidelineHero from '../components/GuidelineHero'

export default function GuidelineRegisterPage() {
  const registerIllustration = (
    <div className="flex items-center justify-center space-x-4">
      {/* Student 1 */}
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 bg-blue-300 rounded-full mb-4 flex items-center justify-center">
          <span className="text-2xl">👩‍🎓</span>
        </div>
        <div className="w-8 h-12 bg-pink-200 rounded-lg"></div>
      </div>
      
      {/* Student 2 */}
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 bg-orange-200 rounded-full mb-4 flex items-center justify-center">
          <span className="text-2xl">👨‍🎓</span>
        </div>
        <div className="w-8 h-12 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen">
      <GuidelineHero 
        title="Hướng dẫn đăng ký"
        breadcrumbText="Hướng dẫn đăng ký"
        illustration={registerIllustration}
      />

      {/* Content Section */}
      <section className="pt-40 pb-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Các bước đăng ký tài khoản</h2>
              
              <div className="space-y-8">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Bước 1: Truy cập trang đăng ký</h3>
                  <p className="text-gray-700">
                    Nhấp vào nút Đăng ký ở góc trên bên phải của trang web để bắt đầu quá trình tạo tài khoản.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Bước 2: Điền thông tin cá nhân</h3>
                  <p className="text-gray-700 mb-4">
                    Cung cấp các thông tin sau một cách chính xác:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Họ và tên đầy đủ</li>
                    <li>Địa chỉ email hợp lệ</li>
                    <li>Số điện thoại</li>
                    <li>Mật khẩu mạnh (tối thiểu 8 ký tự)</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Bước 3: Xác thực tài khoản</h3>
                  <p className="text-gray-700">
                    Kiểm tra email của bạn để nhận mã xác thực và nhập mã này vào trang web để kích hoạt tài khoản.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Bước 4: Hoàn tất và bắt đầu học</h3>
                  <p className="text-gray-700">
                    Sau khi xác thực thành công, bạn có thể đăng nhập và bắt đầu sử dụng các tính năng của hệ thống.
                  </p>
                </div>
              </div>

              <div className="mt-12 text-center">
                <Link 
                  href="/register" 
                  className="inline-block bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-3 rounded-lg transition-colors"
                >
                  Đăng ký ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}