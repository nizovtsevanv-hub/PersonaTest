// Builds the bilingual "Student Speaking Profile" from questionnaire answers.
import { sections } from './questions.js'

// Lookup: question id -> option EN text -> option RU text
const optionRuMap = {}
// Lookup: question id -> the question object
const questionMap = {}
for (const section of sections) {
  for (const q of section.questions) {
    questionMap[q.id] = q
    if (q.options) {
      optionRuMap[q.id] = {}
      for (const o of q.options) optionRuMap[q.id][o.en] = o.ru
    }
  }
}

const NONE_EN = 'Not answered yet.'
const NONE_RU = 'Пока нет ответа.'

// Return { en: [...], ru: [...] } arrays of selected labels for a choice question.
function selectedLabels(answers, qid) {
  const q = questionMap[qid]
  const val = answers[qid]
  const en = []
  const ru = []
  if (Array.isArray(val)) {
    for (const item of val) {
      en.push(item)
      ru.push((optionRuMap[qid] && optionRuMap[qid][item]) || item)
    }
  } else if (typeof val === 'string' && val) {
    en.push(val)
    ru.push((optionRuMap[qid] && optionRuMap[qid][val]) || val)
  }
  const other = answers[qid + '_other']
  if (q && q.hasOther && other && other.trim()) {
    en.push('Other: ' + other.trim())
    ru.push('Другое: ' + other.trim())
  }
  return { en, ru }
}

function joinOr(arr, empty) {
  return arr.length ? arr.join('; ') : empty
}

function textAnswer(answers, qid) {
  const v = answers[qid]
  return typeof v === 'string' ? v.trim() : ''
}

