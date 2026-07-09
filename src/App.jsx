import { useEffect, useMemo, useState } from 'react'
import { sections, totalQuestions, activeVocabulary } from './questions.js'
import { buildProfile, profileToText } from './report.js'

const STORAGE_KEY = 'epp_answers_v1'
const STORAGE_META = 'epp_meta_v1'

function loadAnswers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function loadMeta() {
  try {
    const raw = localStorage.getItem(STORAGE_META)
    return raw ? JSON.parse(raw) : { name: '' }
  } catch {
    return { name: '' }
  }
}

function countAnswered(answers) {
  let n = 0
  for (const section of sections) {
    for (const q of section.questions) {
      const v = answers[q.id]
      if (Array.isArray(v)) {
        if (v.length) n++
      } else if (typeof v === 'number') {
        n++
      } else if (typeof v === 'string' && v.trim()) {
        n++
      }
    }
  }
  return n
}

/* ---------------- small UI pieces ---------------- */

function ProgressBar({ answered, total }) {
  const pct = total ? Math.round((answered / total) * 100) : 0
  return (
    <div className="progress" aria-label="Progress">
      <div className="progress-head">
        <span>
          {answered} / {total} answered
        </span>
        <span className="progress-pct">{pct}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: pct + '%' }} />
      </div>
    </div>
  )
}

function SectionNav({ current, onJump, answeredBySection }) {
  return (
    <nav className="section-nav" aria-label="Sections">
      {sections.map((s, i) => (
        <button
          key={s.id}
          className={
            'chip' +
            (i === current ? ' chip-active' : '') +
            (answeredBySection[i] === s.questions.length ? ' chip-done' : '')
          }
          onClick={() => onJump(i)}
          title={s.title.en}
        >
          <span className="chip-num">{i + 1}</span>
          <span className="chip-label">{s.title.en}</span>
        </button>
      ))}
    </nav>
  )
}

function VocabTag({ item }) {
  const [ru, setRu] = useState(false)
  return (
    <button
      type="button"
      className="vocab-tag"
      onClick={() => setRu((v) => !v)}
      title="Tap to translate"
    >
      {ru ? item.ru : item.en}
    </button>
  )
}

function BilingualHead({ q }) {
  const [showRu, setShowRu] = useState(false)
  return (
    <div className="q-head">
      <p className="q-en">{q.en}</p>
      <button className="ru-toggle" type="button" onClick={() => setShowRu((v) => !v)}>
        {showRu ? 'Hide Russian' : 'Show Russian'}
      </button>
      {showRu && <p className="q-ru">{q.ru}</p>}
    </div>
  )
}

/* ---------------- answer inputs ---------------- */

