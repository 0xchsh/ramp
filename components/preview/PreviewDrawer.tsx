'use client'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import NumberFlow from '@number-flow/react'
import { useCardStore } from '@/store/cardStore'

const CardScene = dynamic(() => import('@/components/scene/CardScene').then(m => m.CardScene), { ssr: false })

function formatMoney(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface Txn {
  merchant: string
  domain: string
  date: string
  amount: number
}

const TXNS: Txn[] = [
  { merchant: 'Vercel',      domain: 'vercel.com',     date: '04/08/2026', amount: 20.00 },
  { merchant: 'Linear',      domain: 'linear.app',     date: '04/05/2026', amount: 96.00 },
  { merchant: 'Figma',       domain: 'figma.com',      date: '04/02/2026', amount: 45.00 },
  { merchant: 'Notion',      domain: 'notion.so',      date: '03/28/2026', amount: 16.00 },
  { merchant: 'GitHub',      domain: 'github.com',     date: '03/22/2026', amount: 210.00 },
  { merchant: 'Slack',       domain: 'slack.com',      date: '03/15/2026', amount: 87.50 },
  { merchant: 'Anthropic',   domain: 'anthropic.com',  date: '03/10/2026', amount: 240.00 },
  { merchant: 'OpenAI',      domain: 'openai.com',     date: '03/05/2026', amount: 120.00 },
  { merchant: 'Cloudflare',  domain: 'cloudflare.com', date: '02/28/2026', amount: 25.00 },
  { merchant: 'Stripe',      domain: 'stripe.com',     date: '02/21/2026', amount: 18.00 },
]

const TOTAL = TXNS.reduce((s, t) => s + t.amount, 0) // spent-to-date
const BUDGET = 2500

function CloseX() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M4 4l10 10M14 4L4 14" />
    </svg>
  )
}
function Chevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 5 6 8 9 5" />
    </svg>
  )
}
function Copy() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="8" height="8" rx="1.5" />
      <path d="M10 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v6a1 1 0 001 1h1" />
    </svg>
  )
}