export function buildProfile(answers) {
  const fields = []
  const add = (key, labelEn, labelRu, valueEn, valueRu) =>
    fields.push({ key, labelEn, labelRu, valueEn, valueRu })

  // 1. Main English goal
  const goal = selectedLabels(answers, 'q1')
  add(
    'goal',
    'Main goal',
    'Главная цель',
    goal.en.length
      ? 'The student wants to improve spoken English to: ' + joinOr(goal.en, NONE_EN)
      : NONE_EN,
    goal.ru.length
      ? 'Ученик хочет улучшить разговорный английский, чтобы: ' + joinOr(goal.ru, NONE_RU)
      : NONE_RU,
  )

  // 2. Main speaking bottleneck
  const bottleneckText = textAnswer(answers, 'q6')
  const bottleneckChoices = selectedLabels(answers, 'q4')
  add(
    'bottleneck',
    'Main bottleneck',
    'Главное узкое место',
    bottleneckText
      ? 'The main speaking bottleneck is: ' + bottleneckText
      : 'The main speaking bottleneck: ' + joinOr(bottleneckChoices.en, NONE_EN),
    bottleneckText
      ? 'Главное узкое место в говорении: ' + bottleneckText
      : 'Главное узкое место в говорении: ' + joinOr(bottleneckChoices.ru, NONE_RU),
  )

  // 3. Communication style
  const prefer = selectedLabels(answers, 'q7')
  const partner = selectedLabels(answers, 'q8')
  add(
    'style',
    'Communication style',
    'Стиль общения',
    'In conversation the student prefers to ' +
      joinOr(prefer.en, NONE_EN).toLowerCase() +
      (partner.en.length ? ' A comfortable partner is: ' + joinOr(partner.en, '') + '.' : ''),
    'В разговоре ученик предпочитает: ' +
      joinOr(prefer.ru, NONE_RU) +
      (partner.ru.length ? ' Комфортный собеседник: ' + joinOr(partner.ru, '') + '.' : ''),
  )

  // 4. Comfortable lesson format
  const openUp = selectedLabels(answers, 'q9')
  const practice = selectedLabels(answers, 'q15')
  add(
    'format',
    'Best lesson format',
    'Лучший формат урока',
    'The student opens up with: ' +
      joinOr(openUp.en, NONE_EN) +
      (practice.en.length ? ' Preferred practice: ' + joinOr(practice.en, '') + '.' : ''),
    'Ученик раскрывается, когда есть: ' +
      joinOr(openUp.ru, NONE_RU) +
      (practice.ru.length ? ' Предпочтительная практика: ' + joinOr(practice.ru, '') + '.' : ''),
  )

  // 5. Best topics for speaking
  const topics = selectedLabels(answers, 'q12')
  const backupTopics = selectedLabels(answers, 'q10')
  add(
    'topics',
    'Best topics for speaking',
    'Лучшие темы для говорения',
    joinOr(topics.en.length ? topics.en : backupTopics.en, NONE_EN),
    joinOr(topics.ru.length ? topics.ru : backupTopics.ru, NONE_RU),
  )

  // 6. Topics to avoid
  const avoid = selectedLabels(answers, 'q11')
  add(
    'avoid',
    'Topics to avoid',
    'Темы, которых лучше избегать',
    joinOr(avoid.en, NONE_EN),
    joinOr(avoid.ru, NONE_RU),
  )

  // 7. Learning style
  const learn = selectedLabels(answers, 'q13')
  add(
    'learning',
    'Learning style',
    'Стиль обучения',
    'The student learns better when: ' + joinOr(learn.en, NONE_EN),
    'Ученик лучше учится, когда: ' + joinOr(learn.ru, NONE_RU),
  )

  // 8. Best anchor reference
  const anchor = selectedLabels(answers, 'q14')
  add(
    'anchor',
    'Best anchor reference',
    'Лучший опорный ориентир',
    joinOr(anchor.en, NONE_EN),
    joinOr(anchor.ru, NONE_RU),
  )

  // 9. Confidence level
  const conf = answers['q19']
  const confQ = questionMap['q19']
  add(
    'confidence',
    'Confidence level',
    'Уровень уверенности',
    conf ? `${conf} / 5 — ${confQ.labels.en[conf]}` : NONE_EN,
    conf ? `${conf} / 5 — ${confQ.labels.ru[conf]}` : NONE_RU,
  )

  // 10. Recommended first 3 lessons
  const lessons = [
    { en: 'My Speaking Bottleneck & Personal Agency', ru: 'Моё узкое место в говорении и личная активная позиция' },
    { en: 'My Interests & Conversation Flow', ru: 'Мои интересы и ход разговора' },
    { en: 'My Opinion, My Examples, My Questions', ru: 'Моё мнение, мои примеры, мои вопросы' },
  ]

  // 11. Active vocabulary to start with
  const vocab = [
    { en: 'speaking bottleneck', ru: 'узкое место в говорении' },
    { en: 'personal agency', ru: 'личная активная позиция' },
    { en: 'anchor reference', ru: 'опорный ориентир' },
    { en: 'strong consistency', ru: 'сильная регулярность' },
    { en: 'next action', ru: 'следующий шаг' },
    { en: 'confidence level', ru: 'уровень уверенности' },
    { en: 'structured answer', ru: 'структурированный ответ' },
  ]

  // 12. Student's next action
  const nextText = textAnswer(answers, 'q18')
  const nextChoice = selectedLabels(answers, 'q17')
  add(
    'next',
    'Next action',
    'Следующий шаг',
    nextText
      ? "The student's first next action is: " + nextText
      : "The student's first next action: " + joinOr(nextChoice.en, NONE_EN),
    nextText
      ? 'Первый следующий шаг ученика: ' + nextText
      : 'Первый следующий шаг ученика: ' + joinOr(nextChoice.ru, NONE_RU),
  )

  const teacherNoteEn =
    'Teacher note: This questionnaire is a starting point. The answers should guide the first lessons, but the teacher can update the profile after live speaking practice.'
  const teacherNoteRu =
    'Заметка преподавателю: Эта анкета — отправная точка. Ответы должны направлять первые уроки, но преподаватель может обновить профиль после живой разговорной практики.'

  return { fields, lessons, vocab, teacherNoteEn, teacherNoteRu }
}

// Plain-text version of the profile for TXT export / clipboard.
export function profileToText(profile) {
  const lines = []
  lines.push('STUDENT SPEAKING PROFILE')
  lines.push('English Partner Profile — Speaking & Personality Map')
  lines.push('='.repeat(52))
  lines.push('')
  lines.push('--- ENGLISH ---')
  lines.push('')
  for (const f of profile.fields) {
    lines.push(`${f.labelEn}:`)
    lines.push(f.valueEn)
    lines.push('')
  }
  lines.push('Recommended first 3 lessons:')
  profile.lessons.forEach((l, i) => lines.push(`  Lesson ${i + 1}: ${l.en}`))
  lines.push('')
  lines.push('Active vocabulary to start with:')
  profile.vocab.forEach((v) => lines.push(`  - ${v.en}`))
  lines.push('')
  lines.push(profile.teacherNoteEn)
  lines.push('')
  lines.push('--- РУССКИЙ ---')
  lines.push('')
  for (const f of profile.fields) {
    lines.push(`${f.labelRu}:`)
    lines.push(f.valueRu)
    lines.push('')
  }
  lines.push('Рекомендуемые первые 3 урока:')
  profile.lessons.forEach((l, i) => lines.push(`  Урок ${i + 1}: ${l.ru}`))
  lines.push('')
  lines.push('Активная лексика для старта:')
  profile.vocab.forEach((v) => lines.push(`  - ${v.en} (${v.ru})`))
  lines.push('')
  lines.push(profile.teacherNoteRu)
  return lines.join('\n')
}
