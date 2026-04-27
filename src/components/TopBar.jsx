import React from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import Avatar from './Avatar.jsx'
import { useApp } from '../contexts/AppContext.jsx'

export default function TopBar({ title, showBack = false }) {
  const navigate = useNavigate()
  const { coins, notifications, user } = useApp()
  const hasNotif = notifications && notifications.length > 0

  return (
    <header className="sticky top-0 z-40 bg-ink-900/95 backdrop-blur-xl safe-top">
      <div className="flex items-center justify-between px-5 h-16">
        <div className="flex items-center gap-2" style={{ minWidth: 60 }}>
          {showBack ? (
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--ink-800)' }}>
              <Icon name="chevron_left" size={18} />
            </button>
          ) : (
            <button
              onClick={() => navigate('/credits')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
              className="flex items-center gap-1.5"
              aria-label="Mes crédits"
            >
              <Icon name="crown" size={22} color="gold" />
              <span style={{ fontWeight: 800, fontSize: 17 }}>{coins || 0}</span>
            </button>
          )}
        </div>

        <button
          className="community-pill"
          style={{
            fontSize: 15,
            fontWeight: 900,
            letterSpacing: '0.12em',
            padding: '10px 22px',
            fontFamily: 'Archivo Black, sans-serif',
            fontStyle: 'italic',
          }}
          onClick={() => navigate('/settings')}
        >
          INSIDERS
        </button>

        <div className="flex items-center gap-3" style={{ minWidth: 60, justifyContent: 'flex-end' }}>
          <button onClick={() => navigate('/notifications')} className="w-9 h-9 flex items-center justify-center relative" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <Icon name={hasNotif ? 'bell-notification' : 'bell'} size={22} />
          </button>
          <button
            onClick={() => navigate('/settings')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
            aria-label="Profil"
          >
            <Avatar
              avatarKey={user?.avatarKey}
              initials={(user?.firstName || user?.username || '?').slice(0,1).toUpperCase() + (user?.lastName || '').slice(0,1).toUpperCase()}
              color="#2962ff"
              size={32}
              fontSize={12}
            />
          </button>
        </div>
      </div>
      {title && (
        <div className="px-5 pb-3">
          <h1 className="h1">{title}</h1>
        </div>
      )}
    </header>
  )
}
