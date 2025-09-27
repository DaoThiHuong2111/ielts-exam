import { PrismaClient, UserRole, TestType, QuestionType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await argon2.hash('admin123');
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@ielts.com',
      name: 'Admin User',
      firstName: 'Admin',
      lastName: 'User',
      password: adminPassword,
      role: UserRole.ADMIN,
      active: true,
    },
  });

  // Create test user
  const userPassword = await argon2.hash('user123');
  const testUser = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      email: 'test@ielts.com',
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      password: userPassword,
      role: UserRole.USER,
      active: true,
    },
  });

  console.log('✅ Users created');

  // Create sample reading quiz
  const readingQuiz = await prisma.quiz.create({
    data: {
      title: 'IELTS Academic Reading Practice Test 1',
      totalTimeLimit: 60,
      testType: TestType.READING,
      metadata: { totalQuestions: 6 },
      isPublished: true,
      isPublic: false,
      createdById: admin.id,
      parts: {
        create: [
          {
            partNumber: 1,
            title: 'Part 1: The History of Glass',
            content: {
              title: 'The History of Glass',
              subtitle: 'Read the passage and answer questions 1-10',
              paragraphs: [
                {
                  label: 'A',
                  text: 'Glass is a remarkable substance made from the simplest raw materials. It can be colored or colorless, monochrome or polychrome, transparent, translucent, or opaque. It is lightweight impermeable to liquids, readily cleaned and reusable, durable yet fragile, and often very beautiful.'
                },
                {
                  label: 'B',
                  text: 'Glass can be decorated in multiple ways and its optical properties exploited to create mirrors, lenses and prisms. Most glass for containers is soda-lime glass, which is made by heating a mixture of silica, sodium carbonate and lime.'
                }
              ]
            },
            questions: {
              create: [
                {
                  questionIndex: 0,
                  questionId: 'p1q1',
                  type: QuestionType.MULTIPLE_CHOICE,
                  data: {
                    prompt: 'What are the main raw materials for making soda-lime glass?',
                    options: [
                      { id: 'a', text: 'Silica, sodium carbonate, and lime' },
                      { id: 'b', text: 'Sand, water, and heat' },
                      { id: 'c', text: 'Glass, metal, and plastic' },
                      { id: 'd', text: 'Sodium, carbon, and oxygen' }
                    ],
                    correctAnswer: 'a'
                  }
                },
                {
                  questionIndex: 1,
                  questionId: 'p1q2',
                  type: QuestionType.TRUE_FALSE_NOTGIVEN,
                  data: {
                    prompt: 'Glass is always transparent.',
                    correctAnswer: 'FALSE'
                  }
                },
                {
                  questionIndex: 2,
                  questionId: 'p1q3',
                  type: QuestionType.TRUE_FALSE_NOTGIVEN,
                  data: {
                    prompt: 'Glass can be reused multiple times.',
                    correctAnswer: 'TRUE'
                  }
                },
                {
                  questionIndex: 3,
                  questionId: 'p1q4',
                  type: QuestionType.SENTENCE_COMPLETION,
                  data: {
                    text: 'Glass can be decorated in _______ ways.',
                    instruction: 'Complete the sentence using NO MORE THAN TWO WORDS from the passage.',
                    correctAnswer: 'multiple'
                  }
                },
                {
                  questionIndex: 4,
                  questionId: 'p1q5',
                  type: QuestionType.PARAGRAPH_MATCHING_TABLE,
                  data: {
                    instruction: 'Match the following characteristics with the correct paragraph.',
                    items: [
                      { id: 'i1', text: 'Mentions the weight of glass', correctParagraph: 'A' },
                      { id: 'i2', text: 'Discusses optical properties', correctParagraph: 'B' }
                    ]
                  }
                },
                {
                  questionIndex: 5,
                  questionId: 'p1q6',
                  type: QuestionType.MULTIPLE_SELECT,
                  data: {
                    instruction: 'Choose TWO answers.',
                    prompt: 'Which properties of glass are mentioned in paragraph A?',
                    options: [
                      { id: 'a', text: 'Lightweight' },
                      { id: 'b', text: 'Impermeable to liquids' },
                      { id: 'c', text: 'Heat resistant' },
                      { id: 'd', text: 'Durable yet fragile' },
                      { id: 'e', text: 'Often very beautiful' }
                    ],
                    maxSelections: 2,
                    correctAnswers: ['a', 'd']
                  }
                }
              ]
            }
          }
        ]
      }
    }
  });

  // Create sample listening quiz
  const listeningQuiz = await prisma.quiz.create({
    data: {
      title: 'IELTS Listening Practice Test 1',
      totalTimeLimit: 30,
      testType: TestType.LISTENING,
      metadata: { totalQuestions: 10 },
      isPublished: true,
      isPublic: true, // This one is public
      createdById: admin.id,
      parts: {
        create: [
          {
            partNumber: 1,
            title: 'Section 1: Booking a Hotel Room',
            content: {
              title: 'Booking a Hotel Room',
              subtitle: 'Questions 1-10',
              audioUrl: '/audio/listening-section-1.mp3'
            },
            questions: {
              create: [
                {
                  questionIndex: 0,
                  questionId: 'l1q1',
                  type: QuestionType.MULTIPLE_CHOICE,
                  data: {
                    prompt: 'What type of room does the customer want?',
                    options: [
                      { id: 'a', text: 'Single room' },
                      { id: 'b', text: 'Double room' },
                      { id: 'c', text: 'Twin room' },
                      { id: 'd', text: 'Suite' }
                    ],
                    correctAnswer: 'b'
                  }
                },
                {
                  questionIndex: 1,
                  questionId: 'l1q2',
                  type: QuestionType.TABLE_COMPLETION,
                  data: {
                    text: 'Complete the booking details below.',
                    tableData: {
                      headers: ['Item', 'Details'],
                      rows: [
                        {
                          cells: ['Check-in Date', '_____'],
                          answers: { '2': '15th March' }
                        },
                        {
                          cells: ['Number of Nights', '_____'],
                          answers: { '3': '3' }
                        },
                        {
                          cells: ['Room Type', 'Double'],
                          answers: {}
                        }
                      ]
                    }
                  }
                },
                {
                  questionIndex: 2,
                  questionId: 'l1q3',
                  type: QuestionType.MULTIPLE_SELECT,
                  data: {
                    instruction: 'Choose TWO answers.',
                    prompt: 'Which facilities does the hotel offer?',
                    options: [
                      { id: 'a', text: 'Swimming pool' },
                      { id: 'b', text: 'Gym' },
                      { id: 'c', text: 'Restaurant' },
                      { id: 'd', text: 'Spa' },
                      { id: 'e', text: 'Business center' }
                    ],
                    maxSelections: 2,
                    correctAnswers: ['a', 'c']
                  }
                }
              ]
            }
          }
        ]
      }
    }
  });

  // Create user quiz access - grant test user access to reading quiz
  await prisma.userQuizAccess.create({
    data: {
      userId: testUser.id,
      quizId: readingQuiz.id,
      grantedBy: admin.id,
      isActive: true,
      expiresAt: new Date(Date.now() + (parseInt(process.env.TOKEN_EXPIRY_DAYS || '30') * 24 * 60 * 60 * 1000)) // Use configurable value
    }
  });

  // Create a sample quiz session for test user
  await prisma.quizSession.create({
    data: {
      userId: testUser.id,
      quizId: listeningQuiz.id, // Public quiz
      startedAt: new Date(),
      answers: {
        'l1q1': 'b',
        'l1q2': '15th March',
        'l1q3': 'a,c'
      },
      isCompleted: false
    }
  });

  console.log('✅ Sample quizzes created');
  console.log('📋 Reading Quiz ID:', readingQuiz.id);
  console.log('📋 Listening Quiz ID:', listeningQuiz.id);
  console.log('👤 Admin credentials: username=admin, password=admin123');
  console.log('👤 User credentials: username=testuser, password=user123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });