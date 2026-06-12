import React, { useState, useEffect, useMemo } from 'react'
import { 
  Sparkles, GraduationCap, Target, TrendingUp, 
  CheckSquare, Plus, Trash2, Circle, CheckCircle2,
  Zap, Star, BookOpen, Filter, Bookmark, Bell
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useApp } from '../hooks/useApp'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/UI/Card'
import Button from '../components/UI/Button'
import { COLLEGES } from '../utils/constants'
import { scoreAndRankColleges } from '../utils/algorithms'
import { computeNextBestAction } from '../utils/scoring'

const PRIORITY_STYLES = {
  High: 'text-coral bg-coral/10 border-coral/25',
  Medium: 'text-sand bg-sand/10 border-sand/25',
  Low: 'text-mint bg-mint/10 border-mint/25'
}

export function Dashboard() {
  const { user } = useAuth()
  const { tasks, goals, addTask, toggleTaskStatus, deleteTask } = useApp()

  const [taskFilter, setTaskFilter] = useState('All') // All | Pending | Completed
  const [priorityFilter, setPriorityFilter] = useState('All') // All | High | Medium | Low
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('Medium')
  const [newTaskGoalLink, setNewTaskGoalLink] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  const [budgetLimit, setBudgetLimit] = useState(user?.preferences?.budget || 200000)

  // Saved items & alerts states
  const [bookmarks, setBookmarks] = useState([])
  const [notifications, setNotifications] = useState([])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('navguide_token')
      if (!token) return
      
      // Fetch Bookmarks
      const bookRes = await fetch('/api/user/bookmarks', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (bookRes.ok) {
        const data = await bookRes.json()
        setBookmarks(data)
      }

      // Fetch Notifications
      const notifRes = await fetch('/api/user/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (notifRes.ok) {
        const data = await notifRes.json()
        setNotifications(data.notifications || [])
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    }
  }

  const toggleBookmark = async (collegeId) => {
    try {
      const token = localStorage.getItem('navguide_token')
      const res = await fetch('/api/user/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ collegeId })
      })
      if (res.ok) {
        const data = await res.json()
        setBookmarks(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Filter out bookmarked colleges details
  const bookmarkedColleges = useMemo(() => {
    const ids = bookmarks.map(b => b.college_id)
    return COLLEGES.filter(c => ids.includes(c.id))
  }, [bookmarks])

  // Ranked colleges
  const topColleges = useMemo(() => {
    const updated = { ...user, preferences: { ...user?.preferences, budget: budgetLimit } }
    return scoreAndRankColleges(COLLEGES, updated).slice(0, 3)
  }, [user, budgetLimit])

  // Next Best Action
  const nextAction = useMemo(() => computeNextBestAction(tasks, goals, user), [tasks, goals, user])

  // Filtered & sorted tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks]
    if (taskFilter !== 'All') result = result.filter(t => t.status === taskFilter)
    if (priorityFilter !== 'All') result = result.filter(t => t.priority === priorityFilter)
    const priorityOrder = { High: 0, Medium: 1, Low: 2 }
    const statusOrder = { Pending: 0, Completed: 1 }
    return result.sort((a, b) =>
      statusOrder[a.status] - statusOrder[b.status] ||
      priorityOrder[a.priority] - priorityOrder[b.priority]
    )
  }, [tasks, taskFilter, priorityFilter])

  const completedCount = tasks.filter(t => t.status === 'Completed').length
  const totalCount = tasks.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return
    addTask(newTaskTitle.trim(), newTaskPriority, newTaskGoalLink || null)
    setNewTaskTitle('')
    setNewTaskPriority('Medium')
    setNewTaskGoalLink('')
    setShowAddTask(false)
  }

  return (
    <div className="space-y-8 text-left">
      {/* ── Welcome Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-cream font-poppins">
            Good day, <span className="text-transparent bg-clip-text bg-gradient-to-r from-mint to-sand">{user?.name?.split(' ')[0] || 'Student'}</span> 👋
          </h1>
          <p className="text-sm text-cream/50 mt-1 font-inter">
            {user?.academic?.stream} · {user?.academic?.level} · {user?.academic?.marks}%
          </p>
        </div>
        <div className="hidden md:flex items-center space-x-2 text-xs text-mint font-semibold bg-mint/5 border border-mint/15 px-3 py-2 rounded-xl">
          <Sparkles size={13} className="animate-pulse" />
          <span>AI Mentor Active</span>
        </div>
      </div>

      {/* ── Next Best Action ── */}
      {nextAction && (
        <div className="relative p-5 rounded-2xl border border-sand/20 bg-gradient-to-r from-sand/5 via-zinc-950/20 to-transparent overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sand via-coral to-transparent"></div>
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 rounded-xl bg-sand/10 border border-sand/20 flex items-center justify-center text-sand shrink-0">
              <Zap size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[10px] text-sand font-black uppercase tracking-widest font-poppins">⚡ Next Best Action</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[nextAction.task.priority]}`}>
                  {nextAction.task.priority} Priority
                </span>
              </div>
              <p className="text-base font-bold text-cream font-poppins">{nextAction.task.title}</p>
              {nextAction.linkedGoal && (
                <p className="text-xs text-cream/50 mt-0.5 flex items-center space-x-1 font-inter">
                  <Target size={11} />
                  <span>Goal: {nextAction.linkedGoal}</span>
                </p>
              )}
              <p className="text-xs text-cream/40 mt-2 leading-relaxed font-inter">{nextAction.advice}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-cream/40 font-poppins">Progress</p>
              <p className="text-lg font-black text-mint font-poppins">{progressPct}%</p>
              <p className="text-[9px] text-cream/30 font-inter">{completedCount}/{totalCount} tasks</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* ── LEFT: Task Board ── */}
        <div className="xl:col-span-7 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-cream flex items-center space-x-2 font-poppins">
              <CheckSquare size={18} className="text-mint" />
              <span>Task Board</span>
              <span className="text-xs text-cream/40 font-normal">({filteredTasks.length} shown)</span>
            </h2>
            <Button variant="outline" onClick={() => setShowAddTask(!showAddTask)}
              className="py-1.5 px-3 text-xs space-x-1.5 font-poppins">
              <Plus size={13} />
              <span>Add Task</span>
            </Button>
          </div>

          {/* Add Task Form */}
          {showAddTask && (
            <div className="p-4 glass-card rounded-xl border-mint/20 space-y-3">
              <input
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                placeholder="Task description..."
                className="w-full bg-black/30 border border-cream/10 rounded-lg px-3 py-2 text-sm text-cream placeholder-cream/30 outline-none focus:border-mint transition-colors font-inter"
              />
              <div className="flex flex-wrap gap-2">
                {['High', 'Medium', 'Low'].map(p => (
                  <button key={p} onClick={() => setNewTaskPriority(p)}
                    className={`text-xs px-3 py-1 rounded-lg border font-semibold transition-all ${
                      newTaskPriority === p ? PRIORITY_STYLES[p] : 'border-cream/10 text-cream/40 hover:text-cream'
                    }`}>
                    {p}
                  </button>
                ))}
                <select
                  value={newTaskGoalLink}
                  onChange={e => setNewTaskGoalLink(e.target.value)}
                  className="text-xs px-3 py-1 rounded-lg border border-cream/10 bg-black/30 text-cream/50 outline-none flex-1 min-w-[130px] font-inter"
                >
                  <option value="">Link to goal...</option>
                  {goals.map(g => <option key={g.id} value={g.id}>{g.title.substring(0, 30)}...</option>)}
                </select>
              </div>
              <div className="flex space-x-2">
                <Button variant="primary" onClick={handleAddTask} className="py-1.5 px-4 text-xs flex-1 font-poppins">Add Task</Button>
                <Button variant="ghost" onClick={() => setShowAddTask(false)} className="py-1.5 px-3 text-xs font-poppins">Cancel</Button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-2 text-xs font-poppins">
            {['All', 'Pending', 'Completed'].map(f => (
              <button key={f} onClick={() => setTaskFilter(f)}
                className={`px-3 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                  taskFilter === f ? 'border-mint/30 text-mint bg-mint/10' : 'border-cream/10 text-cream/40 hover:text-cream'
                }`}>{f}</button>
            ))}
            <span className="text-cream/20 mx-1">|</span>
            {['All', 'High', 'Medium', 'Low'].map(f => (
              <button key={f} onClick={() => setPriorityFilter(f)}
                className={`px-3 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                  priorityFilter === f
                    ? (f === 'All' ? 'border-mint/30 text-mint bg-mint/10' : PRIORITY_STYLES[f])
                    : 'border-cream/10 text-cream/40 hover:text-cream'
                }`}>{f}</button>
            ))}
          </div>

          {/* Task List */}
          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-10 text-cream/30 text-sm font-inter">
                {taskFilter === 'Completed' ? '🎉 No completed tasks yet — keep going!' : 'No tasks found. Add your first one!'}
              </div>
            ) : filteredTasks.map(task => {
              const linkedGoal = goals.find(g => g.id === task.goalLink)
              return (
                <div key={task.id} className={`group flex items-start space-x-3 p-3.5 rounded-xl border transition-all duration-200 ${
                  task.status === 'Completed'
                    ? 'bg-white/2 border-white/5 opacity-60'
                    : 'bg-white/5 border-white/5 hover:border-mint/20 hover:bg-white/8'
                }`}>
                  <button onClick={() => toggleTaskStatus(task.id)} className="mt-0.5 shrink-0 text-cream/30 hover:text-mint transition-colors">
                    {task.status === 'Completed'
                      ? <CheckCircle2 size={18} className="text-emerald-400" />
                      : <Circle size={18} />
                    }
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold font-poppins ${task.status === 'Completed' ? 'line-through text-cream/40' : 'text-cream'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[task.priority]}`}>
                        {task.priority}
                      </span>
                      {linkedGoal && (
                        <span className="text-[9px] text-cream/30 flex items-center space-x-1 font-inter">
                          <Target size={9} />
                          <span className="truncate max-w-[120px]">{linkedGoal.title}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-cream/20 hover:text-coral transition-all shrink-0 cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT: Goals, Saved Items & Alerts ── */}
        <div className="xl:col-span-5 space-y-6">

          {/* Alerts & Deadlines */}
          <Card className="glass-card max-w-full">
            <CardHeader className="mb-3">
              <CardTitle className="text-base flex items-center space-x-2 font-poppins">
                <Bell size={17} className="text-mint" />
                <span>Alerts & Deadlines</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {notifications.filter(n => !n.read).length === 0 ? (
                <p className="text-xs text-cream/40 text-center py-4 font-inter">No active or unread alerts. You are all caught up!</p>
              ) : (
                notifications.filter(n => !n.read).map(notif => (
                  <div key={notif.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-mint/10 text-mint border border-mint/20 font-poppins">
                        {notif.type}
                      </span>
                      <span className="text-[9px] text-cream/30 font-inter">{new Date(notif.date).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-xs font-bold text-cream font-poppins">{notif.title}</h4>
                    <p className="text-[10px] text-cream/50 leading-relaxed font-inter">{notif.description}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Saved Colleges */}
          <Card className="glass-card max-w-full">
            <CardHeader className="mb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center space-x-2 font-poppins">
                  <Bookmark size={17} className="text-sand fill-sand" />
                  <span>Saved Colleges</span>
                </CardTitle>
                <a href="/colleges" className="text-[10px] text-mint hover:text-sand transition-colors font-semibold font-poppins">Browse →</a>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {bookmarkedColleges.length === 0 ? (
                <p className="text-xs text-cream/40 text-center py-4 font-inter">No colleges saved yet. Click the bookmark icon in Colleges & Exams to save.</p>
              ) : bookmarkedColleges.map(c => (
                <div key={c.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-mint/20 transition-all text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p
                        onClick={() => {
                          const url = c.official_website_url || `https://www.google.com/search?q=${encodeURIComponent(c.college_name)}+official+website`;
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="text-xs font-bold text-cream truncate font-poppins cursor-pointer hover:text-mint hover:underline"
                        title={c.official_website_url ? "Visit Official Website" : "Search Official Website"}
                      >
                        {c.college_name}
                      </p>
                      <button
                        onClick={() => {
                          const url = c.official_website_url || `https://www.google.com/search?q=${encodeURIComponent(c.college_name)}+official+website`;
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="text-cream/40 hover:text-mint transition-all p-0.5 cursor-pointer flex items-center justify-center rounded-lg"
                        title={c.official_website_url ? "Visit Official Website" : "Search Official Website"}
                      >
                        <span className="text-[10px]">🔗</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-cream/40 truncate font-inter">{c.location} · {c.top_course}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await toggleBookmark(c.id)
                      fetchDashboardData()
                    }}
                    className="text-cream/30 hover:text-coral transition-colors p-1 cursor-pointer"
                    title="Remove Bookmark"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Goals Tracker */}
          <Card className="glass-card max-w-full">
            <CardHeader className="mb-3">
              <CardTitle className="text-base flex items-center space-x-2 font-poppins">
                <Target size={17} className="text-coral" />
                <span>Active Goals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {goals.map(goal => {
                const linked = tasks.filter(t => t.goalLink === goal.id)
                const done = linked.filter(t => t.status === 'Completed').length
                const pct = linked.length > 0 ? Math.round((done / linked.length) * 100) : 0
                return (
                  <div key={goal.id} className="p-3 bg-white/5 rounded-xl border border-white/5 text-left">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-cream font-poppins">{goal.title}</span>
                      <span className="text-[10px] text-mint font-bold font-poppins">{pct}%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-mint to-sand h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] text-cream/30 mt-1 block font-inter">{goal.type} · {done}/{linked.length} tasks done</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Top 3 Matched Colleges */}
          <Card className="glass-card max-w-full">
            <CardHeader className="mb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center space-x-2 font-poppins">
                  <GraduationCap size={17} className="text-sand" />
                  <span>Top College Matches</span>
                </CardTitle>
                <a href="/colleges" className="text-[10px] text-mint hover:text-sand transition-colors font-semibold font-poppins">View All →</a>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-[10px] text-cream/40 font-poppins">Budget/yr:</span>
                <input type="range" min="10000" max="300000" step="5000" value={budgetLimit}
                  onChange={e => setBudgetLimit(parseInt(e.target.value))}
                  className="flex-1 cursor-pointer accent-mint" />
                <span className="text-[10px] text-sand font-bold w-10 text-right font-poppins">₹{(budgetLimit/1000).toFixed(0)}k</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {topColleges.length === 0 ? (
                <p className="text-xs text-cream/40 text-center py-4 font-inter">No matches in current budget. Try increasing the slider.</p>
              ) : topColleges.map((c, idx) => (
                <div key={c.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-mint/20 transition-all text-left">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 font-poppins ${
                    idx === 0 ? 'bg-sand/15 text-sand' : 'bg-white/5 text-cream/40'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p
                        onClick={() => {
                          const url = c.official_website_url || `https://www.google.com/search?q=${encodeURIComponent(c.college_name)}+official+website`;
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="text-xs font-bold text-cream truncate font-poppins cursor-pointer hover:text-mint hover:underline"
                        title={c.official_website_url ? "Visit Official Website" : "Search Official Website"}
                      >
                        {c.college_name}
                      </p>
                      <button
                        onClick={() => {
                          const url = c.official_website_url || `https://www.google.com/search?q=${encodeURIComponent(c.college_name)}+official+website`;
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="text-cream/40 hover:text-mint transition-all p-0.5 cursor-pointer flex items-center justify-center rounded-lg"
                        title={c.official_website_url ? "Visit Official Website" : "Search Official Website"}
                      >
                        <span className="text-[10px]">🔗</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-cream/40 truncate font-inter">{c.top_course} · ₹{(c.annual_fee/1000).toFixed(0)}k/yr</p>
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <Star size={11} className="text-sand fill-sand" />
                    <span className="text-[10px] text-sand font-bold font-poppins">{c.rating}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}

export default Dashboard
