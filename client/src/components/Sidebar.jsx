import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, GraduationCap, GitCompare, User,
  MessageSquare, LogOut, Menu, X, Sparkles
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Dashboard',         icon: LayoutDashboard },
  { to: '/colleges',   label: 'Colleges & Exams',  icon: GraduationCap  },
  { to: '/decision',   label: 'Decision Assistant', icon: GitCompare     },
  { to: '/chat',       label: 'Ask Nav AI',         icon: MessageSquare  },
  { to: '/profile',    label: 'Profile',            icon: User           },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

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
                `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-700 transition-all border whitespace-nowrap ${
                  isActive
                    ? 'bg-[rgba(139,223,221,0.15)] text-[#1AB8B5] border-[rgba(139,223,221,0.35)]'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-black/[0.02] border-transparent'
                }`
              }>
              <Icon size={14} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right: Desktop User Profile & Sign Out */}
        <div className="hidden lg:flex items-center gap-4">
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

        {/* Mobile Hamburger button */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-black/[0.03] text-gray-600 border border-transparent hover:border-gray-200 cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation">
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Collapsible Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t bg-white px-4 py-4 space-y-3" style={{ borderColor: 'var(--c-border)' }}>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-600 transition-all ${
                    isActive
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
    </header>
  )
}

export default Sidebar