export function PreviewDrawer() {
  const { previewOpen, set, cardName } = useCardStore()
  const drawerRef = useRef<HTMLDivElement>(null)
  const [topTab, setTopTab] = useState<'overview' | 'activity'>('overview')
  const [issuedOpen, setIssuedOpen] = useState(true)
  const [animated, setAnimated] = useState(false)

  // Escape key
  useEffect(() => {
    if (!previewOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') set({ previewOpen: false })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewOpen, set])

  const displayName = (cardName || 'Charles Shin').trim()
  const spent = TOTAL
  const remaining = Math.max(0, BUDGET - spent)
  const spentPct = Math.min(100, (spent / BUDGET) * 100)

  // Flip `animated` to true ~220ms after the drawer starts sliding in so
  // NumberFlow and the bar fill in sync with the drawer settling. Reset after
  // slide-out completes so re-opening re-triggers the count-up. Two rAFs
  // instead of a synchronous setState keep us out of the cascading-render
  // lint rule while still priming the value at 0 before the timer flips it.
  useEffect(() => {
    if (!previewOpen) {
      const t = setTimeout(() => setAnimated(false), 500)
      return () => clearTimeout(t)
    }
    let raf1 = 0
    let raf2 = 0
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setAnimated(false))
    })
    const t = setTimeout(() => setAnimated(true), 220)
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      clearTimeout(t)
    }
  }, [previewOpen])

  const shownSpent = animated ? spent : 0
  const shownRemaining = animated ? remaining : BUDGET
  const shownPct = animated ? spentPct : 0

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => set({ previewOpen: false })}
        style={{
          position: 'fixed', inset: 0,
          background: previewOpen ? 'rgba(10, 10, 14, 0.55)' : 'rgba(10, 10, 14, 0)',
          backdropFilter: previewOpen ? 'blur(2px)' : 'none',
          WebkitBackdropFilter: previewOpen ? 'blur(2px)' : 'none',
          pointerEvents: previewOpen ? 'auto' : 'none',
          transition: 'background 400ms cubic-bezier(0.22, 1, 0.36, 1), backdrop-filter 400ms cubic-bezier(0.22, 1, 0.36, 1)',
          zIndex: 200,
        }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(780px, 94vw)',
          background: '#ffffff',
          boxShadow: '-12px 0 48px rgba(0,0,0,0.18), -2px 0 8px rgba(0,0,0,0.06)',
          transform: previewOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 460ms cubic-bezier(0.22, 1, 0.36, 1)',
          overflowY: 'auto',
          zIndex: 201,
          fontFamily: 'Inter, -apple-system, sans-serif',
          color: 'rgba(0,0,0,0.85)',
        }}
      >
        {/* Close button */}
        <button
          onClick={() => set({ previewOpen: false })}
          aria-label="Close preview"
          style={{
            position: 'absolute', top: 20, right: 20, zIndex: 2,
            width: 32, height: 32, borderRadius: 6, border: 'none',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(0,0,0,0.55)',
            transition: 'background 160ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <CloseX />
        </button>

        {/* Header */}
        <div style={{ padding: '32px 40px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, color: 'rgba(0,0,0,0.9)' }}>
              Software Subscriptions
            </h1>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <Tab active={topTab === 'overview'} onClick={() => setTopTab('overview')}>Overview</Tab>
            <Tab active={topTab === 'activity'} onClick={() => setTopTab('activity')}>Activity</Tab>
          </div>
        </div>

        {/* Spending bar */}
        <div style={{ padding: '24px 40px', background: '#fafafa' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <NumberFlow
                value={shownSpent}
                format={{ style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                transformTiming={{ duration: 1500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
                spinTiming={{ duration: 1500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
                opacityTiming={{ duration: 400, easing: 'ease-out' }}
                style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.01em' }}
              />
              <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', marginLeft: 8 }}>spent</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <NumberFlow
                value={shownRemaining}
                format={{ style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                transformTiming={{ duration: 1500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
                spinTiming={{ duration: 1500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
                opacityTiming={{ duration: 400, easing: 'ease-out' }}
                style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.01em' }}
              />
              <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)', marginLeft: 8 }}>left</span>
            </div>
          </div>
          <div style={{ marginTop: 12, height: 10, borderRadius: 2, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{
              width: `${shownPct}%`, height: '100%',
              background: 'linear-gradient(90deg, #2563eb 0%, #1e40af 100%)',
              borderRadius: 2,
              transition: 'width 1500ms cubic-bezier(0.22, 1, 0.36, 1)',
            }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(0,0,0,0.5)', textAlign: 'right' }}>
            {formatMoney(BUDGET)} annually · Resets on 1/1/2027
          </div>
        </div>

        {/* Card + details */}
        <div style={{ padding: '28px 40px', display: 'flex', gap: 24, alignItems: 'center', overflow: 'visible' }}>
          <div
            className="preview-card"
            style={{
              position: 'relative',
              width: 300, height: 188,
              flexShrink: 0,
              overflow: 'visible',
            }}
          >
            {/* Canvas is intentionally larger than the card slot so the flip
                animation has margin for the rotating corners to swing into
                instead of clipping at the card's bounds. */}
            <div style={{
              position: 'absolute',
              top: -50, bottom: -50, left: -50, right: -50,
            }}>
              {previewOpen && <CardScene cameraZ={4.6} noShadow />}
            </div>
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
            <Field label="Name on card" value={displayName} copyable />
            <Field label="Card number" value="•••• •••• •••• 1234" copyable />
            <Field
              label="Billing address"
              multiline={[
                '1 Market Street, Suite 3600',
                'San Francisco, CA, US',
                '94105',
              ]}
              copyable
            />
          </div>
        </div>

        {/* What's issued */}
        <div style={{ padding: '8px 40px 24px' }}>
          <Disclosure
            title="What's issued?"
            open={issuedOpen}
            onToggle={() => setIssuedOpen(v => !v)}
          >
            <Row
              icon={
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 1v14M11.5 4.5H6.5a2 2 0 000 4h3a2 2 0 010 4H4" />
                </svg>
              }
              label={`${formatMoney(BUDGET)} annually`}
            />
            <Row
              icon={
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
                  <line x1="1.5" y1="6.5" x2="14.5" y2="6.5" />
                </svg>
              }
              label="Virtual card-only"
            />
            <Row
              icon={
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="7" width="10" height="7" rx="1.5" />
                  <path d="M5 7V5a3 3 0 016 0v2" />
                </svg>
              }
              label="Not shareable with other employees"
            />
          </Disclosure>
        </div>

        {/* Policies */}
        <div style={{ padding: '12px 40px 24px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: 'rgba(0,0,0,0.9)' }}>Policies</h3>
          <div style={{
            border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10,
            padding: '14px 18px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.85)', marginBottom: 6 }}>Card transactions</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'rgba(0,0,0,0.65)', listStyle: 'disc' }}>
              <li>Receipt is required above $75.00</li>
              <li>Memo is always required</li>
              <li>Auto-categorized as Software</li>
            </ul>
          </div>
        </div>

        {/* Recent activity */}
        <div style={{ padding: '8px 40px 40px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: 'rgba(0,0,0,0.9)' }}>Recent activity</h3>

          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.5fr 1fr', padding: '8px 4px', fontSize: 11, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div>Transaction</div>
              <div>Payment type</div>
              <div style={{ textAlign: 'right' }}>Amount</div>
            </div>
            {TXNS.map((t, i) => (
              <div
                key={i}
                style={{
                  display: 'grid', gridTemplateColumns: '2.2fr 1.5fr 1fr',
                  padding: '12px 4px',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                  alignItems: 'center',
                  fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}>
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${t.domain}&sz=64`}
                      alt={t.merchant}
                      width={18}
                      height={18}
                      style={{ display: 'block', objectFit: 'contain' }}
                    />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, color: 'rgba(0,0,0,0.88)' }}>{t.merchant}</div>
                    <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>{t.date} · {displayName}</div>
                  </div>
                </div>
                <div>
                  <div style={{ color: 'rgba(0,0,0,0.75)' }}>Virtual card</div>
                  <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', fontFamily: 'ui-monospace, monospace' }}>1234</div>
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'ui-monospace, monospace', fontWeight: 500 }}>
                  {formatMoney(t.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function Field({
  label, value, multiline, copyable,
}: { label: string; value?: string; multiline?: string[]; copyable?: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'start' }}>
      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', paddingTop: 2 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'start', gap: 6 }}>
        <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.88)', lineHeight: 1.45 }}>
          {multiline ? multiline.map((l, i) => <div key={i}>{l}</div>) : value}
        </div>
        {copyable && (
          <button
            style={{
              border: 'none', background: 'none', cursor: 'pointer', padding: 2,
              color: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center',
              transition: 'color 160ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.85)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.45)')}
          >
            <Copy />
          </button>
        )}
      </div>
    </div>
  )
}

function Tab({
  active, small, onClick, children,
}: { active: boolean; small?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 2px', marginBottom: -1,
        border: 'none', background: 'none', cursor: 'pointer',
        fontSize: small ? 13 : 14, fontWeight: 500,
        color: active ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.45)',
        borderBottom: `2px solid ${active ? 'rgba(0,0,0,0.9)' : 'transparent'}`,
        transition: 'color 180ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms cubic-bezier(0.22, 1, 0.36, 1)',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(0,0,0,0.72)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(0,0,0,0.45)' }}
    >
      {children}
    </button>
  )
}

function Disclosure({
  title, open, onToggle, children,
}: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div>
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
          border: 'none', background: 'none', cursor: 'pointer',
          fontSize: 14, fontWeight: 500, color: 'rgba(0,0,0,0.85)',
          fontFamily: 'inherit',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <Chevron />
        </span>
        {title}
      </button>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          opacity: open ? 1 : 0,
          transition: 'grid-template-rows 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          paddingLeft: 18,
          marginTop: open ? 6 : 0,
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 2 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(0,0,0,0.8)' }}>
      <span style={{
        width: 22, height: 22, borderRadius: 4,
        background: 'rgba(0,0,0,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(0,0,0,0.7)',
      }}>{icon}</span>
      {label}
    </div>
  )
}
