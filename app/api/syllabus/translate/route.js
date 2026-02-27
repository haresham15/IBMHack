export async function POST() {
  return Response.json({
    courseName: 'CS 3430 — Data Structures',
    instructor: 'Dr. Sarah Chen',
    term: 'Spring 2025',
    tasks: [
      {
        id: 't1',
        title: 'Programming Assignment 1 — Linked Lists',
        plainEnglishDescription: 'Build a linked list that can add, remove, and search items. Think of it like a chain where each link points to the next one. You have 2 weeks.',
        dueDate: '2025-01-31',
        priority: 'high',
        estimatedMinutes: 180,
        confidence: 'high'
      },
      {
        id: 't2',
        title: 'Midterm Exam',
        plainEnglishDescription: 'In-class exam on everything from weeks 1 to 7. Bring your student ID. Review your notes from the first 7 lectures.',
        dueDate: '2025-02-28',
        priority: 'high',
        estimatedMinutes: 120,
        confidence: 'high'
      },
      {
        id: 't3',
        title: 'Weekly Reading — Chapter 4',
        plainEnglishDescription: 'Read Chapter 4 before Tuesday class. Focus on pages 88 to 102.',
        dueDate: '2025-01-21',
        priority: 'medium',
        estimatedMinutes: 60,
        confidence: 'medium'
      },
      {
        id: 't4',
        title: 'Final Project',
        plainEnglishDescription: 'Build a graph traversal algorithm and write a 3-page analysis.',
        dueDate: '2025-04-25',
        priority: 'high',
        estimatedMinutes: 480,
        confidence: 'high'
      },
      {
        id: 't5',
        title: 'Lab 2',
        plainEnglishDescription: 'Complete the sorting lab. Due date not fully clear in syllabus — verify with instructor.',
        dueDate: null,
        priority: 'medium',
        estimatedMinutes: 90,
        confidence: 'low'
      }
    ],
    policies: {
      attendance: 'Max 3 absences',
      lateWork: '10% per day, max 5 days'
    },
    processedAt: new Date().toISOString()
  })
}
