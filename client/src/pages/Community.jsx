import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { MessageSquare, Users, Trash2, Calendar, Send, ChevronRight, Tag } from 'lucide-react'

const CATEGORIES = ['All', 'General', 'Exams', 'Colleges', 'College Life']

export function Community() {
  const { user } = useAuth()
  const [threads, setThreads] = useState([])
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Post Form State
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('General')
  const [posting, setPosting] = useState(false)

  // Selected/Expanded Thread & Comments State
  const [activeThreadId, setActiveThreadId] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commenting, setCommenting] = useState(false)

  const fetchThreads = async () => {
    try {
      const res = await fetch('/api/community/threads')
      if (res.ok) {
        const data = await res.json()
        setThreads(data)
      } else {
        setError('Failed to fetch discussion threads.')
      }
    } catch (err) {
      console.error(err)
      setError('Could not connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchThreads()
  }, [])

  const fetchComments = async (threadId) => {
    try {
      const res = await fetch(`/api/community/threads/${threadId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateThread = async (e) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) return

    setPosting(true)
    try {
      const token = localStorage.getItem('navguide_token')
      const res = await fetch('/api/community/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCategory
        })
      })
      if (res.ok) {
        setNewTitle('')
        setNewContent('')
        setNewCategory('General')
        fetchThreads()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create thread.')
      }
    } catch (err) {
      console.error(err)
      setError('Error creating discussion thread.')
    } finally {
      setPosting(false)
    }
  }

  const handleCreateComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !activeThreadId) return

    setCommenting(true)
    try {
      const token = localStorage.getItem('navguide_token')
      const res = await fetch(`/api/community/threads/${activeThreadId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      })
      if (res.ok) {
        setNewComment('')
        fetchComments(activeThreadId)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCommenting(false)
    }
  }

  const handleDeleteThread = async (threadId, event) => {
    event.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this discussion thread?')) return

    try {
      const token = localStorage.getItem('navguide_token')
      const res = await fetch(`/api/community/threads/${threadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        if (activeThreadId === threadId) {
          setActiveThreadId(null)
        }
        fetchThreads()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleThreadSelect = (threadId) => {
    if (activeThreadId === threadId) {
      setActiveThreadId(null)
    } else {
      setActiveThreadId(threadId)
      fetchComments(threadId)
    }
  }

  const filteredThreads = category === 'All'
    ? threads
    : threads.filter(t => t.category.toLowerCase() === category.toLowerCase())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5" style={{ borderColor: 'var(--c-border)' }}>
        <div>
          <h1 className="text-3xl font-800 tracking-tight text-gray-900 font-poppins">
            Student <span className="text-[var(--c-teal-dk)]">Forum</span>
          </h1>
          <p className="text-sm text-gray-500 font-inter mt-1">
            Connect, discuss, and share guidance with fellow students and mentors.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-700 bg-[rgba(139,223,221,0.1)] text-[#1AB8B5] border border-[rgba(139,223,221,0.25)]">
          <Users size={14} />
          <span>{threads.length} Active Topics</span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Post Form & Categories */}
        <div className="lg:col-span-1 space-y-6">
          {/* Categories card */}
          <div className="bg-white border rounded-2xl p-4 shadow-sm" style={{ borderColor: 'var(--c-border)' }}>
            <h3 className="font-800 text-sm text-gray-900 font-poppins mb-3">Categories</h3>
            <div className="flex flex-wrap lg:flex-col gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-700 transition-all border flex items-center justify-between ${
                    category === cat
                      ? 'bg-[rgba(139,223,221,0.15)] text-[#1AB8B5] border-[rgba(139,223,221,0.3)]'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-black/[0.02] border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Tag size={12} />
                    {cat}
                  </span>
                  <ChevronRight size={12} className={category === cat ? 'opacity-100' : 'opacity-30'} />
                </button>
              ))}
            </div>
          </div>

          {/* Ask a Question Form */}
          <div className="bg-white border rounded-2xl p-5 shadow-sm" style={{ borderColor: 'var(--c-border)' }}>
            <h3 className="font-800 text-sm text-gray-900 font-poppins mb-3">Ask a Question</h3>
            <form onSubmit={handleCreateThread} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-700 text-gray-500 uppercase tracking-wider mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KCET options tips?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1AB8B5] transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-700 text-gray-500 uppercase tracking-wider mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl px-2 py-2 focus:outline-none focus:ring-1 focus:ring-[#1AB8B5] transition-all bg-white"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-700 text-gray-500 uppercase tracking-wider mb-1">Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share details about your query..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1AB8B5] transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={posting}
                className="w-full bg-[#1AB8B5] hover:bg-[#159a97] text-white text-xs font-700 py-2 px-4 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <MessageSquare size={14} />
                <span>{posting ? 'Posting...' : 'Post Thread'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Threads & Comments */}
        <div className="lg:col-span-2 space-y-4">
          
          {loading ? (
            <div className="text-center py-12 text-sm text-gray-400">Loading discussions...</div>
          ) : filteredThreads.length === 0 ? (
            <div className="bg-white border border-dashed rounded-2xl p-12 text-center" style={{ borderColor: 'var(--c-border)' }}>
              <Users size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-700 text-gray-600">No discussions here yet</p>
              <p className="text-xs text-gray-400 mt-1">Be the first to post a question under "{category}"!</p>
            </div>
          ) : (
            filteredThreads.map(thread => {
              const isExpanded = activeThreadId === thread.id
              const isOwner = thread.user_id === user?.id || user?.id === 'default-student-id'

              return (
                <div
                  key={thread.id}
                  className={`bg-white border rounded-2xl transition-all overflow-hidden ${
                    isExpanded ? 'shadow-md ring-1 ring-[#1AB8B5]/20' : 'shadow-sm hover:shadow'
                  }`}
                  style={{ borderColor: 'var(--c-border)' }}
                >
                  {/* Thread Header Card */}
                  <div
                    onClick={() => handleThreadSelect(thread.id)}
                    className="p-4 sm:p-5 cursor-pointer text-left space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-700 tracking-wider bg-gray-100 text-gray-600 uppercase border border-gray-150">
                        {thread.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <Calendar size={10} />
                        <span>{new Date(thread.date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div>
                      <h2 className="font-800 text-base text-gray-900 font-poppins">{thread.title}</h2>
                      <p className={`text-xs text-gray-600 font-inter mt-1.5 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {thread.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t pt-3 mt-1" style={{ borderColor: 'var(--c-border)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center font-800 text-[10px]"
                          style={{ background: 'linear-gradient(135deg,#8BDFDD,#FFE394)', color: '#333' }}>
                          {thread.username?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <span className="text-[11px] font-700 text-gray-800">{thread.username}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {isOwner && (
                          <button
                            onClick={(e) => handleDeleteThread(thread.id, e)}
                            className="p-1 rounded text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                            title="Delete thread"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                        <span className="text-[11px] font-700 text-[#1AB8B5]">
                          {isExpanded ? 'Hide Replies' : 'View Replies'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Comments/Replies Expansion Panel */}
                  {isExpanded && (
                    <div className="bg-gray-50/50 border-t p-4 sm:p-5 space-y-4" style={{ borderColor: 'var(--c-border)' }}>
                      <h4 className="font-800 text-xs text-gray-800 uppercase tracking-wider mb-2">Replies</h4>

                      {/* Comment list */}
                      <div className="space-y-3">
                        {comments.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No replies yet. Join the conversation!</p>
                        ) : (
                          comments.map(c => (
                            <div key={c.id} className="bg-white border rounded-xl p-3 shadow-2xs space-y-1.5" style={{ borderColor: 'var(--c-border)' }}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-full flex items-center justify-center font-800 text-[9px] bg-emerald-100 text-emerald-800">
                                    {c.username?.charAt(0)?.toUpperCase() || 'S'}
                                  </div>
                                  <span className="text-[10px] font-700 text-gray-800">{c.username}</span>
                                </div>
                                <span className="text-[9px] text-gray-400">{new Date(c.date).toLocaleDateString()}</span>
                              </div>
                              <p className="text-xs text-gray-700 leading-relaxed font-inter pl-6">{c.content}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Comment form */}
                      <form onSubmit={handleCreateComment} className="flex gap-2 pt-2">
                        <input
                          type="text"
                          required
                          placeholder="Write a reply..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1AB8B5] transition-all bg-white"
                        />
                        <button
                          type="submit"
                          disabled={commenting}
                          className="bg-[#1AB8B5] hover:bg-[#159a97] text-white p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50"
                        >
                          <Send size={14} />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default Community
