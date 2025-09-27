'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Upload, FileSpreadsheet, FileText, AlertCircle, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { MultiPartQuiz, QuizPart, Question } from '@/types/multi-part-quiz'

interface ImportQuizDialogProps {
  onImportSuccess: (quiz: MultiPartQuiz) => void
}

export default function ImportQuizDialog({ onImportSuccess }: ImportQuizDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const jsonFileInputRef = useRef<HTMLInputElement>(null)
  const excelFileInputRef = useRef<HTMLInputElement>(null)
  const csvFileInputRef = useRef<HTMLInputElement>(null)

  // Import từ JSON (function hiện tại)
  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string)
        
        // Validate required fields
        if (!jsonData.title || !jsonData.testType || !jsonData.parts) {
          alert('Invalid quiz format! Missing required fields.')
          return
        }

        // Generate new ID and create quiz
        const newId = Date.now().toString()
        const newQuiz: MultiPartQuiz = {
          id: newId,
          title: jsonData.title,
          totalTimeLimit: jsonData.totalTimeLimit || 60,
          testType: jsonData.testType,
          parts: jsonData.parts,
          metadata: jsonData.metadata || { totalQuestions: 0 }
        }

        onImportSuccess(newQuiz)
        alert('Quiz imported successfully from JSON!')
        setIsOpen(false)
        
      } catch (error) {
        console.error('Import error:', error)
        alert('Failed to import quiz. Please check your JSON format.')
      } finally {
        setImporting(false)
      }
    }
    
    reader.readAsText(file)
    event.target.value = '' // Reset input
  }

  // Import từ Excel
  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Lấy sheet đầu tiên
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

        const quiz = parseSpreadsheetData(jsonData, file.name)
        if (quiz) {
          onImportSuccess(quiz)
          alert('Quiz imported successfully from Excel!')
          setIsOpen(false)
        }
        
      } catch (error) {
        console.error('Excel import error:', error)
        alert('Failed to import Excel file. Please check the format.')
      } finally {
        setImporting(false)
      }
    }
    
    reader.readAsArrayBuffer(file)
    event.target.value = '' // Reset input
  }

  // Import từ CSV
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    Papa.parse(file, {
      complete: (results) => {
        try {
          const quiz = parseSpreadsheetData(results.data as any[][], file.name)
          if (quiz) {
            onImportSuccess(quiz)
            alert('Quiz imported successfully from CSV!')
            setIsOpen(false)
          }
        } catch (error) {
          console.error('CSV import error:', error)
          alert('Failed to import CSV file. Please check the format.')
        } finally {
          setImporting(false)
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error)
        alert('Failed to parse CSV file.')
        setImporting(false)
      }
    })
    
    event.target.value = '' // Reset input
  }

  // Parse dữ liệu từ spreadsheet (Excel/CSV) - Hỗ trợ đầy đủ tất cả field
  const parseSpreadsheetData = (data: any[][], fileName: string): MultiPartQuiz | null => {
    if (!data || data.length < 2) {
      alert('File không có dữ liệu hợp lệ!')
      return null
    }

    // Tìm header row
    let headerRowIndex = -1
    const expectedHeaders = ['question_id', 'part_number', 'question_type']
    
    console.log('🔍 Looking for header row in first 10 rows...')
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i]
      if (row && row.length > 0) {
        console.log(`Row ${i}:`, row.map(cell => String(cell).toLowerCase()))
        
        // Check if this row contains the expected headers
        const headers = row.map((cell: any) => String(cell).toLowerCase().trim())
        const foundHeaders = expectedHeaders.filter(expected => {
          return headers.some(header => header === expected || header.includes(expected.replace('_', '')))
        })
        
        console.log(`  Found headers: ${foundHeaders.length}/${expectedHeaders.length}`, foundHeaders)
        
        if (foundHeaders.length >= 3) { // Need at least 3 required headers
          headerRowIndex = i
          console.log(`✅ Using row ${i} as header row`)
          break
        }
      }
    }

    if (headerRowIndex === -1) {
      console.error('❌ No valid header row found')
      console.log('Expected headers:', expectedHeaders)
      alert('Không tìm thấy header row hợp lệ. Vui lòng đảm bảo file có các cột bắt buộc: question_id, part_number, question_type')
      return null
    }

    const headers = data[headerRowIndex].map((h: any) => String(h).toLowerCase().trim())
    const dataRows = data.slice(headerRowIndex + 1).filter(row => row && row.length > 0)

    // Map tất cả column indexes có thể có
    const colIndexes = {
      // Core fields
      questionId: findColumnIndex(headers, ['question_id', 'questionid', 'id']),
      partNumber: findColumnIndex(headers, ['part_number', 'partnumber', 'part']),
      questionType: findColumnIndex(headers, ['question_type', 'questiontype', 'type']),
      
      // Question content fields
      prompt: findColumnIndex(headers, ['prompt', 'question_prompt']),
      text: findColumnIndex(headers, ['text', 'question_text', 'questiontext', 'question']),
      instruction: findColumnIndex(headers, ['instruction', 'instructions']),
      
      // Answer fields
      correctAnswer: findColumnIndex(headers, ['correct_answer', 'correctanswer', 'answer']),
      correctAnswers: findColumnIndex(headers, ['correct_answers', 'correctanswers', 'answers']),
      
      // Options for multiple choice
      options: findColumnIndex(headers, ['options', 'choices', 'choice']),
      optionA: findColumnIndex(headers, ['option_a', 'optiona', 'a']),
      optionB: findColumnIndex(headers, ['option_b', 'optionb', 'b']),
      optionC: findColumnIndex(headers, ['option_c', 'optionc', 'c']),
      optionD: findColumnIndex(headers, ['option_d', 'optiond', 'd']),
      optionE: findColumnIndex(headers, ['option_e', 'optione', 'e']),
      optionF: findColumnIndex(headers, ['option_f', 'optionf', 'f']),
      
      // Advanced fields
      paragraphLabels: findColumnIndex(headers, ['paragraph_labels', 'paragraphlabels', 'labels']),
      maxSelections: findColumnIndex(headers, ['max_selections', 'maxselections', 'max_select']),
      
      // Table fields
      tableHeaders: findColumnIndex(headers, ['table_headers', 'tableheaders', 'headers']),
      tableRows: findColumnIndex(headers, ['table_rows', 'tablerows', 'rows']),
      tableOptions: findColumnIndex(headers, ['table_options', 'tableoptions']),
      
      // Quiz metadata
      title: findColumnIndex(headers, ['title', 'quiz_title', 'test_title']),
      testType: findColumnIndex(headers, ['test_type', 'testtype', 'type']),
      timeLimit: findColumnIndex(headers, ['time_limit', 'timelimit', 'time']),
      
      // Part content
      partTitle: findColumnIndex(headers, ['part_title', 'parttitle']),
      partContentTitle: findColumnIndex(headers, ['part_content_title', 'partcontenttitle', 'content_title']),
      partSubtitle: findColumnIndex(headers, ['part_subtitle', 'partsubtitle', 'subtitle']),
      paragraphs: findColumnIndex(headers, ['paragraphs', 'paragraph_text', 'passages']),
      audioUrl: findColumnIndex(headers, ['audio_url', 'audiourl', 'audio'])
    }

    // Validate required columns
    if (colIndexes.questionId === -1 || colIndexes.partNumber === -1 || colIndexes.questionType === -1) {
      alert('Thiếu các cột bắt buộc: question_id, part_number, question_type')
      return null
    }

    // Determine test type từ file name hoặc dữ liệu
    let testType: 'reading' | 'listening' = fileName.toLowerCase().includes('listening') ? 'listening' : 'reading'
    
    // Override if explicit test_type column exists
    if (colIndexes.testType !== -1 && dataRows.length > 0 && dataRows[0][colIndexes.testType]) {
      const typeFromData = String(dataRows[0][colIndexes.testType]).toLowerCase()
      if (typeFromData === 'listening' || typeFromData === 'reading') {
        testType = typeFromData as 'reading' | 'listening'
      }
    }
    
    // Get quiz title
    let quizTitle = 'Imported Quiz'
    if (colIndexes.title !== -1 && dataRows.length > 0 && dataRows[0][colIndexes.title]) {
      quizTitle = String(dataRows[0][colIndexes.title])
    } else {
      quizTitle = `${testType.charAt(0).toUpperCase() + testType.slice(1)} Quiz - ${new Date().toLocaleDateString()}`
    }

    // Get time limit
    let totalTimeLimit = testType === 'reading' ? 60 : 30
    if (colIndexes.timeLimit !== -1 && dataRows.length > 0 && dataRows[0][colIndexes.timeLimit]) {
      totalTimeLimit = parseInt(String(dataRows[0][colIndexes.timeLimit])) || totalTimeLimit
    }

    // Group questions by part và collect part information
    const partGroups: Record<number, { 
      questions: Question[], 
      title?: string, 
      contentTitle?: string, 
      subtitle?: string,
      paragraphs?: string,
      audioUrl?: string 
    }> = {}
    let totalQuestions = 0

    for (const row of dataRows) {
      if (!row || row.length === 0) continue

      const questionId = String(row[colIndexes.questionId] || `q_${Date.now()}_${Math.random()}`)
      const partNumber = parseInt(String(row[colIndexes.partNumber])) || 1
      const questionType = normalizeQuestionType(String(row[colIndexes.questionType]))

      if (!partGroups[partNumber]) {
        partGroups[partNumber] = { 
          questions: [],
          title: colIndexes.partTitle !== -1 ? String(row[colIndexes.partTitle] || `Part ${partNumber}`) : `Part ${partNumber}`,
          contentTitle: colIndexes.partContentTitle !== -1 ? String(row[colIndexes.partContentTitle] || '') : undefined,
          subtitle: colIndexes.partSubtitle !== -1 ? String(row[colIndexes.partSubtitle] || '') : undefined,
          paragraphs: colIndexes.paragraphs !== -1 ? String(row[colIndexes.paragraphs] || '') : undefined,
          audioUrl: colIndexes.audioUrl !== -1 ? String(row[colIndexes.audioUrl] || '') : undefined
        }
      }

      const question: Question = {
        id: questionId,
        type: questionType
      }

      // Add question text/prompt
      if (colIndexes.prompt !== -1 && row[colIndexes.prompt]) {
        question.prompt = String(row[colIndexes.prompt])
      }
      if (colIndexes.text !== -1 && row[colIndexes.text]) {
        question.text = String(row[colIndexes.text])
      }
      if (colIndexes.instruction !== -1 && row[colIndexes.instruction]) {
        question.instruction = String(row[colIndexes.instruction])
      }

      // Add correct answer(s)
      if (colIndexes.correctAnswer !== -1 && row[colIndexes.correctAnswer]) {
        question.correctAnswer = String(row[colIndexes.correctAnswer])
      }
      if (colIndexes.correctAnswers !== -1 && row[colIndexes.correctAnswers]) {
        const answers = String(row[colIndexes.correctAnswers]).split(/[;,|]/).map(s => s.trim()).filter(s => s)
        question.correctAnswers = answers
        if (!question.correctAnswer && answers.length > 0) {
          question.correctAnswer = answers
        }
      }

      // Add paragraph labels
      if (colIndexes.paragraphLabels !== -1 && row[colIndexes.paragraphLabels]) {
        question.paragraphLabels = String(row[colIndexes.paragraphLabels]).split(/[;,|]/).map(s => s.trim()).filter(s => s)
      }

      // Add max selections
      if (colIndexes.maxSelections !== -1 && row[colIndexes.maxSelections]) {
        question.maxSelections = parseInt(String(row[colIndexes.maxSelections])) || undefined
      }

      // Parse options - try individual columns first, then combined
      const options: { id: string, text: string }[] = []
      
      // Individual option columns
      if (colIndexes.optionA !== -1 && row[colIndexes.optionA]) options.push({ id: 'a', text: String(row[colIndexes.optionA]) })
      if (colIndexes.optionB !== -1 && row[colIndexes.optionB]) options.push({ id: 'b', text: String(row[colIndexes.optionB]) })
      if (colIndexes.optionC !== -1 && row[colIndexes.optionC]) options.push({ id: 'c', text: String(row[colIndexes.optionC]) })
      if (colIndexes.optionD !== -1 && row[colIndexes.optionD]) options.push({ id: 'd', text: String(row[colIndexes.optionD]) })
      if (colIndexes.optionE !== -1 && row[colIndexes.optionE]) options.push({ id: 'e', text: String(row[colIndexes.optionE]) })
      if (colIndexes.optionF !== -1 && row[colIndexes.optionF]) options.push({ id: 'f', text: String(row[colIndexes.optionF]) })
      
      // Combined options column as fallback
      if (options.length === 0 && colIndexes.options !== -1 && row[colIndexes.options]) {
        const combinedOptions = parseOptions(String(row[colIndexes.options]))
        options.push(...combinedOptions)
      }
      
      if (options.length > 0) {
        question.options = options
      }

      // Add table data for table-based questions
      if ((questionType === 'TABLE_COMPLETION' || questionType === 'MATCHING_TABLE') && 
          (colIndexes.tableHeaders !== -1 || colIndexes.tableRows !== -1)) {
        
        const tableData: any = {}
        
        if (colIndexes.tableHeaders !== -1 && row[colIndexes.tableHeaders]) {
          tableData.headers = String(row[colIndexes.tableHeaders]).split(/[;,|]/).map(s => s.trim()).filter(s => s)
        }
        
        if (colIndexes.tableRows !== -1 && row[colIndexes.tableRows]) {
          try {
            tableData.rows = JSON.parse(String(row[colIndexes.tableRows]))
          } catch {
            // Fallback to simple parsing
            tableData.rows = String(row[colIndexes.tableRows]).split(/[;|]/).map(rowStr => 
              rowStr.split(',').map(s => s.trim())
            )
          }
        }
        
        if (colIndexes.tableOptions !== -1 && row[colIndexes.tableOptions]) {
          try {
            tableData.options = JSON.parse(String(row[colIndexes.tableOptions]))
          } catch {
            // Simple key:value parsing
            const optionsStr = String(row[colIndexes.tableOptions])
            const options: Record<string, string> = {}
            optionsStr.split(/[;|]/).forEach(pair => {
              const [key, value] = pair.split(':').map(s => s.trim())
              if (key && value) options[key] = value
            })
            tableData.options = options
          }
        }
        
        if (Object.keys(tableData).length > 0) {
          question.tableData = tableData
        }
      }

      partGroups[partNumber].questions.push(question)
      totalQuestions++
    }

    // Create quiz parts với đầy đủ thông tin
    const parts: QuizPart[] = Object.entries(partGroups)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([partNum, partData]) => {
        const partNumber = parseInt(partNum)
        const part: QuizPart = {
          partNumber,
          title: partData.title || `Part ${partNumber}`,
          content: {
            title: partData.contentTitle || partData.title || `Part ${partNumber}`,
            subtitle: partData.subtitle || `${partData.questions.length} questions`
          },
          questions: partData.questions
        }

        // Add paragraphs for reading
        if (testType === 'reading' && partData.paragraphs) {
          part.content.paragraphs = partData.paragraphs.split(/\n\n|\|\|/).map((text, index) => ({
            label: String.fromCharCode(65 + index), // A, B, C, D...
            text: text.trim()
          })).filter(p => p.text.length > 0)
        }

        // Add audio URL for listening
        if (testType === 'listening' && partData.audioUrl) {
          part.content.audioUrl = partData.audioUrl
        }

        return part
      })

    const newQuiz: MultiPartQuiz = {
      id: Date.now().toString(),
      title: quizTitle,
      totalTimeLimit,
      testType,
      parts,
      metadata: {
        totalQuestions
      }
    }

    return newQuiz
  }

  // Helper functions
  const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
    for (const name of possibleNames) {
      // Try exact match first
      let index = headers.findIndex(h => h.toLowerCase().trim() === name.toLowerCase())
      if (index !== -1) return index
      
      // Try includes match as fallback
      index = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()))
      if (index !== -1) return index
    }
    return -1
  }

  const normalizeQuestionType = (type: string): Question['type'] => {
    const lowerType = type.toLowerCase().trim()
    if (lowerType.includes('multiple') || lowerType.includes('choice')) return 'MULTIPLE_CHOICE'
    if (lowerType.includes('true') || lowerType.includes('false')) return 'TRUE_FALSE_NOTGIVEN'
    if (lowerType.includes('completion') || lowerType.includes('fill')) return 'SENTENCE_COMPLETION'
    if (lowerType.includes('matching')) return 'PARAGRAPH_MATCHING_TABLE'
    if (lowerType.includes('drag')) return 'DRAG_AND_DROP'
    return 'MULTIPLE_CHOICE' // default
  }

  const parseOptions = (optionsText: string) => {
    return optionsText.split(/[;,|\n]/)
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0)
      .map((text, index) => ({
        id: `option_${index}`,
        text
      }))
  }

  // Tạo và tải file Excel mẫu với dropdown
  const downloadSampleExcel = (testType: 'reading' | 'listening') => {
    // Tạo workbook mới
    const wb = XLSX.utils.book_new()
    
    // Tạo sheet với header và sample data
    const headers = [
      'question_id', 'part_number', 'question_type', 'prompt', 'text', 'instruction',
      'correct_answer', 'correct_answers', 'option_a', 'option_b', 'option_c', 'option_d',
      'paragraph_labels', 'max_selections', 'table_headers', 'table_rows', 'table_options',
      'title', 'test_type', 'time_limit', 'part_title', 'part_content_title', 
      'part_subtitle', 'paragraphs', 'audio_url'
    ]

    // Sample data dựa trên test type
    const sampleData = []
    if (testType === 'reading') {
      sampleData.push([
        'q1', 1, 'MULTIPLE_CHOICE', 'What is the main idea of paragraph A?', '', '',
        'c', '', 'Climate change affects wildlife', 'Technology improves life', 'Education is important', 'Economy grows slowly',
        '', '', '', '', '',
        'IELTS Reading Practice Test', 'reading', 60, 'Part 1', 'Reading Passage 1', 
        'Questions 1-13', 'Climate change has become one of the most pressing issues of our time. Scientists around the world are working to understand its impact on various ecosystems.||Recent studies show that many species are adapting to changing temperatures by altering their migration patterns.', ''
      ])
      sampleData.push([
        'q2', 1, 'TRUE_FALSE_NOTGIVEN', '', 'The passage states that all species are successfully adapting to climate change.', '',
        'FALSE', '', '', '', '', '',
        '', '', '', '', '',
        '', '', '', '', '', 
        '', '', ''
      ])
      sampleData.push([
        'q3', 1, 'SENTENCE_COMPLETION', '', 'Many species are changing their _______ patterns due to temperature changes.', '',
        'migration', '', '', '', '', '',
        '', '', '', '', '',
        '', '', '', '', '', 
        '', '', ''
      ])
    } else {
      sampleData.push([
        'q1', 1, 'MULTIPLE_CHOICE', 'What does the speaker say about the museum?', '', '',
        'a', '', 'It opens at 9 AM', 'It closes at 5 PM', 'It has free entry', 'It requires booking',
        '', '', '', '', '',
        'IELTS Listening Practice Test', 'listening', 30, 'Part 1', 'Listening Section 1', 
        'Questions 1-10', '', '/audio/listening-section-1.mp3'
      ])
      sampleData.push([
        'q2', 1, 'TABLE_COMPLETION', '', 'Complete the booking form', '',
        'Smith', '', '', '', '', '',
        '', '', 'Name;Phone;Date', 'Smith,123456,Today', '1:Name,2:Phone,3:Date',
        '', '', '', '', '', 
        '', '', '/audio/listening-section-1.mp3'
      ])
    }

    // Tạo worksheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData])

    // Thêm data validation (dropdown) cho các cột
    if (!ws['!dataValidation']) ws['!dataValidation'] = []

    // Question types dropdown
    const questionTypes = [
      'MULTIPLE_CHOICE', 'TRUE_FALSE_NOTGIVEN', 'SENTENCE_COMPLETION', 
      'PARAGRAPH_MATCHING_TABLE', 'DRAG_AND_DROP', 'TABLE_COMPLETION', 
      'MULTIPLE_SELECT', 'MATCHING_TABLE'
    ]
    
    // Test type dropdown  
    const testTypes = ['reading', 'listening']
    
    // Part numbers dropdown
    const partNumbers = ['1', '2', '3', '4']

    // Add dropdowns for multiple rows (100 rows should be enough)
    for (let row = 2; row <= 100; row++) {
      // Question type dropdown (column C)
      ws['!dataValidation'].push({
        type: 'list',
        allowBlank: true,
        formula1: `"${questionTypes.join(',')}"`,
        sqref: `C${row}`
      })
      
      // Part number dropdown (column B)
      ws['!dataValidation'].push({
        type: 'list',
        allowBlank: true,
        formula1: `"${partNumbers.join(',')}"`,
        sqref: `B${row}`
      })
      
      // Test type dropdown (column S)
      ws['!dataValidation'].push({
        type: 'list',
        allowBlank: true,
        formula1: `"${testTypes.join(',')}"`,
        sqref: `S${row}`
      })
    }

    // Thiết lập độ rộng cột
    const colWidths = [
      {wch: 12}, // question_id
      {wch: 8},  // part_number
      {wch: 20}, // question_type
      {wch: 30}, // prompt
      {wch: 30}, // text
      {wch: 20}, // instruction
      {wch: 15}, // correct_answer
      {wch: 15}, // correct_answers
      {wch: 25}, // option_a
      {wch: 25}, // option_b
      {wch: 25}, // option_c
      {wch: 25}, // option_d
      {wch: 15}, // paragraph_labels
      {wch: 12}, // max_selections
      {wch: 20}, // table_headers
      {wch: 30}, // table_rows
      {wch: 20}, // table_options
      {wch: 30}, // title
      {wch: 10}, // test_type
      {wch: 10}, // time_limit
      {wch: 15}, // part_title
      {wch: 20}, // part_content_title
      {wch: 15}, // part_subtitle
      {wch: 50}, // paragraphs
      {wch: 30}  // audio_url
    ]
    ws['!cols'] = colWidths

    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Quiz Data')

    // Tạo sheet hướng dẫn
    const instructionData = [
      ['HƯỚNG DẪN SỬ DỤNG FILE EXCEL MẪU'],
      [''],
      ['CÁC CỘT BẮT BUỘC:'],
      ['- question_id: ID duy nhất của câu hỏi (vd: q1, q2, q3...)'],
      ['- part_number: Số phần (1, 2, 3, 4)'],
      ['- question_type: Loại câu hỏi (có dropdown menu)'],
      [''],
      ['CÁC CỘT TÙY CHỌN:'],
      ['- prompt: Câu hỏi chính'],
      ['- text: Nội dung câu hỏi chi tiết'],
      ['- instruction: Hướng dẫn làm bài'],
      ['- correct_answer: Đáp án đúng'],
      ['- correct_answers: Nhiều đáp án đúng (phân cách bằng ;)'],
      ['- option_a, option_b, option_c, option_d: Các lựa chọn'],
      ['- paragraph_labels: Nhãn đoạn văn (A,B,C...)'],
      ['- max_selections: Số lựa chọn tối đa'],
      ['- table_headers: Header của bảng (phân cách bằng ;)'],
      ['- table_rows: Dữ liệu hàng của bảng (JSON hoặc phân cách)'],
      ['- table_options: Tùy chọn bảng (JSON)'],
      ['- title: Tiêu đề quiz'],
      ['- test_type: Loại test (reading/listening)'],
      ['- time_limit: Thời gian làm bài (phút)'],
      ['- part_title: Tiêu đề phần'],
      ['- part_content_title: Tiêu đề nội dung phần'],
      ['- part_subtitle: Phụ đề phần'],
      ['- paragraphs: Đoạn văn (phân cách bằng ||)'],
      ['- audio_url: Link file âm thanh (cho listening)'],
      [''],
      ['LOẠI CÂU HỎI:'],
      ['- MULTIPLE_CHOICE: Trắc nghiệm'],
      ['- TRUE_FALSE_NOTGIVEN: Đúng/Sai/Không đề cập'],
      ['- SENTENCE_COMPLETION: Hoàn thành câu'],
      ['- PARAGRAPH_MATCHING_TABLE: Nối đoạn với bảng'],
      ['- DRAG_AND_DROP: Kéo thả'],
      ['- TABLE_COMPLETION: Hoàn thành bảng'],
      ['- MULTIPLE_SELECT: Chọn nhiều'],
      ['- MATCHING_TABLE: Bảng nối'],
      [''],
      ['LƯU Ý:'],
      ['- Sử dụng dropdown menu để chọn question_type, part_number, test_type'],
      ['- Đối với Reading: thêm nội dung paragraphs'],
      ['- Đối với Listening: thêm audio_url'],
      ['- Phân cách nhiều giá trị bằng dấu ; hoặc ,'],
      ['- Có thể để trống các cột không cần thiết']
    ]

    const instructionWs = XLSX.utils.aoa_to_sheet(instructionData)
    instructionWs['!cols'] = [{wch: 80}]
    XLSX.utils.book_append_sheet(wb, instructionWs, 'Hướng Dẫn')

    // Tải file
    const fileName = `quiz-template-${testType}-${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import Quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Quiz</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Định dạng file Excel/CSV:</p>
              <p>Có thể có tất cả các cột: question_id, part_number, question_type, prompt, text, correct_answer, options, v.v.</p>
              <p className="mt-1 font-medium">💡 Tip: Tải file Excel mẫu để có dropdown menu thông minh!</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Download sample files section */}
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">📥 Tải File Excel Mẫu (Có Dropdown Menu)</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadSampleExcel('reading')}
                  disabled={importing}
                  className="justify-start border-green-300 text-green-700 hover:bg-green-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Reading Template
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadSampleExcel('listening')}
                  disabled={importing}
                  className="justify-start border-green-300 text-green-700 hover:bg-green-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Listening Template
                </Button>
              </div>
            </div>

            {/* Import files section */}
            <div className="grid grid-cols-1 gap-3">
              <div className="text-sm font-medium text-gray-700 mb-1">📤 Import Quiz từ File</div>
              
              {/* JSON Import */}
              <Button 
                variant="outline" 
                onClick={() => jsonFileInputRef.current?.click()}
                disabled={importing}
                className="justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                Import từ JSON
              </Button>

              {/* Excel Import */}
              <Button 
                variant="outline" 
                onClick={() => excelFileInputRef.current?.click()}
                disabled={importing}
                className="justify-start"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Import từ Excel (.xlsx)
              </Button>

              {/* CSV Import */}
              <Button 
                variant="outline" 
                onClick={() => csvFileInputRef.current?.click()}
                disabled={importing}
                className="justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                Import từ CSV
              </Button>
            </div>
          </div>

          {importing && (
            <div className="text-center text-sm text-gray-600">
              Đang import file...
            </div>
          )}
        </div>

        {/* Hidden file inputs */}
        <input
          ref={jsonFileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportJSON}
          className="hidden"
        />
        <input
          ref={excelFileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImportExcel}
          className="hidden"
        />
        <input
          ref={csvFileInputRef}
          type="file"
          accept=".csv"
          onChange={handleImportCSV}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  )
}