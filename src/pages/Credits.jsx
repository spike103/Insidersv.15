import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar.jsx'
import Icon from '../components/Icon.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { MISSIONS, REWARDS_CATALOG, PURCHASE_PACKS, fetchTransactions, spendCredits } from '../lib/credits.js'

export default function Credits() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useApp()
  const [tab, setTab] = useState('earn') // 'earn' | 'spend' | 'shop' | 'history'
  const [transactions, setTransactions] = useState([])
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    if (tab === 'history' && user?.id) {
      fetchTransactions(user.id).then(setTransactions)
    }
  }, [tab, user?.id])

  if (!user) return null

  const credits = user.credits || 0

  const handleSpend = async (rewardId) => {
    const reward = REWARDS_CATALOG.find(r => r.id === rewardId)
    if (!reward) return
    if (credits < reward.cost) {
      setFeedback({ kind: 'error', text: `Il te manque ${reward.cost - credits} crédits` })
      setTimeout(() => setFeedback(null), 3000)
      return
    }
    if (!confirm(`Débloquer "${reward.title}" pour ${reward.cost} crédits ?`)) return

    const res = await spendCredits(user.id, rewardId)
    if (res.ok) {
      await refreshProfile?.()
      setFeedback({ kind: 'success', text: `${reward.title} débloqué !` })
    } else {
      setFeedback({ kind: 'error', text: res.error || 'Erreur' })
    }
    setTimeout(() => setFeedback(null), 3000)
  }

  return (
    <>
      <TopBar showBack />
      <div className="px-5 pt-2 pb-28">
        {/* Hero solde */}
        <div
          className="card mb-4"
          style={{
            padding: 22,
            background: 'linear-gradient(135deg, rgba(240,200,90,0.18) 0%, rgba(240,200,90,0.05) 100%)',
            border: '1px solid rgba(240,200,90,0.4)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 140, height: 140, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(240,200,90,0.25), transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div className="flex items-center gap-3 mb-2" style={{ position: 'relative' }}>
            <Icon name="crown" size={28} color="gold" />
            <div className="micro" style={{ color: 'var(--gold-400)', fontWeight: 800, letterSpacing: '0.15em' }}>
              SOLDE
            </div>
          </div>
          <div style={{
            fontSize: 56,
            fontWeight: 900,
            fontFamily: 'Archivo Black, sans-serif',
            lineHeight: 1,
            color: 'var(--gold-400)',
            position: 'relative',
            fontStyle: 'italic',
          }}>
            {credits}
          </div>
          <div className="caption mt-1" style={{ position: 'relative' }}>
            crédit{credits > 1 ? 's' : ''} disponible{credits > 1 ? 's' : ''}
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className="card p-3 mb-3" style={{
            background: feedback.kind === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            borderColor: feedback.kind === 'success' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
            color: feedback.kind === 'success' ? 'var(--win-500)' : 'var(--loss-500)',
            fontWeight: 700,
            fontSize: 13,
            textAlign: 'center',
          }}>
            {feedback.text}
          </div>
        )}

        {/* Tabs */}
        <div className="segmented mb-4">
          <button onClick={() => setTab('earn')}    className={tab === 'earn'    ? 'active' : ''}>Gagner</button>
          <button onClick={() => setTab('spend')}   className={tab === 'spend'   ? 'active' : ''}>Dépenser</button>
          <button onClick={() => setTab('shop')}    className={tab === 'shop'    ? 'active' : ''}>Acheter</button>
          <button onClick={() => setTab('history')} className={tab === 'history' ? 'active' : ''}>Histo</button>
        </div>

        {tab === 'earn' && <EarnTab user={user} />}
        {tab === 'spend' && <SpendTab credits={credits} onSpend={handleSpend} />}
        {tab === 'shop' && <ShopTab />}
        {tab === 'history' && <HistoryTab transactions={transactions} />}
      </div>
    </>
  )
}

// ============================================================
// ONGLET GAGNER — liste des missions
// ============================================================
function EarnTab({ user }) {
  return (
    <div className="space-y-2">
      <div className="caption mb-3" style={{ fontSize: 12 }}>
        Complète ces missions pour gagner des crédits gratuitement.
      </div>
      {MISSIONS.map(m => (
        <MissionRow key={m.id} mission={m} user={user} />
      ))}
    </div>
  )
}

