import Link from 'next/link'
import GuidelineHero from '../components/GuidelineHero'

export default function GuidelineTakeTestPage() {
  const takeTestIllustration = (
    <div className="flex items-center justify-center space-x-4">
      {/* Student taking test */}
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 bg-green-300 rounded-full mb-4 flex items-center justify-center">
          <span className="text-2xl">✍️</span>
        </div>
        <div className="w-8 h-12 bg-yellow-200 rounded-lg"></div>
      </div>
      
      {/* Computer test */}
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 bg-blue-300 rounded-full mb-4 flex items-center justify-center">
          <span className="text-2xl">💻</span>
        </div>
        <div className="w-8 h-12 bg-red-200 rounded-lg"></div>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen">
      <GuidelineHero 
        title="Hướng dẫn làm bài thi"
        breadcrumbText="Hướng dẫn làm bài thi"
        illustration={takeTestIllustration}
      />

      {/* Content Section */}
      <section className="pt-40 pb-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Hướng dẫn thực hiện bài thi IELTS</h2>
              
              <div className="space-y-8">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Chuẩn bị trước khi thi</h3>
                  <p className="text-gray-700 mb-4">
                    Những việc cần làm trước ngày thi:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Kiểm tra giấy tờ tùy thân (CMND/CCCD còn hạn)</li>
                    <li>Xác nhận địa điểm và thời gian thi</li>
                    <li>Chuẩn bị đồ dùng cần thiết (bút chì, tẩy, nước uống)</li>
                    <li>Nghỉ ngơi đầy đủ vào đêm trước</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Quy trình thi từng kỹ năng</h3>
                  <p className="text-gray-700 mb-4">
                    Thứ tự và thời gian làm bài:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li><strong>Listening (30 phút):</strong> 4 phần với độ khó tăng dần</li>
                    <li><strong>Reading (60 phút):</strong> 3 đoạn văn với 40 câu hỏi</li>
                    <li><strong>Writing (60 phút):</strong> Task 1 (20 phút) và Task 2 (40 phút)</li>
                    <li><strong>Speaking (11-14 phút):</strong> 3 phần với giám khảo</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Chiến lược làm bài hiệu quả</h3>
                  <p className="text-gray-700 mb-4">
                    Mẹo quan trọng khi làm bài:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Đọc kỹ yêu cầu đề bài trước khi bắt đầu</li>
                    <li>Quản lý thời gian chặt chẽ cho từng phần</li>
                    <li>Không bỏ trống câu nào, đoán nếu không chắc</li>
                    <li>Kiểm tra lại đáp án nếu còn thời gian</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">4. Lưu ý quan trọng trong phòng thi</h3>
                  <p className="text-gray-700 mb-4">
                    Những điều cần tuân thủ:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Tắt hoàn toàn điện thoại và thiết bị điện tử</li>
                    <li>Nghe theo hướng dẫn của giám thị</li>
                    <li>Ghi đáp án đúng vào phiếu trả lời</li>
                    <li>Không trao đổi với thí sinh khác</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
                  <h3 className="text-xl font-semibold text-blue-800 mb-4">⏰ Quản lý thời gian</h3>
                  <p className="text-blue-700">
                    Thành công trong IELTS phụ thuộc nhiều vào khả năng quản lý thời gian. Luyện tập thường xuyên với đồng hồ để quen với áp lực thời gian.
                  </p>
                </div>

                <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
                  <h3 className="text-xl font-semibold text-green-800 mb-4">🎯 Mẹo tâm lý</h3>
                  <p className="text-green-700">
                    Giữ tinh thần thoải mái, tự tin. Nếu gặp câu khó, hãy bỏ qua và quay lại sau. Đừng để một câu hỏi ảnh hưởng đến toàn bộ bài thi.
                  </p>
                </div>
              </div>

              <div className="mt-12 text-center">
                <Link 
                  href="/test" 
                  className="inline-block bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-3 rounded-lg transition-colors mr-4"
                >
                  Thi thử ngay
                </Link>
                <Link 
                  href="/mock-test" 
                  className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                >
                  Mock Test
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}