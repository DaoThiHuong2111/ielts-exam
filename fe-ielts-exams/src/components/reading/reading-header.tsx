import { cn, typography } from '@/lib/design-tokens'

export default function ReadingHeader() {
  return (
    <div className="text-center mb-8">
      <h1 className={cn(typography.heading1, "text-gray-800 mb-4")}>
        IELTS Reading Quiz
      </h1>
      <p className={cn(typography.bodyLarge, "text-gray-600 max-w-2xl mx-auto")}>
        Luyện tập kỹ năng Reading với các đề thi thực tế và bài tập đa dạng
      </p>
    </div>
  )
}