function ChoiceInput({ q, value, onChange, otherValue, onOther }) {
  const isMulti = q.type === 'checkbox' || q.type === 'checkbox-max'
  const selected = isMulti ? value || [] : value

  const toggle = (label) => {
    if (isMulti) {
      const arr = selected.includes(label)
        ? selected.filter((x) => x !== label)
        : [...selected, label]
      if (q.type === 'checkbox-max' && q.max && arr.length > q.max) return
      onChange(arr)
    } else {
      onChange(label)
    }
  }

  const limitReached =
    q.type === 'checkbox-max' && q.max && (selected || []).length >= q.max

  return (
    <div className="options">
      {q.type === 'checkbox-max' && (
        <p className="max-hint">Choose up to {q.max}. Выбери максимум {q.max}.</p>
      )}
      {q.options.map((o, i) => {
        const active = isMulti ? selected.includes(o.en) : selected === o.en
        const disabled = isMulti && !active && limitReached
        return (
          <OptionRow
            key={i}
            option={o}
            active={active}
            disabled={disabled}
            multi={isMulti}
            onClick={() => !disabled && toggle(o.en)}
          />
        )
      })}
      {q.hasOther && (
        <div className={'option-row option-other' + (otherValue ? ' active' : '')}>
          <span className={'marker ' + (isMulti ? 'box' : 'dot')} />
          <div className="other-wrap">
            <span className="other-label">Other / Другое:</span>
            <input
              className="other-input"
              type="text"
              value={otherValue || ''}
              placeholder="Type your own answer…"
              onChange={(e) => onOther(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function OptionRow({ option, active, disabled, multi, onClick }) {
  const [showRu, setShowRu] = useState(false)
  return (
    <div
      className={'option-row' + (active ? ' active' : '') + (disabled ? ' disabled' : '')}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <span className={'marker ' + (multi ? 'box' : 'dot')} />
      <span className="option-text">{showRu ? option.ru : option.en}</span>
      <button
        type="button"
        className="mini-ru"
        onClick={(e) => {
          e.stopPropagation()
          setShowRu((v) => !v)
        }}
        title="Translate"
      >
        RU
      </button>
    </div>
  )
}

function ScaleInput({ q, value, onChange }) {
  return (
    <div className="scale">
      <div className="scale-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={'scale-btn' + (value === n ? ' active' : '')}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <ul className="scale-labels">
        {[1, 2, 3, 4, 5].map((n) => (
          <li key={n} className={value === n ? 'active' : ''}>
            <strong>{n}</strong> {q.labels.en[n]}
          </li>
        ))}
      </ul>
    </div>
  )
}

function TextInput({ q, value, onChange }) {
  const long = q.type === 'long'
  return (
    <div className="text-answer">
      {q.prompt && <pre className="frame-prompt">{q.prompt.en}</pre>}
      {long ? (
        <textarea
          className="ta"
          rows={6}
          value={value || ''}
          placeholder={q.placeholder ? q.placeholder.en : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="ti"
          type="text"
          value={value || ''}
          placeholder={q.placeholder ? q.placeholder.en : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

function QuestionCard({ q, index, answers, setAnswer }) {
  return (
    <article className="q-card">
      <div className="q-index">Q{index}</div>
      <BilingualHead q={q} />
      {(q.type === 'checkbox' || q.type === 'checkbox-max' || q.type === 'radio') && (
        <ChoiceInput
          q={q}
          value={answers[q.id]}
          onChange={(v) => setAnswer(q.id, v)}
          otherValue={answers[q.id + '_other']}
          onOther={(v) => setAnswer(q.id + '_other', v)}
        />
      )}
      {q.type === 'scale' && (
        <ScaleInput q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
      )}
      {(q.type === 'short' || q.type === 'long') && (
        <TextInput q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
      )}
    </article>
  )
}

/* ---------------- screens ---------------- */

function Header({ onRestart }) {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-mark">EP</div>
        <div className="brand-text">
          <h1>English Partner Profile</h1>
          <p>Speaking &amp; Personality Map</p>
        </div>
      </div>
      {onRestart && (
        <button className="btn-ghost header-restart" onClick={onRestart}>
          Restart
        </button>
      )}
    </header>
  )
}

function IntroScreen({ onStart, name, setName, hasSaved }) {
  return (
    <section className="intro">
      <div className="intro-card">
        <span className="eyebrow">Homework · Speaking &amp; Personality Map</span>
        <h2>Let’s build your personal English speaking map.</h2>
        <p className="lead">
          This is not a test and not a diagnosis. It’s a friendly questionnaire that helps your
          teacher understand how you think, what you enjoy, and where your{' '}
          <strong>speaking bottleneck</strong> is — so your 1:1 lessons feel personal from day one.
        </p>
        <p className="lead-ru">
          Это не тест и не диагноз. Это дружелюбная анкета: она помогает преподавателю понять твой
          стиль, интересы и узкие места в говорении. Английский — основной язык, но перевод на
          русский всегда доступен по кнопке «Show Russian».
        </p>

        <ul className="intro-points">
          <li>27 questions across 9 short sections</li>
          <li>Answer in English — reveal Russian whenever you need it</li>
          <li>Your answers save automatically in this browser</li>
          <li>Get a personal Student Speaking Profile at the end</li>
        </ul>

        <label className="name-field">
          <span>Your name (optional) / Твоё имя</span>
          <input
            type="text"
            value={name}
            placeholder="e.g. Alex"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className="vocab-preview">
          <span className="vp-title">Active vocabulary you’ll practise:</span>
          <div className="vocab-tags">
            {activeVocabulary.map((v) => (
              <VocabTag key={v.en} item={v} />
            ))}
          </div>
        </div>

        <button className="btn-primary btn-lg" onClick={onStart}>
          {hasSaved ? 'Continue questionnaire' : 'Start questionnaire'}
        </button>
      </div>
    </section>
  )
}

function ReportScreen({ answers, name, onBack, onRestart }) {
  const profile = useMemo(() => buildProfile(answers), [answers])
  const [lang, setLang] = useState('en')

  const download = (content, filename, type) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportTxt = () => {
    const header = name ? `Student: ${name}\n\n` : ''
    download(header + profileToText(profile), 'student-speaking-profile.txt', 'text/plain')
  }

  const exportJson = () => {
    const payload = {
      student: name || null,
      generatedAt: new Date().toISOString(),
      answers,
      profile,
    }
    download(
      JSON.stringify(payload, null, 2),
      'student-speaking-profile.json',
      'application/json',
    )
  }

  return (
    <section className="report">
      <div className="report-top no-print">
        <button className="btn-ghost" onClick={onBack}>
          ← Back to questions
        </button>
        <div className="lang-switch">
          <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>
            English
          </button>
          <button className={lang === 'ru' ? 'active' : ''} onClick={() => setLang('ru')}>
            Русский
          </button>
        </div>
      </div>

      <div className="report-sheet" id="report-sheet">
        <div className="report-header">
          <h2>{lang === 'en' ? 'Student Speaking Profile' : 'Профиль говорения ученика'}</h2>
          {name && <p className="report-name">{name}</p>}
          <p className="report-sub">
            {lang === 'en'
              ? 'English Partner Profile — Speaking & Personality Map'
              : 'English Partner Profile — карта говорения и личности'}
          </p>
        </div>

        <div className="report-grid">
          {profile.fields.map((f) => (
            <div className="report-block" key={f.key}>
              <h3>{lang === 'en' ? f.labelEn : f.labelRu}</h3>
              <p>{lang === 'en' ? f.valueEn : f.valueRu}</p>
            </div>
          ))}

          <div className="report-block report-lessons">
            <h3>{lang === 'en' ? 'Recommended first 3 lessons' : 'Рекомендуемые первые 3 урока'}</h3>
            <ol>
              {profile.lessons.map((l, i) => (
                <li key={i}>{lang === 'en' ? l.en : l.ru}</li>
              ))}
            </ol>
          </div>

          <div className="report-block report-vocab-block">
            <h3>{lang === 'en' ? 'Active vocabulary to start with' : 'Активная лексика для старта'}</h3>
            <div className="vocab-tags">
              {profile.vocab.map((v) => (
                <span className="vocab-tag static" key={v.en}>
                  {lang === 'en' ? v.en : `${v.en} — ${v.ru}`}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="teacher-note">{lang === 'en' ? profile.teacherNoteEn : profile.teacherNoteRu}</p>
      </div>

      <div className="report-actions no-print">
        <button className="btn-primary" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
        <button className="btn-secondary" onClick={exportTxt}>
          Export TXT
        </button>
        <button className="btn-secondary" onClick={exportJson}>
          Export JSON
        </button>
        <button className="btn-ghost" onClick={onRestart}>
          Start over
        </button>
      </div>
    </section>
  )
}

/* ---------------- main app ---------------- */

export default function App() {
  const [screen, setScreen] = useState('intro') // intro | questions | report
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState(loadAnswers)
  const [meta, setMeta] = useState(loadMeta)
  const [toast, setToast] = useState('')

  const hasSaved = useMemo(() => countAnswered(answers) > 0, []) // eslint-disable-line

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers))
    } catch {
      /* storage may be unavailable */
    }
  }, [answers])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_META, JSON.stringify(meta))
    } catch {
      /* ignore */
    }
  }, [meta])

  useEffect(() => {
    if (screen === 'questions') window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [current, screen])

  const setAnswer = (id, value) => setAnswers((a) => ({ ...a, [id]: value }))

  const answered = countAnswered(answers)

  const answeredBySection = useMemo(
    () =>
      sections.map(
        (s) =>
          s.questions.filter((q) => {
            const v = answers[q.id]
            if (Array.isArray(v)) return v.length > 0
            if (typeof v === 'number') return true
            return typeof v === 'string' && v.trim()
          }).length,
      ),
    [answers],
  )

  const flash = (msg) => {
    setToast(msg)
    window.clearTimeout(flash._t)
    flash._t = window.setTimeout(() => setToast(''), 1800)
  }

  const saveNow = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers))
      localStorage.setItem(STORAGE_META, JSON.stringify(meta))
      flash('Saved to this browser ✓')
    } catch {
      flash('Could not save (storage blocked)')
    }
  }

  const restart = () => {
    if (!window.confirm('Clear all answers and start over? / Очистить все ответы?')) return
    setAnswers({})
    setMeta({ name: '' })
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_META)
    } catch {
      /* ignore */
    }
    setCurrent(0)
    setScreen('intro')
  }

  const section = sections[current]
  let baseIndex = 0
  for (let i = 0; i < current; i++) baseIndex += sections[i].questions.length

  return (
    <div className="app">
      <Header onRestart={screen !== 'intro' ? restart : null} />

      <main className="container">
        {screen === 'intro' && (
          <IntroScreen
            onStart={() => setScreen('questions')}
            name={meta.name}
            setName={(name) => setMeta((m) => ({ ...m, name }))}
            hasSaved={hasSaved}
          />
        )}

        {screen === 'questions' && (
          <>
            <ProgressBar answered={answered} total={totalQuestions} />
            <SectionNav
              current={current}
              onJump={setCurrent}
              answeredBySection={answeredBySection}
            />

            <div className="section-head">
              <span className="section-kicker">
                Section {current + 1} of {sections.length}
              </span>
              <h2 className="section-title">{section.title.en}</h2>
              <p className="section-title-ru">{section.title.ru}</p>
            </div>

            <div className="cards">
              {section.questions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  index={baseIndex + i + 1}
                  answers={answers}
                  setAnswer={setAnswer}
                />
              ))}
            </div>

            <div className="nav-actions">
              <button
                className="btn-secondary"
                disabled={current === 0}
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              >
                ← Previous
              </button>
              <button className="btn-ghost" onClick={saveNow}>
                Save
              </button>
              {current < sections.length - 1 ? (
                <button className="btn-primary" onClick={() => setCurrent((c) => c + 1)}>
                  Next →
                </button>
              ) : (
                <button className="btn-primary" onClick={() => setScreen('report')}>
                  See my profile →
                </button>
              )}
            </div>
          </>
        )}

        {screen === 'report' && (
          <ReportScreen
            answers={answers}
            name={meta.name}
            onBack={() => setScreen('questions')}
            onRestart={restart}
          />
        )}
      </main>

      <footer className="app-footer no-print">
        <p>
          A personal learning map · not a psychological test · answers stay in your browser
          (localStorage)
        </p>
      </footer>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
