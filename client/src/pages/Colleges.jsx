import React, { useState, useMemo, useEffect } from 'react'
import { GraduationCap, MapPin, Shield, Star, TrendingUp, BookOpen, Filter, ChevronDown, Bookmark, MessageSquare } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { COLLEGES } from '../utils/constants'
import { scoreAndRankColleges } from '../utils/algorithms'
import { getRecommendedExams, getCollegeEligibility } from '../services/recommendationService'

export function Colleges() {
  const { user } = useAuth()

  const [budgetLimit, setBudgetLimit] = useState(user?.preferences?.budget || 200000)
  const [typeFilter, setTypeFilter] = useState('All')
  const [interestFilter, setInterestFilter] = useState('All')
  const [showExams, setShowExams] = useState(true)

  // Additional features states
  const [bookmarks, setBookmarks] = useState([])
  const [comparedIds, setComparedIds] = useState([])
  const [reviewsByCollege, setReviewsByCollege] = useState({})
  const [expandedReviewsCollegeId, setExpandedReviewsCollegeId] = useState(null)
  
  // Review form states
  const [newReviewRating, setNewReviewRating] = useState(5)
  const [newReviewComment, setNewReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  // Predictor states
  const [showPredictor, setShowPredictor] = useState(false)
  const [predictorMarks, setPredictorMarks] = useState(user?.academic?.marks || '')
  const [predictorStream, setPredictorStream] = useState('cs')
  const [predictionResults, setPredictionResults] = useState(null)

  // Course interest filter map
  const INTEREST_FILTERS = [
    { id: 'All', label: 'All Courses' },
    { id: 'cs', label: 'Computer Science' },
    { id: 'ai', label: 'AI / AIML' },
    { id: 'is', label: 'Information Science' },
    { id: 'other', label: 'Others' }
  ]

  const getCourseCategory = (course) => {
    const c = course.toLowerCase()
    if (c.includes('ai') || c.includes('artificial') || c.includes('robotics') || c.includes('aiml') || c.includes('ml')) return 'ai'
    if (c.includes('information')) return 'is'
    if (c.includes('computer') || c.includes('cse')) return 'cs'
    return 'other'
  }

  // Load Bookmarks on mount
  const fetchBookmarks = async () => {
    try {
      const token = localStorage.getItem('navguide_token')
      if (!token) return
      const res = await fetch('/api/user/bookmarks', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setBookmarks(data)
      }
    } catch (err) {
      console.error('Error fetching bookmarks:', err)
    }
  }

  useEffect(() => {
    fetchBookmarks()
  }, [])

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
      console.error('Error toggling bookmark:', err)
    }
  }

  const fetchReviews = async (collegeId) => {
    try {
      const res = await fetch(`/api/colleges/${collegeId}/reviews`)
      if (res.ok) {
        const data = await res.json()
        setReviewsByCollege(prev => ({ ...prev, [collegeId]: data }))
      }
    } catch (err) {
      console.error('Error fetching reviews:', err)
    }
  }

  const handleToggleReviews = (collegeId) => {
    if (expandedReviewsCollegeId === collegeId) {
      setExpandedReviewsCollegeId(null)
    } else {
      setExpandedReviewsCollegeId(collegeId)
      fetchReviews(collegeId)
    }
  }

  const handlePostReview = async (e, collegeId) => {
    e.preventDefault()
    if (!newReviewComment.trim()) return

    setSubmittingReview(true)
    try {
      const token = localStorage.getItem('navguide_token')
      const res = await fetch(`/api/colleges/${collegeId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: newReviewRating,
          comment: newReviewComment
        })
      })
      if (res.ok) {
        setNewReviewComment('')
        setNewReviewRating(5)
        fetchReviews(collegeId)
      }
    } catch (err) {
      console.error('Error posting review:', err)
    } finally {
      setSubmittingReview(false)
    }
  }

  const handlePredict = () => {
    if (!predictorMarks) return
    const marksVal = parseFloat(predictorMarks)
    const results = COLLEGES.map(college => {
      const cutoffByRating = {
        4.6: 90,
        4.3: 85,
        4.1: 78,
        4.0: 72,
        3.9: 65,
        3.8: 58,
        3.7: 50,
        3.6: 45,
        3.5: 40
      }

      let estimatedCutoff = 50
      const ratingKeys = Object.keys(cutoffByRating).map(Number).sort((a, b) => b - a)
      for (const r of ratingKeys) {
        if (college.rating >= r) {
          estimatedCutoff = cutoffByRating[r]
          break
        }
      }
      const gap = marksVal - estimatedCutoff
      let probability = 0
      if (gap >= 15) {
        probability = Math.min(100, Math.round(90 + (gap - 15) * 0.5))
      } else if (gap >= 0) {
        probability = Math.round(75 + (gap * 1.0))
      } else if (gap >= -15) {
        probability = Math.max(10, Math.round(75 + (gap * 4.3)))
      } else {
        probability = Math.max(5, Math.round(10 + (gap * 0.5)))
      }
      
      const isStreamMatch = getCourseCategory(college.top_course) === predictorStream
      if (isStreamMatch) {
        probability = Math.min(100, probability + 5)
      }

      return {
        ...college,
        probability
      }
    })
    .sort((a, b) => b.probability - a.probability)

    setPredictionResults(results)
  }

  // Ranked & filtered colleges
  const rankedColleges = useMemo(() => {
    const updatedProfile = { ...user, preferences: { ...user?.preferences, budget: budgetLimit } }
    let results = scoreAndRankColleges(COLLEGES, updatedProfile)
    if (typeFilter !== 'All') results = results.filter(c => c.college_type === typeFilter)
    if (interestFilter !== 'All') results = results.filter(c => getCourseCategory(c.top_course) === interestFilter)
    return results
  }, [user, budgetLimit, typeFilter, interestFilter])

  // Exam recommendations
  const exams = useMemo(() => getRecommendedExams(user), [user])

  const formatCurrency = (val) => `₹${(val / 100000).toFixed(2)}L`

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-cream flex items-center space-x-3 font-poppins">
          <GraduationCap size={28} className="text-sand animate-pulse" />
          <span>Colleges & <span className="text-transparent bg-clip-text bg-gradient-to-r from-mint to-sand">Exams</span></span>
        </h1>
        <p className="text-sm text-cream/50 mt-1 font-inter">
          Personalized recommendations for {user?.academic?.stream} students with {user?.academic?.marks}% marks.
        </p>
      </div>

      {/* Exam Recommendations */}
      <div className="rounded-2xl glass-card border-white/5 overflow-hidden">
        <button
          onClick={() => setShowExams(!showExams)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <BookOpen size={20} className="text-mint" />
            <div>
              <h2 className="text-base font-bold text-cream font-poppins">Recommended Entrance Exams</h2>
              <p className="text-xs text-cream/40">{exams.length} exams matched your academic profile</p>
            </div>
          </div>
          <ChevronDown size={18} className={`text-cream/40 transition-transform ${showExams ? 'rotate-180' : ''}`} />
        </button>

        {showExams && (
          <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
            {exams.length === 0 ? (
              <p className="text-sm text-cream/40 col-span-2 text-center py-6 font-inter">
                No eligible exams found based on your current marks. Improve your score to unlock more options.
              </p>
            ) : exams.map(exam => (
              <div key={exam.id}
                className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-mint/20 transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{exam.icon}</span>
                    <div>
                      <h3 className="text-sm font-bold text-cream group-hover:text-mint transition-colors font-poppins">{exam.name}</h3>
                      <p className="text-[10px] text-cream/40">{exam.fullName}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    exam.readiness === 'Well Prepared' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25' :
                    exam.readiness === 'Ready' ? 'text-mint bg-mint/10 border-mint/25' :
                    exam.readiness === 'Borderline Eligible' ? 'text-sand bg-sand/10 border-sand/25' :
                    'text-coral bg-coral/10 border-coral/25'
                  }`}>{exam.readiness}</span>
                </div>
                <p className="text-xs text-cream/50 leading-relaxed mb-2 font-inter">{exam.description}</p>
                <p className="text-[10px] text-cream/30"><span className="text-cream/50 font-semibold">Covers:</span> {exam.covers}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${
                    exam.difficulty === 'Very High' ? 'text-coral bg-coral/5 border-coral/20' :
                    exam.difficulty === 'High' ? 'text-orange-400 bg-orange-400/5 border-orange-400/20' :
                    'text-mint bg-mint/5 border-mint/20'
                  }`}>{exam.difficulty} Difficulty</span>
                  <div className="w-20 bg-white/5 h-1 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-mint to-sand h-full rounded-full"
                      style={{ width: `${exam.matchScore}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cut-off Predictor Section */}
      <div className="rounded-2xl glass-card border-white/5 overflow-hidden">
        <button
          onClick={() => setShowPredictor(!showPredictor)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <TrendingUp size={20} className="text-sand" />
            <div>
              <h2 className="text-base font-bold text-cream font-poppins">Admission Cut-off Predictor</h2>
              <p className="text-xs text-cream/40">Analyze eligibility and predict admission probability based on marks</p>
            </div>
          </div>
          <ChevronDown size={18} className={`text-cream/40 transition-transform ${showPredictor ? 'rotate-180' : ''}`} />
        </button>

        {showPredictor && (
          <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-cream/40 mb-1 font-poppins">Enter Marks (%)</label>
                <input
                  type="number"
                  placeholder="e.g. 85"
                  value={predictorMarks}
                  onChange={e => setPredictorMarks(e.target.value)}
                  className="w-full text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-cream placeholder-cream/20 focus:outline-none focus:border-mint transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-cream/40 mb-1 font-poppins">Preferred Course</label>
                <select
                  value={predictorStream}
                  onChange={e => setPredictorStream(e.target.value)}
                  className="w-full text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-cream focus:outline-none focus:border-mint transition-all font-inter [&>option]:bg-zinc-900"
                >
                  <option value="cs">Computer Science (CSE)</option>
                  <option value="ai">AI & Machine Learning</option>
                  <option value="is">Information Science (ISE)</option>
                  <option value="other">Other Engineering Streams</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handlePredict}
                  className="w-full bg-mint text-black font-bold text-xs py-2.5 px-4 rounded-xl hover:bg-mint/90 transition-all cursor-pointer shadow-md hover:shadow-lg font-poppins"
                >
                  Predict Eligibility
                </button>
              </div>
            </div>

            {predictionResults && (
              <div className="border-t border-white/5 pt-4 mt-2">
                <h4 className="text-xs font-bold text-cream uppercase tracking-wider mb-3 font-poppins">Predicted Admission Chances</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {predictionResults.slice(0, 6).map(res => (
                    <div key={res.id} className="p-3.5 rounded-xl border border-white/5 bg-white/2 space-y-2 flex flex-col justify-between">
                      <div>
                        <h5 className="font-bold text-xs text-cream line-clamp-1 font-poppins">{res.college_name}</h5>
                        <p className="text-[10px] text-cream/40 mt-0.5">{res.top_course}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-cream/30">Probability</span>
                        <span className={`text-xs font-black ${
                          res.probability >= 85 ? 'text-emerald-400' :
                          res.probability >= 55 ? 'text-sand' :
                          'text-coral'
                        }`}>{res.probability}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* College Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center space-x-2 text-xs text-cream/50">
          <Filter size={13} />
          <span className="font-semibold font-poppins">Filters:</span>
        </div>
        {['All', 'Government', 'Private'].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              typeFilter === t ? 'border-mint/30 text-mint bg-mint/10' : 'border-cream/10 text-cream/40 hover:text-cream'
            }`}>{t}</button>
        ))}
        <span className="text-cream/20">|</span>
        {INTEREST_FILTERS.map(f => (
          <button key={f.id} onClick={() => setInterestFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              interestFilter === f.id ? 'border-sand/30 text-sand bg-sand/10' : 'border-cream/10 text-cream/40 hover:text-cream'
            }`}>{f.label}</button>
        ))}
        <div className="flex items-center space-x-2 ml-auto">
          <span className="text-xs text-cream/40 font-poppins">Budget/yr:</span>
          <input type="range" min="10000" max="300000" step="5000" value={budgetLimit}
            onChange={e => setBudgetLimit(parseInt(e.target.value))}
            className="w-28 cursor-pointer accent-mint" />
          <span className="text-xs text-sand font-bold">₹{(budgetLimit/1000).toFixed(0)}k</span>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-cream flex items-center space-x-2 font-poppins">
          <TrendingUp size={18} className="text-mint" />
          <span>Ranked College Matches</span>
          <span className="text-xs text-cream/30 font-normal">({rankedColleges.length} found)</span>
        </h2>
      </div>

      {/* College Cards */}
      {rankedColleges.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-2xl">
          <p className="text-cream/40 text-sm mb-3 font-inter">No colleges matched your current filters.</p>
          <button onClick={() => { setBudgetLimit(300000); setTypeFilter('All'); setInterestFilter('All') }}
            className="text-xs text-mint underline cursor-pointer">Reset all filters</button>
        </div>
      ) : (
        <div className="space-y-4">
          {rankedColleges.map((college, idx) => {
            const eligibility = getCollegeEligibility(college, user?.academic?.marks)
            const matchPct = Math.min(100, Math.round((college.score / 170) * 100))
            const isBookmarked = bookmarks.some(b => b.college_id === college.id)
            const isCompared = comparedIds.includes(college.id)

            // Dynamic ratings calculation based on reviews loaded
            const collegeReviews = reviewsByCollege[college.id] || []
            const displayRating = collegeReviews.length > 0
              ? (collegeReviews.reduce((acc, curr) => acc + curr.rating, 0) / collegeReviews.length).toFixed(1)
              : college.rating

            return (
              <div key={college.id}
                className="p-5 md:p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-mint/25 hover:bg-white/8 transition-all duration-300 group">
                <div className="flex flex-col md:flex-row justify-between gap-5">

                  {/* Left: Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-cream/30">#{idx + 1}</span>

                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        college.college_type === 'Government'
                          ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                          : 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20'
                      }`}>{college.college_type}</span>

                      {college.naac_grade !== 'NA' && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-sand/10 text-sand border border-sand/20 flex items-center space-x-1">
                          <Shield size={9} />
                          <span>NAAC {college.naac_grade}</span>
                        </span>
                      )}

                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${eligibility.color}`}>
                        {eligibility.label}
                      </span>

                      <span className="text-xs text-cream/35 flex items-center space-x-1 font-inter">
                        <MapPin size={11} />
                        <span>{college.location}</span>
                      </span>

                      {/* Compare Checkbox */}
                      <label className="flex items-center gap-1.5 text-[10px] font-bold text-cream/40 hover:text-cream cursor-pointer select-none ml-2 border border-white/5 px-2 py-0.5 rounded bg-black/15">
                        <input
                          type="checkbox"
                          checked={isCompared}
                          onChange={() => {
                            if (isCompared) {
                              setComparedIds(comparedIds.filter(id => id !== college.id))
                            } else {
                              if (comparedIds.length >= 3) {
                                alert('You can compare a maximum of 3 colleges.')
                                return
                              }
                              setComparedIds([...comparedIds, college.id])
                            }
                          }}
                          className="rounded border-white/10 text-mint focus:ring-mint focus:ring-offset-0 bg-transparent w-3.5 h-3.5 accent-mint"
                        />
                        <span>Compare</span>
                      </label>

                      {/* Bookmark Button */}
                      <button
                        onClick={() => toggleBookmark(college.id)}
                        className="ml-auto p-1.5 text-cream/40 hover:text-sand hover:scale-110 transition-all cursor-pointer flex items-center justify-center rounded-lg hover:bg-white/5"
                        title={isBookmarked ? 'Remove Bookmark' : 'Bookmark College'}
                      >
                        <Bookmark size={15} className={isBookmarked ? 'text-sand fill-sand animate-bounce' : ''} />
                      </button>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-cream group-hover:text-mint transition-colors font-poppins">
                        {college.college_name}
                      </h3>
                      <p className="text-xs text-cream/50 mt-0.5 font-inter">
                        Top Program: <span className="text-sand font-semibold">{college.top_course}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {college.matchReasons?.map((r, i) => (
                        <span key={i} className="text-[10px] text-cream/35 bg-black/20 border border-white/5 px-2 py-1 rounded-lg font-inter">
                          · {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: Stats */}
                  <div className="flex flex-row md:flex-col justify-between items-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
                    <div className="text-right space-y-1">
                      <div className="text-xs text-cream/40 font-poppins">Annual Fees</div>
                      <div className="text-sm font-bold text-cream">{formatCurrency(college.annual_fee)}</div>
                      <div className="text-xs text-cream/40 font-poppins">Top Package</div>
                      <div className="text-sm font-bold text-mint">{formatCurrency(college.highest_package)}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-cream/30 font-semibold uppercase font-poppins">Match Score</div>
                      <div className="text-2xl font-black text-sand font-poppins">{matchPct}%</div>
                      <div className="flex items-center justify-end space-x-1">
                        <Star size={11} className="text-sand fill-sand" />
                        <span className="text-xs font-bold text-sand font-poppins">{displayRating}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating & Review Toggle Button */}
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                  <button
                    onClick={() => handleToggleReviews(college.id)}
                    className="text-xs font-semibold text-mint hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare size={13} />
                    <span>Reviews & Ratings ({reviewsByCollege[college.id]?.length || 0})</span>
                  </button>
                </div>

                {/* Reviews Expand Panel */}
                {expandedReviewsCollegeId === college.id && (
                  <div className="mt-4 border-t border-white/10 pt-4 space-y-4">
                    <h4 className="text-xs font-bold text-cream uppercase tracking-wider font-poppins">Student Reviews</h4>
                    
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {collegeReviews.length === 0 ? (
                        <p className="text-xs text-cream/40 italic font-inter">No reviews yet. Share your experience!</p>
                      ) : (
                        collegeReviews.map(rev => (
                          <div key={rev.id} className="p-3 rounded-xl bg-white/2 border border-white/5 space-y-1.5 text-left">
                            <div className="flex items-center justify-between text-[10px] font-poppins">
                              <span className="font-bold text-cream">{rev.username}</span>
                              <span className="text-cream/40">{new Date(rev.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={10} className={i < rev.rating ? 'text-sand fill-sand' : 'text-cream/20'} />
                              ))}
                            </div>
                            <p className="text-xs text-cream/70 leading-relaxed font-inter">{rev.comment}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Write Review Form */}
                    <form onSubmit={(e) => handlePostReview(e, college.id)} className="bg-white/2 border border-white/5 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-cream/50 font-poppins">Your Rating:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewReviewRating(star)}
                              className="text-cream/40 hover:text-sand hover:scale-115 transition-all cursor-pointer"
                            >
                              <Star size={14} className={star <= newReviewRating ? 'text-sand fill-sand' : 'text-cream/20'} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Write a brief review..."
                          value={newReviewComment}
                          onChange={(e) => setNewReviewComment(e.target.value)}
                          className="flex-1 text-xs bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-cream placeholder-cream/20 focus:outline-none focus:border-mint transition-all"
                        />
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="bg-mint text-black text-xs font-bold px-4.5 py-2 rounded-xl hover:bg-mint/90 transition-all cursor-pointer disabled:opacity-50"
                        >
                          Submit
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* College Comparison Floating Table Drawer */}
      {comparedIds.length >= 2 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] p-5 md:p-6 backdrop-blur-xl animate-in slide-in-from-bottom duration-300">
          <div className="max-w-6xl mx-auto space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 font-poppins">
                  <TrendingUp size={16} className="text-mint" />
                  <span>College Comparison ({comparedIds.length}/3)</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-inter">Side-by-side comparison of fees, placements, courses, and locations</p>
              </div>
              <button
                onClick={() => setComparedIds([])}
                className="text-xs text-rose-500 hover:text-rose-600 font-bold hover:underline cursor-pointer"
              >
                Clear comparison
              </button>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-4 gap-4 text-xs">
              
              {/* Labels Row */}
              <div className="space-y-4 font-bold text-slate-400 pt-14 font-poppins">
                <div>Type</div>
                <div>Location</div>
                <div>NAAC Grade</div>
                <div>Top Course</div>
                <div>Annual Fees</div>
                <div>Highest Package</div>
                <div>Rating</div>
              </div>

              {/* College Data Columns */}
              {comparedIds.map(id => {
                const college = COLLEGES.find(c => c.id === id)
                if (!college) return null
                const annualFee = college.total_fees / 4

                return (
                  <div key={college.id} className="space-y-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 relative">
                    <button
                      onClick={() => setComparedIds(comparedIds.filter(cid => cid !== college.id))}
                      className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 font-bold text-[10px]"
                    >
                      Remove
                    </button>
                    
                    <div className="h-10 flex flex-col justify-end">
                      <h4 className="font-bold text-slate-800 line-clamp-2 leading-tight font-poppins">{college.college_name}</h4>
                    </div>

                    <div className="font-inter text-slate-600">{college.college_type}</div>
                    <div className="truncate font-inter text-slate-600">{college.location}</div>
                    <div className="font-inter text-slate-600">{college.naac_grade}</div>
                    <div className="truncate text-sand font-bold font-inter">{college.top_course}</div>
                    <div className="font-bold text-slate-800 font-inter">{formatCurrency(annualFee)}</div>
                    <div className="font-bold text-emerald-600 font-inter">{formatCurrency(college.highest_package)}</div>
                    <div className="flex items-center gap-1 font-bold text-sand font-poppins">
                      <Star size={10} className="fill-sand text-sand" />
                      <span>{college.rating}</span>
                    </div>
                  </div>
                )
              })}

              {/* Empty state slot */}
              {comparedIds.length < 3 && (
                <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-xl flex items-center justify-center text-slate-400 italic p-4 text-center font-inter">
                  Select another college to compare
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Colleges
