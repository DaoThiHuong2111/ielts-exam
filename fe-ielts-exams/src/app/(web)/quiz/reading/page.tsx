import ReadingGrid from '@/components/reading/reading-grid'
import ReadingHeader from '@/components/reading/reading-header'

export default function QuizReadingPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <ReadingHeader />
        <ReadingGrid />
      </div>
    </main>
  )
}
