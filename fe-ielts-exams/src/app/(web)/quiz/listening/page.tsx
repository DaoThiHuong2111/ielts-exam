import ListeningHeader from '@/components/listening/listening-header'
import ListeningGrid from '@/components/listening/listening-grid'

export default function QuizListeningPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <ListeningHeader />
        <ListeningGrid />
      </div>
    </main>
  )
}