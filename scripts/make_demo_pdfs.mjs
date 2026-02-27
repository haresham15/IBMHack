/**
 * scripts/make_demo_pdfs.mjs
 * Generates 3 synthetic demo syllabus PDFs and writes them to ./demo-syllabi/.
 * Run: node scripts/make_demo_pdfs.mjs
 */

import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dir, '..')
const DEMO_DIR = resolve(root, 'demo-syllabi')

mkdirSync(DEMO_DIR, { recursive: true })

// ── Minimal-valid PDF builder ─────────────────────────────────────────────────
// Produces a PDF that pdf-parse can extract text from.

function makePDF(bodyText) {
  const escaped = bodyText
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')

  const words = escaped.split(' ')
  const lines = []
  let current = ''
  for (const w of words) {
    const candidate = current ? current + ' ' + w : w
    if (candidate.length > 72) { lines.push(current); current = w }
    else { current = candidate }
  }
  if (current) lines.push(current)

  // Place lines top-to-bottom; allow overflow — pdf-parse extracts text regardless of position
  const streamLines = lines
    .map((l, i) => `BT /F1 10 Tf 40 ${760 - i * 13} Td (${l}) Tj ET`)
    .join('\n')
  const streamLen = Buffer.byteLength(streamLines, 'utf8')

  const objects = [
    '1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n',
    '2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n',
    '3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>\nendobj\n',
    `4 0 obj\n<</Length ${streamLen}>>\nstream\n${streamLines}\nendstream\nendobj\n`,
    '5 0 obj\n<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>\nendobj\n'
  ]

  const header = '%PDF-1.4\n'
  let pos = header.length
  const offsets = []
  for (const obj of objects) { offsets.push(pos); pos += Buffer.byteLength(obj, 'utf8') }
  const xrefPos = pos

  const xref = [
    'xref\n0 6\n',
    '0000000000 65535 f \n',
    ...offsets.map(o => `${String(o).padStart(10, '0')} 00000 n \n`)
  ].join('')

  const trailer = `trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${xrefPos}\n%%EOF`
  return Buffer.from(header + objects.join('') + xref + trailer, 'utf8')
}

// ── Demo Syllabus 1: CS Software Engineering ──────────────────────────────────

const CS_SYLLABUS = `
CS 4890 Advanced Software Engineering Spring 2025
Instructor: Professor Alice Zhou Department of Computer Science
Term: Spring 2025 Credits: 3

Course Description:
This course covers advanced software engineering principles including software architecture,
design patterns, testing methodologies, CI/CD pipelines, and team-based development practices.
Students will apply these concepts in a semester-long group project.

Schedule and Assignments:

Programming Assignment 1 - REST API Design
Design and implement a RESTful API with JWT authentication and rate limiting.
Include OpenAPI documentation and unit tests with at least 80 percent code coverage.
Worth 15 percent of final grade (150 points).
Due: February 14 2025

Programming Assignment 2 - Microservices Architecture
Refactor the PA1 monolith into 3 loosely-coupled microservices using Docker Compose.
Add integration tests and a circuit breaker pattern.
Worth 20 percent of final grade (200 points).
Due: March 14 2025

Midterm Exam
In-class written exam covering Weeks 1 through 7. Topics include design patterns, SOLID principles,
testing strategies, and system design. Bring your student ID. No notes allowed.
Worth 25 percent of final grade.
Due: March 7 2025

Code Review Lab 3
Conduct a structured code review session with your assigned partner.
Submit a written report identifying at least 5 issues and proposed fixes.
Worth 10 percent of final grade (100 points).
Due: April 4 2025

Final Project - Full Stack Application
Build and deploy a full-stack web application as a team of 3-4 students.
Includes architecture design document, implementation, 3 user interviews, and a 10-minute demo.
Worth 30 percent of final grade.
Due: April 25 2025

Course Policies:
Attendance: Students may miss up to 3 lectures without penalty. Fourth absence and beyond
results in 5 percent deduction per absence from the final grade.
Late Work: 10 percent deducted per calendar day late. No submissions accepted after 5 days.
Academic Integrity: All submitted code must be your own original work. Use of AI code
generation tools must be disclosed. Plagiarism results in an automatic F for the course.
Collaboration: You may discuss approaches with classmates but all code must be written
individually except for the explicitly designated group Final Project.
`.trim()

// ── Demo Syllabus 2: PSYC Cognitive Psychology ───────────────────────────────

