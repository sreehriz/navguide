import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, GraduationCap, Target, GitCompare, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

// Import local images for the floating banner
import image2 from '../images/image2.png'

export function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--c-bg)' }}>
      {/* ─── Navigation Header ─── */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b" style={{ borderColor: 'var(--c-border)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-100/40 border border-teal-200">
              <Sparkles size={15} style={{ color: 'var(--c-teal-dk)' }} />
            </div>
            <span className="font-800 text-lg tracking-tight text-gray-900">
              Nav<span className="text-xl font-bold text-[var(--c-orange)]">Guide</span>
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link to={isAuthenticated ? "/dashboard" : "/login"} className="text-xs font-700 text-gray-600 hover:text-gray-900 mr-2 transition-colors">
              Explore
            </Link>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary py-1.5 px-4 text-xs font-700">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs font-700 text-gray-600 hover:text-gray-900">
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary py-1.5 px-4 text-xs font-700">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col lg:flex-row items-center gap-12 md:gap-16">
        
        {/* Left Column: Context Copy */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-700 bg-teal-50 border border-teal-100 text-teal-700">
            <Sparkles size={12} className="animate-spin" />
            <span>Next-Generation AI Learning Companion</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 leading-tight">
            Empower Your Future with{' '}
            <span className="text-[var(--c-orange)] block sm:inline text-5xl sm:text-6xl">
              Nav AI Mentor
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            NavGuide combines machine learning with checklist engines to dynamically rank colleges, identify exam eligibilities, map career tracks, and guide your daily study routines.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link to={isAuthenticated ? "/dashboard" : "/signup"} className="btn-primary w-full sm:w-auto py-3 px-6 text-sm flex items-center justify-center gap-2">
              <span>Begin Your Journey</span>
              <ArrowRight size={16} />
            </Link>
            <Link to={isAuthenticated ? "/dashboard" : "/login"} className="btn-outline w-full sm:w-auto py-3 px-6 text-sm flex items-center justify-center">
              Explore
            </Link>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 max-w-md mx-auto lg:mx-0">
            <div>
              <p className="text-xl font-bold text-gray-900">95%</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Match Accuracy</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">40k+</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Active Students</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">A++</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">NAAC Standard</p>
            </div>
          </div>
        </div>

        {/* Right Column: Floating Image Banner */}
        <div className="flex-1 relative flex items-center justify-center w-full max-w-md lg:max-w-none">
          {/* Main banner element wrapper with floating animation (only image2, no surrounding card frame/background) */}
          <div className="relative w-full overflow-hidden animate-float flex justify-center">
            <img 
              src={image2} 
              alt="NavGuide Educational Dashboard Showcase" 
              className="w-full h-auto max-h-[480px] object-contain rounded-2xl shadow-xl transition-transform duration-700 hover:scale-105"
            />
          </div>
        </div>

      </main>

      {/* ─── Features Overview Section ─── */}
      <section id="features" className="w-full bg-white/50 border-t py-16 md:py-24" style={{ borderColor: 'var(--c-border)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--c-orange-dk)]">Comprehensive Guidance Toolkit</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">
              What We <span className="text-[var(--c-teal-dk)] text-4xl">Provide</span>
            </h2>
            <p className="text-sm text-gray-500">
              Navigate college applications and subject criteria smoothly with modular student tools designed to make planning simple.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Feature 1 */}
            <div className="card glass-card-hover p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                  <GraduationCap size={20} />
                </div>
                <h3 className="text-base font-bold text-gray-900">College & Cutoff Matching</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Input your board examination scores to receive eligibility scoring matching cutoff values for top institutions.
                </p>
              </div>
              <div className="pt-4 text-[11px] text-[var(--c-orange-dk)] font-bold flex items-center gap-1.5 cursor-pointer">
                <span>Adaptive DAA ranking</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card glass-card-hover p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600">
                  <Target size={20} />
                </div>
                <h3 className="text-base font-bold text-gray-900">Smart Action Checklists</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  A dynamic task scheduling engine that highlights the single highest value next action based on your target deadlines.
                </p>
              </div>
              <div className="pt-4 text-[11px] text-teal-700 font-bold flex items-center gap-1.5 cursor-pointer">
                <span>Weighted priority tracking</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card glass-card-hover p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600">
                  <GitCompare size={20} />
                </div>
                <h3 className="text-base font-bold text-gray-900">Multi-Factor Decisions</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Compare career directions. Input interest, salary estimates, job stability and skill hurdles to generate objective visual scores.
                </p>
              </div>
              <div className="pt-4 text-[11px] text-yellow-800 font-bold flex items-center gap-1.5 cursor-pointer">
                <span>Pros/cons matrix engine</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="card glass-card-hover p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <MessageSquare size={20} />
                </div>
                <h3 className="text-base font-bold text-gray-900">Nav AI Context Mentor</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  An always-ready conversation helper reading your marks, interests, and budget limits to advise you on next-step options.
                </p>
              </div>
              <div className="pt-4 text-[11px] text-purple-700 font-bold flex items-center gap-1.5 cursor-pointer">
                <span>Profile-aware LLM simulation</span>
              </div>
            </div>

          </div>

          {/* Quick FAQ / Detail banner */}
          <div className="mt-16 bg-white/60 rounded-2xl border border-[var(--c-border)] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h4 className="text-lg font-bold text-gray-900">Ready to organize your path?</h4>
              <p className="text-xs text-gray-500 leading-relaxed">It takes less than three minutes to establish your onboarding profile details.</p>
            </div>
            <Link to={isAuthenticated ? "/dashboard" : "/signup"} className="btn-primary py-2.5 px-5 text-xs font-700 shrink-0">
              Start Free Setup Now
            </Link>
          </div>

        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="w-full text-center py-6 text-xs text-gray-400 border-t bg-white mt-auto" style={{ borderColor: 'var(--c-border)' }}>
        <p className="mb-1">© {new Date().getFullYear()} NavGuide AI · Your Intelligent Academic Mentor</p>
        <p className="text-[10px] text-gray-300">Empowering student choices with structured algorithm comparisons.</p>
      </footer>
    </div>
  )
}

export default Home
