import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, GraduationCap, GitCompare, User,
  MessageSquare, LogOut, Menu, X, Sparkles, Bell, Users, Settings
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/colleges', label: 'Colleges & Exams', icon: GraduationCap },
  { to: '/decision', label: 'Decision Assistant', icon: GitCompare },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/chat', label: 'Ask Nav AI', icon: MessageSquare },
  { to: '/profile', label: 'Profile', icon: User },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [prefs, setPrefs] = useState({ exam_alerts: true, deadline_alerts: true })
  const [showNotifs, setShowNotifs] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileNotifsOpen, setMobileNotifsOpen] = useState(false)

  const fetchNotifs = async () => {
    if (!user) return
    try {
      const token = localStorage.getItem('navguide_token')
      if (!token) return
      const res = await fetch('/api/user/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setNotifs(data.notifications || [])
        setPrefs(data.preferences || { exam_alerts: true, deadline_alerts: true })
        setUnreadCount((data.notifications || []).filter(n => !n.read).length)
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
    }
  }

  useEffect(() => {
    fetchNotifs()
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [user])

  const togglePref = async (key) => {
    try {
      const updated = { ...prefs, [key]: !prefs[key] }
      setPrefs(updated)
      const token = localStorage.getItem('navguide_token')
      const res = await fetch('/api/user/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      })
      if (res.ok) {
        fetchNotifs()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('navguide_token')
      const res = await fetch('/api/user/notifications/read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        fetchNotifs()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const markItemRead = async (id) => {
    try {
      const token = localStorage.getItem('navguide_token')
      const res = await fetch('/api/user/notifications/read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        fetchNotifs()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b" style={{ borderColor: 'var(--c-border)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Left: Brand Logo & status */}
        <div className="flex items-center gap-4">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse"
              style={{ background: 'rgba(139,223,221,0.20)', border: '1px solid rgba(139,223,221,0.40)' }}>
              <Sparkles size={15} style={{ color: 'var(--c-teal-dk)' }} />
            </div>
            <span className="font-800 text-lg tracking-tight text-gray-900">
              Nav<span className="text-xl font-bold text-[var(--c-orange)]">Guide</span>
            </span>
          </NavLink>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-700 tracking-wider"
            style={{ background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.25)', color: '#047857' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            NAV AI
          </div>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-700 transition-all border whitespace-nowrap ${isActive
                  ? 'bg-[rgba(139,223,221,0.15)] text-[#1AB8B5] border-[rgba(139,223,221,0.35)]'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-black/[0.02] border-transparent'
                }`
              }>
              <Icon size={14} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right: Desktop User Profile, Notifications & Sign Out */}
        <div className="hidden lg:flex items-center gap-4">
          
          {/* Notifications Bell */}
          {user && (
            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)}
                className="p-1.5 rounded-lg hover:bg-black/[0.03] text-gray-600 border border-transparent hover:border-gray-200 cursor-pointer relative flex items-center justify-center">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4.5 h-4.5 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-150 rounded-xl shadow-xl z-50 p-4 max-h-[400px] overflow-y-auto" style={{ borderColor: 'var(--c-border)', backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.95)' }}>
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <h3 className="font-700 text-xs text-gray-800 tracking-tight uppercase">Alerts & Deadlines</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] font-700 text-[var(--c-teal-dk)] hover:underline cursor-pointer">
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 mb-3">
                    {notifs.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-2">No active notifications</p>
                    ) : (
                      notifs.map(n => (
                        <div key={n.id} onClick={() => !n.read && markItemRead(n.id)}
                          className={`p-2 rounded-lg text-left transition-all border ${n.read ? 'bg-transparent border-transparent' : 'bg-[rgba(139,223,221,0.05)] border-[rgba(139,223,221,0.15)] cursor-pointer'}`}>
                          <div className="flex items-start gap-1.5">
                            {!n.read && <span className="w-1.5 h-1.5 mt-1 rounded-full bg-[#1AB8B5] shrink-0" />}
                            <div>
                              <p className="text-xs font-700 text-gray-900">{n.title}</p>
                              <p className="text-[11px] text-gray-600 mt-0.5">{n.description}</p>
                              <p className="text-[9px] text-gray-400 mt-1">{new Date(n.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t pt-2 mt-2">
                    <p className="text-[10px] font-700 text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Settings size={10} /> Customize Alerts
                    </p>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1 text-[11px] font-600 text-gray-700 cursor-pointer select-none">
                        <input type="checkbox" checked={prefs.exam_alerts} onChange={() => togglePref('exam_alerts')} className="rounded border-gray-300 text-[#1AB8B5] focus:ring-[#1AB8B5] w-3 h-3" />
                        Exams
                      </label>
                      <label className="flex items-center gap-1 text-[11px] font-600 text-gray-700 cursor-pointer select-none">
                        <input type="checkbox" checked={prefs.deadline_alerts} onChange={() => togglePref('deadline_alerts')} className="rounded border-gray-300 text-[#1AB8B5] focus:ring-[#1AB8B5] w-3 h-3" />
                        Deadlines
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-800 text-xs shrink-0"
              style={{ background: 'linear-gradient(135deg,#8BDFDD,#FFE394)', color: '#333' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="text-left">
              <p className="text-[11px] font-700 text-gray-800 truncate max-w-[100px]">{user?.name || 'Student'}</p>
            </div>
          </div>

          <button onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-700 text-orange-500 hover:bg-orange-50 hover:text-orange-600 transition-all border border-transparent hover:border-orange-200 cursor-pointer">
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Mobile menu toggle & quick alert bell */}
        <div className="lg:hidden flex items-center gap-2">
          {user && (
            <button onClick={() => { setMobileNotifsOpen(!mobileNotifsOpen); setMobileOpen(false); }}
              className="p-2 rounded-lg hover:bg-black/[0.03] text-gray-600 border border-transparent hover:border-gray-200 cursor-pointer relative">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          <button
            className="p-2 rounded-lg hover:bg-black/[0.03] text-gray-600 border border-transparent hover:border-gray-200 cursor-pointer"
            onClick={() => { setMobileOpen(!mobileOpen); setMobileNotifsOpen(false); }}
            aria-label="Toggle navigation">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t bg-white px-4 py-4 space-y-3" style={{ borderColor: 'var(--c-border)' }}>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-600 transition-all ${isActive
                    ? 'bg-[rgba(139,223,221,0.15)] text-[#1AB8B5] border-[rgba(139,223,221,0.35)]'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-black/[0.02] border-transparent'
                  }`
                }>
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t pt-3 flex items-center justify-between" style={{ borderColor: 'var(--c-border)' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-800 text-xs shrink-0"
                style={{ background: 'linear-gradient(135deg,#8BDFDD,#FFE394)', color: '#333' }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div className="text-left">
                <p className="text-xs font-700 text-gray-800">{user?.name || 'Student'}</p>
                <p className="text-[10px] text-gray-400">{user?.email}</p>
              </div>
            </div>

            <button onClick={() => { setMobileOpen(false); handleLogout(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-700 text-orange-500 hover:bg-orange-50 hover:text-orange-600 transition-all border border-transparent hover:border-orange-200 cursor-pointer">
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Notifications Panel */}
      {mobileNotifsOpen && (
        <div className="lg:hidden border-t bg-white px-4 py-4 space-y-4" style={{ borderColor: 'var(--c-border)' }}>
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-700 text-sm text-gray-800 uppercase">Alerts & Deadlines</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-700 text-[var(--c-teal-dk)] hover:underline cursor-pointer">
                Mark all as read
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No active notifications</p>
            ) : (
              notifs.map(n => (
                <div key={n.id} onClick={() => { !n.read && markItemRead(n.id); setMobileNotifsOpen(false); }}
                  className={`p-2.5 rounded-xl text-left transition-all border ${n.read ? 'bg-transparent border-transparent' : 'bg-[rgba(139,223,221,0.05)] border-[rgba(139,223,221,0.15)]'}`}>
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#1AB8B5] shrink-0" />}
                    <div>
                      <p className="text-xs font-700 text-gray-900">{n.title}</p>
                      <p className="text-[11px] text-gray-600 mt-0.5">{n.description}</p>
                      <p className="text-[9px] text-gray-400 mt-1">{new Date(n.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-2">
            <p className="text-[10px] font-700 text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Settings size={10} /> Customize Alerts
            </p>
            <div className="flex gap-6">
              <label className="flex items-center gap-1.5 text-xs font-600 text-gray-700 cursor-pointer select-none">
                <input type="checkbox" checked={prefs.exam_alerts} onChange={() => togglePref('exam_alerts')} className="rounded border-gray-300 text-[#1AB8B5] focus:ring-[#1AB8B5] w-4 h-4" />
                Exams
              </label>
              <label className="flex items-center gap-1.5 text-xs font-600 text-gray-700 cursor-pointer select-none">
                <input type="checkbox" checked={prefs.deadline_alerts} onChange={() => togglePref('deadline_alerts')} className="rounded border-gray-300 text-[#1AB8B5] focus:ring-[#1AB8B5] w-4 h-4" />
                Deadlines
              </label>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Sidebar