const PSYC_SYLLABUS = `
PSYC 3210 Cognitive Psychology Fall 2025
Instructor: Dr. Marcus Webb Department of Psychology
Term: Fall 2025 Credits: 3

Course Description:
An examination of human cognitive processes including attention, memory, language, problem solving,
decision making, and reasoning. We review classic experiments and current cognitive neuroscience
research. Students develop skills in reading primary literature and designing basic experiments.

Reading Quizzes (weekly)
Short 10-minute quiz at the start of each Tuesday class covering that weeks assigned readings.
Chapters are listed in the course schedule below. Total worth 10 percent of final grade.
Due: Every Tuesday beginning September 9 2025

Research Summary Paper 1 - Memory
Summarize and critique one peer-reviewed article on long-term memory or working memory published
after 2020. 4-5 pages APA format. Sources from PsycINFO or Google Scholar.
Worth 15 percent of final grade.
Due: October 3 2025

Midterm Exam
In-class exam covering Modules 1-4 (Chapters 1-8). Multiple choice and short answer.
Bring your student ID and two pencils. No devices allowed during the exam.
Worth 25 percent of final grade.
Due: October 17 2025

Research Proposal
Propose an original cognitive psychology experiment. Include rationale, hypotheses, method section,
proposed analysis, and ethical considerations. 6-8 pages APA format.
Worth 20 percent of final grade.
Due: November 14 2025

Final Exam
Cumulative exam covering all course material. Focus on Modules 5-8 but integrates earlier content.
In-class format, 2 hours. Open one sheet of notes (both sides, handwritten only).
Worth 30 percent of final grade.
Due: December 12 2025

Course Policies:
Attendance: Attendance is not mandatory but in-class quizzes cannot be made up without a
documented medical or family emergency submitted within 48 hours of the missed class.
Late Work: Papers submitted late will be penalized 10 percent per day. Papers more than
one week late will not be accepted and receive a zero.
Academic Integrity: All written work must be your own. Paraphrasing without citation and
AI-generated text without disclosure are treated as plagiarism.
`.trim()

// ── Demo Syllabus 3: BIOL Cell Biology ───────────────────────────────────────

const BIOL_SYLLABUS = `
BIOL 2400 Cell Biology Spring 2025
Instructor: Professor Sarah Kim Department of Biology
Term: Spring 2025 Credits: 4 (3 lecture + 1 lab)

Course Description:
Explores the structure and function of eukaryotic and prokaryotic cells including membrane biology,
cell signaling, the cytoskeleton, cell cycle regulation, and cancer biology. The lab section
covers microscopy, cell culture, and standard molecular biology techniques.

Lab Report 1 - Microscopy and Cell Structure
Prepare a formal lab report on the microscopy lab from Week 3. Include your observations,
labeled diagrams, and answers to all post-lab questions. APA citations for any outside sources.
Worth 8 percent of final grade.
Due: February 21 2025

Problem Set 1 - Membrane Transport
Complete all 12 problems in the Problem Set 1 packet (available on Canvas).
Show all work for calculations. Answers without work receive no credit.
Worth 10 percent of final grade.
Due: March 7 2025

Midterm Exam 1
Covers Modules 1-4: cell structure, membrane biology, and transport mechanisms.
Multiple choice (40 questions), short answer (4 questions), and one diagram labeling question.
Bring a pencil. No calculators for this exam.
Worth 20 percent of final grade.
Due: March 14 2025

Lab Report 2 - Cell Signaling Pathway
Report on the Western blot experiment from Week 8. Include gel image analysis, quantification,
interpretation of signaling results, and comparison to published literature (minimum 3 sources).
Worth 12 percent of final grade.
Due: April 4 2025

Midterm Exam 2
Covers Modules 5-8: cytoskeleton, cell cycle, apoptosis, and cancer biology.
Same format as Midterm 1. Open 1 page of handwritten notes.
Worth 20 percent of final grade.
Due: April 18 2025

Final Exam
Cumulative exam with emphasis on integration across all modules. 3-hour in-person exam.
Includes a case study section requiring analysis of a novel experimental scenario.
Worth 30 percent of final grade.
Due: May 9 2025

Course Policies:
Attendance: Lab attendance is mandatory. Missing more than 2 labs results in automatic failure
of the lab component. Lecture attendance is strongly recommended but not tracked.
Late Work: Lab reports submitted late lose 15 percent per day. Problem sets lose 10 percent per day.
No late work accepted after the answer key is posted (typically 5 days after the due date).
Academic Integrity: Data fabrication or manipulation in lab reports is a serious academic violation
and will be reported to the Dean of Students.
`.trim()

// ── Generate and write PDFs ───────────────────────────────────────────────────

const syllabi = [
  { file: 'cs-software-engineering.pdf', text: CS_SYLLABUS },
  { file: 'psyc-cognitive-psychology.pdf', text: PSYC_SYLLABUS },
  { file: 'biol-cell-biology.pdf', text: BIOL_SYLLABUS }
]

for (const { file, text } of syllabi) {
  const outPath = resolve(DEMO_DIR, file)
  const buf = makePDF(text)
  writeFileSync(outPath, buf)
  const wordCount = text.split(/\s+/).filter(Boolean).length
  console.log(`  ✓ ${file} (${wordCount} words, ${buf.length} bytes)`)
}

console.log(`\nDone. 3 PDFs written to demo-syllabi/`)