function MissionRow({ mission, user }) {
  // Logique de progression simplifiée côté front
  // (la vraie logique de complétion sera côté serveur dans une V2)
  let completed = false
  let progress = null
  const bets = user.bets || []

  if (mission.id === 'signup') {
    completed = true // si l'user existe, le signup est complété
  } else if (mission.id === 'first_bet') {
    completed = bets.length > 0
  } else if (mission.id === 'profile_complete') {
    completed = !!user.avatarKey && bets.length > 0
  } else if (mission.id === 'win') {
    const won = bets.filter(b => b.status === 'won').length
    progress = { current: won, label: `${won} pari${won > 1 ? 's' : ''} gagné${won > 1 ? 's' : ''}` }
  } else if (mission.id === 'streak_3') {
    progress = { label: 'En cours…' }
  } else if (mission.id === 'login_7d') {
    progress = { label: 'En cours…' }
  }

  return (
    <div className="card p-3 flex items-center gap-3">
      <div style={{
        width: 40, height: 40,
        borderRadius: 12,
        background: completed ? 'rgba(34,197,94,0.15)' : 'rgba(240,200,90,0.12)',
        border: completed ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(240,200,90,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {completed ? (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--win-500)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 5 12 l 5 5 l 9 -10" />
          </svg>
        ) : (
          <Icon name="crown" size={18} color="gold" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>{mission.title}</div>
        <div className="caption" style={{ fontSize: 11, marginTop: 2 }}>{mission.description}</div>
        {progress?.label && (
          <div className="micro mt-1" style={{ color: 'var(--blue-500)', fontWeight: 700, fontSize: 10 }}>
            {progress.label}
          </div>
        )}
      </div>
      <div style={{
        padding: '4px 10px',
        borderRadius: 8,
        background: completed ? 'rgba(34,197,94,0.15)' : 'rgba(240,200,90,0.18)',
        color: completed ? 'var(--win-500)' : 'var(--gold-400)',
        fontSize: 12,
        fontWeight: 800,
        fontFamily: 'Archivo Black, sans-serif',
        whiteSpace: 'nowrap',
      }}>
        +{mission.reward}
      </div>
    </div>
  )
}

// ============================================================
// ONGLET DÉPENSER — features achetables
// ============================================================
function SpendTab({ credits, onSpend }) {
  return (
    <div className="space-y-2">
      <div className="caption mb-3" style={{ fontSize: 12 }}>
        Utilise tes crédits pour débloquer des features premium.
      </div>
      {REWARDS_CATALOG.map(r => {
        const canAfford = credits >= r.cost
        return (
          <div key={r.id} className="card p-3 flex items-center gap-3">
            <div style={{
              width: 40, height: 40,
              borderRadius: 12,
              background: 'rgba(41,98,255,0.12)',
              border: '1px solid rgba(41,98,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon name={r.icon} size={18} color="blue" />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg-1)' }}>{r.title}</div>
              <div className="caption" style={{ fontSize: 11, marginTop: 2 }}>{r.description}</div>
            </div>
            <button
              onClick={() => onSpend(r.id)}
              disabled={!canAfford}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                background: canAfford ? 'var(--blue-500)' : 'var(--ink-700)',
                color: canAfford ? 'white' : 'var(--fg-3)',
                border: 'none',
                fontSize: 12,
                fontWeight: 800,
                cursor: canAfford ? 'pointer' : 'not-allowed',
                fontFamily: 'Archivo Black, sans-serif',
                display: 'flex', alignItems: 'center', gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              <Icon name="crown" size={11} color={canAfford ? 'white' : 'muted'} />
              {r.cost}
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// ONGLET ACHETER — packs Stripe (V2)
// ============================================================
function ShopTab() {
  return (
    <div className="space-y-3">
      <div className="caption mb-3" style={{ fontSize: 12 }}>
        Achète des crédits pour débloquer plus rapidement les features premium.
      </div>
      <div className="card p-3" style={{
        background: 'rgba(240,200,90,0.08)',
        border: '1px solid rgba(240,200,90,0.3)',
      }}>
        <div className="micro mb-1" style={{ color: 'var(--gold-400)', fontWeight: 800, letterSpacing: '0.12em' }}>
          DISPONIBLE BIENTÔT
        </div>
        <div className="caption" style={{ fontSize: 12 }}>
          L'achat de crédits par carte sera disponible avec la prochaine mise à jour.
        </div>
      </div>
      <div className="space-y-2">
        {PURCHASE_PACKS.map(p => (
          <div key={p.id} className="card p-4 relative" style={{
            opacity: 0.6,
            borderColor: p.popular ? 'var(--blue-500)' : 'var(--ink-600)',
          }}>
            {p.popular && (
              <span style={{
                position: 'absolute', top: -8, right: 14,
                padding: '2px 8px', borderRadius: 6,
                background: 'var(--blue-500)', color: 'white',
                fontSize: 9, fontWeight: 900, letterSpacing: '0.1em',
              }}>POPULAIRE</span>
            )}
            <div className="flex items-baseline justify-between mb-2">
              <div className="h3" style={{ fontSize: 16 }}>{p.title}</div>
              <div style={{
                fontFamily: 'Archivo Black, sans-serif',
                fontSize: 22, fontWeight: 900,
              }}>{p.price}</div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="crown" size={14} color="gold" />
              <span style={{ fontSize: 14, fontWeight: 700 }}>
                {p.credits} crédits
                {p.bonus > 0 && <span style={{ color: 'var(--win-500)' }}> +{p.bonus} bonus</span>}
              </span>
            </div>
            <button disabled className="btn-ghost w-full" style={{
              cursor: 'not-allowed',
              opacity: 0.7,
              fontSize: 12,
            }}>
              Disponible bientôt
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// ONGLET HISTORIQUE — transactions
// ============================================================
function HistoryTab({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="card p-6 text-center">
        <div className="caption">Aucune transaction pour l'instant.</div>
      </div>
    )
  }

  const labelFor = (reason) => {
    const map = {
      signup: 'Inscription',
      first_bet: 'Premier pari',
      win: 'Pari gagné',
      streak_3: 'Série de 3 victoires',
      login_7d: 'Connexion 7 jours',
      profile_complete: 'Profil complété',
      unlock_pro_1mo: '1 mois Pro débloqué',
      unlock_sharp_1mo: '1 mois Sharp débloqué',
      lift_ocr_quota: 'Quota OCR levé',
      unlock_insight: 'Insight premium',
      custom_player: 'Joueur custom',
    }
    return map[reason] || reason
  }

  return (
    <div className="space-y-2">
      {transactions.map(t => {
        const positive = t.amount >= 0
        return (
          <div key={t.id} className="card p-3 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 13, fontWeight: 700 }}>{labelFor(t.reason)}</div>
              <div className="caption" style={{ fontSize: 11, marginTop: 2 }}>
                {new Date(t.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div style={{
              fontSize: 16,
              fontWeight: 900,
              fontFamily: 'Archivo Black, sans-serif',
              color: positive ? 'var(--win-500)' : 'var(--loss-500)',
            }}>
              {positive ? '+' : ''}{t.amount}
            </div>
          </div>
        )
      })}
    </div>
  )
}
