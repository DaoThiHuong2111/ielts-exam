import Link from 'next/link'
import GuidelineHero from '../components/GuidelineHero'

export default function GuidelineReviewPage() {
  const reviewIllustration = (
    <div className="flex items-center justify-center space-x-4">
      {/* Student with book */}
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 bg-blue-300 rounded-full mb-4 flex items-center justify-center">
          <span className="text-2xl">📚</span>
        </div>
        <div className="w-8 h-12 bg-green-200 rounded-lg"></div>
      </div>
      
      {/* Student with laptop */}
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 bg-purple-200 rounded-full mb-4 flex items-center justify-center">
          <span className="text-2xl">💻</span>
        </div>
        <div className="w-8 h-12 bg-blue-200 rounded-lg"></div>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen">
      <GuidelineHero 
        title="Hướng dẫn ôn tập"
        breadcrumbText="Hướng dẫn ôn tập"
        illustration={reviewIllustration}
      />

      {/* Content Section */}
      <section className="pt-40 pb-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Phương pháp ôn tập hiệu quả</h2>
              
              <div className="space-y-8">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Lập kế hoạch ôn tập</h3>
                  <p className="text-gray-700 mb-4">
                    Tạo lịch trình ôn tập chi tiết và tuân thủ nghiêm ngặt:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Xác định thời gian ôn tập cho từng kỹ năng</li>
                    <li>Chia nhỏ mục tiêu hàng ngày, hàng tuần</li>
                    <li>Dành thời gian cho việc ôn lại kiến thức</li>
                    <li>Tạo thời gian nghỉ ngơi hợp lý</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Ôn tập 4 kỹ năng cơ bản</h3>
                  <p className="text-gray-700 mb-4">
                    Phân bổ thời gian hợp lý cho từng kỹ năng:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li><strong>Listening:</strong> Nghe podcast, TED Talks, BBC Learning English</li>
                    <li><strong>Reading:</strong> Đọc báo, tạp chí học thuật, Cambridge IELTS</li>
                    <li><strong>Writing:</strong> Luyện viết Task 1 và Task 2 hàng ngày</li>
                    <li><strong>Speaking:</strong> Luyện nói với partner hoặc ghi âm</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Sử dụng tài liệu chất lượng</h3>
                  <p className="text-gray-700 mb-4">
                    Chọn lọc tài liệu ôn tập uy tín và hiệu quả:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Cambridge IELTS series (sách chính thức)</li>
                    <li>IELTS.org - trang web chính thức</li>
                    <li>British Council Learning Hub</li>
                    <li>Ứng dụng mobile IELTS Prep</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">4. Luyện đề và đánh giá</h3>
                  <p className="text-gray-700 mb-4">
                    Thực hành với đề thi thật và tự đánh giá:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Làm test hoàn chính theo thời gian quy định</li>
                    <li>Phân tích lỗi sai và cải thiện</li>
                    <li>Tham gia mock test định kỳ</li>
                    <li>Nhờ giáo viên hoặc bạn bè góp ý</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
                  <h3 className="text-xl font-semibold text-yellow-800 mb-4">💡 Mẹo quan trọng</h3>
                  <p className="text-yellow-700">
                    Kiên trì và nhất quán là chìa khóa thành công. Ôn tập đều đặn mỗi ngày sẽ hiệu quả hơn việc học dồn trong thời gian ngắn.
                  </p>
                </div>
              </div>

              <div className="mt-12 text-center">
                <Link 
                  href="/practice" 
                  className="inline-block bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-3 rounded-lg transition-colors"
                >
                  Bắt đầu ôn tập
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}