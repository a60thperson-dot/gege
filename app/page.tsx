'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import '../i18n'

interface User {
  id: string
  company: string
  accessKey: string
}

interface ProjectFile {
  id: string
  name: string
  type: string
  size: number
  data: string // base64 encoded
  uploadedDate: string
}

interface Project {
  id: string
  clientName: string
  clientPhone: string
  clientEmail: string
  caseType: string
  status: 'Estimating' | 'In Progress' | 'Closed' | 'On Hold'
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  tags: string[]
  notes: string
  createdDate: string
  lastUpdated: string
  assignedTo: string
  dateOfSending: string
  files: ProjectFile[]
}

declare global {
  interface Window {
    electronAPI?: {
      readAccessKeys: () => Promise<AccessKey[]>
      writeAccessKeys: (keys: AccessKey[]) => Promise<void>
      setServerMode: (mode: string) => Promise<{ success: boolean }>
      getServerMode: () => Promise<string>
      invokeIPC: (channel: string, ...args: unknown[]) => Promise<unknown>
    }
  }
}

interface AccessKey {
  id: string
  companyName: string
  userName: string
  accessKey: string
  createdDate: string
  used: boolean
  usedBy?: string
  usedDate?: string
}

const readAccessKeys = async (): Promise<AccessKey[]> => {
  if (typeof window !== 'undefined' && window.electronAPI?.readAccessKeys) {
    try {
      return await window.electronAPI.readAccessKeys()
    } catch {
      return []
    }
  }
  const stored = typeof window !== 'undefined' ? window.localStorage.getItem('accessKeys') : null
  if (!stored) return []
  try {
    return JSON.parse(stored) as AccessKey[]
  } catch {
    return []
  }
}

const writeAccessKeys = async (keys: AccessKey[]) => {
  if (typeof window !== 'undefined' && window.electronAPI?.writeAccessKeys) {
    try {
      await window.electronAPI.writeAccessKeys(keys)
      return
    } catch {
      // fallback to localStorage
    }
  }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('accessKeys', JSON.stringify(keys))
  }
}

const AnimationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  .animate-fade-in { animation: fadeIn 0.6s ease-out; }
  .animate-slide-up { animation: slideInUp 0.6s ease-out; }
  .animate-slide-down { animation: slideInDown 0.6s ease-out; }
  .animate-slide-left { animation: slideInLeft 0.6s ease-out; }
  .animate-slide-right { animation: slideInRight 0.6s ease-out; }
  .animate-scale-in { animation: scaleIn 0.5s ease-out; }
  .animate-pulse-subtle { animation: pulse 2s ease-in-out infinite; }
`

export default function Home() {
  const { t, i18n } = useTranslation()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isSignup, setIsSignup] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000'

  // Form states
  const [loginForm, setLoginForm] = useState({ company: '', accessKey: '' })
  const [loginError, setLoginError] = useState<string | null>(null)
  const [newProjectForm, setNewProjectForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    caseType: '',
    status: 'Estimating' as const,
    priority: 'Medium' as const,
    tags: '',
    notes: '',
    assignedTo: '',
    dateOfSending: ''
  })

  useEffect(() => {
    const user = localStorage.getItem('currentUser')
    if (user) {
      const userData = JSON.parse(user)
      setCurrentUser(userData)
      loadProjectsForCompany(userData.company, userData.accessKey)
    }
  }, [])

  const loadProjectsForCompany = (company: string, accessKey: string) => {
    const apiUrl = `${SERVER_URL}/api/projects/get`
    
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, accessKey: accessKey.toUpperCase() })
    })
      .then(res => res.json())
      .then(data => {
        setProjects(data.projects || [])
        localStorage.setItem(`projects_${company}`, JSON.stringify(data.projects || []))
      })
      .catch(() => {
        // Fallback to localStorage if server is not available
        const stored = localStorage.getItem(`projects_${company}`)
        if (stored) {
          try {
            setProjects(JSON.parse(stored))
          } catch {
            setProjects([])
          }
        } else {
          setProjects([])
        }
      })
  }

  const saveProjects = (newProjects: Project[], company: string, accessKey: string) => {
    setProjects(newProjects)
    localStorage.setItem(`projects_${company}`, JSON.stringify(newProjects))
    
    // Sync to server
    const apiUrl = `${SERVER_URL}/api/projects/save`
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, accessKey: accessKey.toUpperCase(), projects: newProjects })
    }).catch(() => {
      // Server not available, but data is still saved in localStorage
      console.log('Server sync failed, using local storage')
    })
  }

  const handleLogin = async () => {
    if (!loginForm.company.trim() || !loginForm.accessKey.trim()) {
      setLoginError('Enter company name and access key to continue.')
      return
    }

    if (isLoggingIn) return // Prevent multiple clicks

    setIsLoggingIn(true)
    setLoginError(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          company: loginForm.company.trim(), 
          accessKey: loginForm.accessKey.trim().toUpperCase()
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (response.ok && data.success) {
        const user: User = {
          id: data.user.id,
          company: loginForm.company.trim(),
          accessKey: loginForm.accessKey.trim().toUpperCase()
        }

        setCurrentUser(user)
        localStorage.setItem('currentUser', JSON.stringify(user))
        setLoginForm({ company: '', accessKey: '' })
        setLoginError(null)
        setIsSignup(false)
        loadProjectsForCompany(user.company, user.accessKey)
      } else {
        setLoginError(data.error || 'Invalid credentials. Please check your company name and access key.')
      }
    } catch (error: unknown) {
      const isTimeout = error instanceof Error && error.name === 'AbortError'
      
      if (isTimeout) {
        setLoginError(`Connection timeout. Make sure the server is running.`)
      } else {
        setLoginError(`Cannot connect to server. Check if it's running.`)
      }
      console.error('Login error:', error)
    } finally {
      setIsLoggingIn(false)
    }
  }



  const handleLogout = () => {
    setCurrentUser(null)
    setProjects([])
    setSelectedProject(null)
    setEditingProject(null)
    localStorage.removeItem('currentUser')
  }

  const addProject = () => {
    if (!newProjectForm.clientName.trim() || !currentUser) return

    // Calculate priority based on dateOfSending
    let calculatedPriority: 'Low' | 'Medium' | 'High' | 'Critical' = newProjectForm.priority
    if (newProjectForm.dateOfSending) {
      const sendingDate = new Date(newProjectForm.dateOfSending)
      const today = new Date()
      const diffTime = today.getTime() - sendingDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays > 10) {
        calculatedPriority = 'Critical'
      }
    }

    const newProject: Project = {
      id: Date.now().toString(),
      ...newProjectForm,
      priority: calculatedPriority,
      tags: newProjectForm.tags.split(',').filter(t => t.trim()),
      createdDate: new Date().toLocaleDateString(),
      lastUpdated: new Date().toLocaleDateString(),
      files: []
    }
    saveProjects([...projects, newProject], currentUser.company, currentUser.accessKey)
    setNewProjectForm({
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      caseType: '',
      status: 'Estimating',
      priority: 'Medium',
      tags: '',
      notes: '',
      assignedTo: '',
      dateOfSending: ''
    })
  }

  const updateProject = () => {
    if (!editingProject || !currentUser) return

    // Recalculate priority based on dateOfSending
    let calculatedPriority: 'Low' | 'Medium' | 'High' | 'Critical' = editingProject.priority
    if (editingProject.dateOfSending) {
      const sendingDate = new Date(editingProject.dateOfSending)
      const today = new Date()
      const diffTime = today.getTime() - sendingDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays > 10) {
        calculatedPriority = 'Critical'
      }
    }

    const updatedProject = { ...editingProject, priority: calculatedPriority, lastUpdated: new Date().toLocaleDateString() }
    const updated = projects.map(c => c.id === editingProject.id ? updatedProject : c)
    saveProjects(updated, currentUser.company, currentUser.accessKey)
    setSelectedProject(updatedProject)
    setEditingProject(null)
  }

  const deleteProject = (id: string) => {
    if (!currentUser) return
    saveProjects(projects.filter(c => c.id !== id), currentUser.company, currentUser.accessKey)
    if (selectedProject?.id === id) setSelectedProject(null)
  }

  const deleteFile = (projectId: string, fileId: string) => {
    if (!currentUser) return
    const updated = projects.map(p => 
      p.id === projectId ? { ...p, files: p.files.filter(f => f.id !== fileId) } : p
    )
    saveProjects(updated, currentUser.company, currentUser.accessKey)
    const updatedProject = updated.find(p => p.id === projectId)
    if (updatedProject) setSelectedProject(updatedProject)
  }

  const filteredProjects = projects.filter(c => {
    const matchesSearch = c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.caseType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterStatus === 'All' || c.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: projects.length,
    estimating: projects.filter(c => c.status === 'Estimating').length,
    inProgress: projects.filter(c => c.status === 'In Progress').length,
    closed: projects.filter(c => c.status === 'Closed').length,
    critical: projects.filter(c => c.priority === 'Critical').length
  }

  if (!currentUser) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center p-4 overflow-hidden">

          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-gray-700/5 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-gray-700/5 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
          </div>
          <div className="w-full max-w-md relative z-10">
            <div className="bg-gradient-to-br from-gray-900/70 to-black/70 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-gray-600/30 animate-scale-in">
              <div className="text-center mb-8 animate-slide-down">
                <div className="text-6xl mb-4 inline-block animate-float">📋</div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  ProjectFlow
                </h1>
                <p className="text-gray-400/70 text-sm tracking-widest">{t('login.subtitle')}</p>
              </div>

              <div className="space-y-4 animate-slide-up">
                <div>
                  <input
                    type="text"
                    placeholder={t('login.company')}
                    value={loginForm.company}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, company: e.target.value })
                      setLoginError(null)
                    }}
                    className="w-full px-4 py-3 bg-gray-800/40 border border-gray-600/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-white placeholder-gray-500 transition-all duration-300 hover:border-gray-500/50"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Access Key"
                    value={loginForm.accessKey}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, accessKey: e.target.value })
                      setLoginError(null)
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full px-4 py-3 bg-gray-800/40 border border-gray-600/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-white placeholder-gray-500 transition-all duration-300 hover:border-gray-500/50"
                  />
                </div>
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-600/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingIn ? '⏳ Signing in...' : t('login.signin')}
                </button>
                {loginError && (
                  <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/30 backdrop-blur-sm p-4 text-sm text-red-200 animate-slide-down">
                    <p className="font-semibold mb-1">⚠️ {t('login.error')}</p>
                    <p className="text-red-100/80">{loginError}</p>
                  </div>
                )}
              </div>

              <div className="mt-8 p-4 bg-gray-900/40 rounded-xl border border-gray-600/20 animate-slide-up" style={{animationDelay: '0.2s'}}>
                <p className="text-gray-400/70 text-sm text-center leading-relaxed">
                  {t('login.help')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Main App
  return (
    <>

      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white relative overflow-x-hidden">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        </div>

        {/* Header */}
        <div className="relative z-40 bg-gradient-to-r from-slate-900/60 to-indigo-900/40 backdrop-blur-lg border-b border-purple-500/20 p-4 sticky top-0 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <div className="animate-slide-right">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-200 mb-1">
                ProjectFlow
              </h1>
              <p className="text-purple-300/60 text-sm font-light tracking-wide">{currentUser.company}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-purple-300/70 text-sm">{t('language')}:</span>
                <select
                  value={i18n.language}
                  onChange={(e) => i18n.changeLanguage(e.target.value)}
                  className="px-3 py-1 bg-slate-900/40 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:border-purple-400/50"
                >
                  <option value="en">{t('language.en')}</option>
                  <option value="ar">{t('language.ar')}</option>
                </select>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-gradient-to-r from-purple-600/60 to-pink-600/60 hover:from-purple-600 hover:to-pink-600 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 border border-purple-400/30 backdrop-blur-sm shadow-lg"
              >
                {t('header.logout')}
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto p-6 relative z-10">
          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: t('stats.total'), value: stats.total, color: 'from-purple-600/40 to-pink-600/30', icon: '📊' },
              { label: t('stats.estimating'), value: stats.estimating, color: 'from-blue-600/40 to-cyan-600/30', icon: '📋' },
              { label: t('stats.progress'), value: stats.inProgress, color: 'from-amber-600/40 to-orange-600/30', icon: '⚙️' },
              { label: t('stats.closed'), value: stats.closed, color: 'from-green-600/40 to-emerald-600/30', icon: '✅' },
              { label: t('stats.critical'), value: stats.critical, color: 'from-red-600/40 to-rose-600/30', icon: '🔴' }
            ].map((stat, i) => (
              <div 
                key={i} 
                className={`bg-gradient-to-br ${stat.color} rounded-2xl p-4 shadow-lg border border-white/10 hover:border-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-xl backdrop-blur-sm animate-scale-in`}
                style={{animationDelay: `${i * 0.1}s`}}
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <p className="text-xs text-white/70 font-light uppercase tracking-widest">{stat.label}</p>
                <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add/Edit Project Form */}
            <div className="lg:col-span-1 animate-slide-left">
            <div className="bg-gradient-to-br from-slate-900/50 to-purple-900/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-purple-500/20 sticky top-24 hover:border-purple-500/40 transition-all duration-300">
              <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                {editingProject ? t('form.edit') : t('form.add')}
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-purple-950/20">
                <input
                  type="text"
                  placeholder={t('form.clientName')}
                  value={editingProject ? editingProject.clientName : newProjectForm.clientName}
                  onChange={(e) => editingProject ? setEditingProject({...editingProject, clientName: e.target.value}) : setNewProjectForm({...newProjectForm, clientName: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/40 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-slate-500 text-sm transition-all duration-300 hover:border-purple-400/50"
                />
                <input
                  type="tel"
                  placeholder={t('form.phone')}
                  value={editingProject ? editingProject.clientPhone : newProjectForm.clientPhone}
                  onChange={(e) => editingProject ? setEditingProject({...editingProject, clientPhone: e.target.value}) : setNewProjectForm({...newProjectForm, clientPhone: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/40 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-slate-500 text-sm transition-all duration-300 hover:border-purple-400/50"
                />
                <input
                  type="email"
                  placeholder={t('form.email')}
                  value={editingProject ? editingProject.clientEmail : newProjectForm.clientEmail}
                  onChange={(e) => editingProject ? setEditingProject({...editingProject, clientEmail: e.target.value}) : setNewProjectForm({...newProjectForm, clientEmail: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/40 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-slate-500 text-sm transition-all duration-300 hover:border-purple-400/50"
                />
                <input
                  type="text"
                  placeholder={t('form.caseType')}
                  value={editingProject ? editingProject.caseType : newProjectForm.caseType}
                  onChange={(e) => editingProject ? setEditingProject({...editingProject, caseType: e.target.value}) : setNewProjectForm({...newProjectForm, caseType: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/40 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-slate-500 text-sm transition-all duration-300 hover:border-purple-400/50"
                />
                <input
                  type="date"
                  placeholder={t('form.dateOfSending')}
                  value={editingProject ? editingProject.dateOfSending : newProjectForm.dateOfSending}
                  onChange={(e) => editingProject ? setEditingProject({...editingProject, dateOfSending: e.target.value}) : setNewProjectForm({...newProjectForm, dateOfSending: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/40 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-slate-500 text-sm transition-all duration-300 hover:border-purple-400/50"
                />
                <select
                  value={editingProject ? editingProject.status : newProjectForm.status}
                  onChange={(e) => editingProject ? setEditingProject({...editingProject, status: e.target.value as any}) : setNewProjectForm({...newProjectForm, status: e.target.value as any})}
                  className="w-full px-4 py-3 bg-slate-900/40 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white text-sm transition-all duration-300 hover:border-purple-400/50"
                >
                  <option>{t('status.estimating')}</option>
                  <option>{t('status.progress')}</option>
                  <option>{t('status.closed')}</option>
                  <option>{t('status.hold')}</option>
                </select>
                <select
                  value={editingProject ? editingProject.priority : newProjectForm.priority}
                  onChange={(e) => editingProject ? setEditingProject({...editingProject, priority: e.target.value as any}) : setNewProjectForm({...newProjectForm, priority: e.target.value as any})}
                  className="w-full px-4 py-3 bg-slate-900/40 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white text-sm transition-all duration-300 hover:border-purple-400/50"
                >
                  <option>{t('priority.low')}</option>
                  <option>{t('priority.medium')}</option>
                  <option>{t('priority.high')}</option>
                  <option>{t('priority.critical')}</option>
                </select>
                <input
                  type="text"
                  placeholder={t('form.tags')}
                  value={editingProject ? editingProject.tags.join(', ') : newProjectForm.tags}
                  onChange={(e) => editingProject ? setEditingProject({...editingProject, tags: e.target.value.split(',').map(t => t.trim())}) : setNewProjectForm({...newProjectForm, tags: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/40 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-slate-500 text-sm transition-all duration-300 hover:border-purple-400/50"
                />
                <input
                  type="text"
                  placeholder={t('form.assignedTo')}
                  value={editingProject ? editingProject.assignedTo : newProjectForm.assignedTo}
                  onChange={(e) => editingProject ? setEditingProject({...editingProject, assignedTo: e.target.value}) : setNewProjectForm({...newProjectForm, assignedTo: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/40 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-slate-500 text-sm transition-all duration-300 hover:border-purple-400/50"
                />
                <textarea
                  placeholder={t('form.notes')}
                  value={editingProject ? editingProject.notes : newProjectForm.notes}
                  onChange={(e) => editingProject ? setEditingProject({...editingProject, notes: e.target.value}) : setNewProjectForm({...newProjectForm, notes: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-900/40 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-slate-500 text-sm h-24 resize-none transition-all duration-300 hover:border-purple-400/50"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={editingProject ? updateProject : addProject}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/50 active:scale-95"
                >
                  {editingProject ? t('form.updateButton') : t('form.addButton')}
                </button>
                {editingProject && (
                  <button
                    onClick={() => setEditingProject(null)}
                    className="flex-1 px-4 py-3 bg-slate-700/60 hover:bg-slate-600 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 border border-slate-600/50"
                  >
                    {t('form.cancel')}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Projects List and Details */}
          <div className="lg:col-span-2 space-y-6 animate-slide-right">
            {/* Search and Filter */}
            <div className="flex gap-3 backdrop-blur-sm">
              <input
                type="text"
                placeholder={t('projects.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-900/40 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white placeholder-slate-500 transition-all duration-300 hover:border-purple-400/50"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-slate-900/40 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-white transition-all duration-300 hover:border-purple-400/50"
              >
                <option>{t('projects.filter')}</option>
                <option>{t('status.estimating')}</option>
                <option>{t('status.progress')}</option>
                <option>{t('status.closed')}</option>
                <option>{t('status.hold')}</option>
              </select>
            </div>

            {/* Projects Grid */}
            <div className="grid gap-4">
              {filteredProjects.length === 0 ? (
                <div className="bg-gradient-to-br from-purple-950/30 to-slate-900/30 rounded-2xl p-12 text-center border border-purple-500/20 backdrop-blur-sm animate-scale-in">
                  <p className="text-purple-300/70 text-lg font-light">{t('projects.noProjects')}</p>
                </div>
              ) : (
                filteredProjects.map((projectItem, idx) => (
                  <div
                    key={projectItem.id}
                    onClick={() => {
                      setSelectedProject(projectItem)
                      setEditingProject(null)
                    }}
                    className={`bg-gradient-to-br from-slate-900/40 to-purple-900/30 backdrop-blur-sm rounded-2xl p-5 shadow-lg border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 animate-scale-in ${
                      selectedProject?.id === projectItem.id ? 'border-purple-400 bg-purple-900/50' : 'border-purple-500/20 hover:border-purple-500/50'
                    }`}
                    style={{animationDelay: `${idx * 0.05}s`}}
                  >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-purple-200 hover:text-purple-100 transition-colors">{projectItem.clientName}</h3>
                          <p className="text-purple-400/60 text-sm">{projectItem.caseType}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border transition-all ${
                          projectItem.priority === 'Critical' ? 'bg-red-950/60 text-red-200 border-red-400/30' :
                          projectItem.priority === 'High' ? 'bg-orange-950/60 text-orange-200 border-orange-400/30' :
                          projectItem.priority === 'Medium' ? 'bg-amber-950/60 text-amber-200 border-amber-400/30' :
                          'bg-green-950/60 text-green-200 border-green-400/30'
                        }`}>
                          {projectItem.priority}
                        </span>
                      </div>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          projectItem.status === 'Closed' ? 'bg-slate-800/40 text-slate-200' :
                          projectItem.status === 'In Progress' ? 'bg-slate-700/40 text-slate-300' :
                          projectItem.status === 'On Hold' ? 'bg-slate-600/40 text-slate-400' :
                          'bg-slate-500/40 text-slate-500'
                        }`}>
                          {projectItem.status}
                        </span>
                        {projectItem.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 rounded text-xs bg-slate-700/50 text-slate-200">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <p className="text-slate-400 text-sm">{projectItem.clientEmail}</p>
                    </div>
                  ))
                )}
            </div>

            {/* Project Details */}
            {selectedProject && (
              <div className="bg-gradient-to-br from-slate-900/50 to-purple-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-purple-500/30 space-y-4 animate-slide-up">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">{selectedProject.clientName}</h3>
                    <p className="text-purple-400/60 text-sm mt-1">{selectedProject.status}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingProject(selectedProject)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600/60 to-cyan-600/60 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 border border-blue-400/30 backdrop-blur-sm"
                    >
                      {t('details.edit')}
                    </button>
                    <button
                      onClick={() => {
                        deleteProject(selectedProject.id)
                        setSelectedProject(null)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-red-600/60 to-rose-600/60 hover:from-red-600 hover:to-rose-600 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 border border-red-400/30 backdrop-blur-sm"
                    >
                      {t('details.delete')}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 my-4">
                  <div className="bg-slate-900/30 rounded-xl p-4 border border-purple-500/20">
                    <p className="text-purple-400/70 text-xs font-light uppercase tracking-widest mb-1">{t('details.phone')}</p>
                    <p className="font-semibold text-purple-200">{selectedProject.clientPhone || '—'}</p>
                  </div>
                  <div className="bg-slate-900/30 rounded-xl p-4 border border-purple-500/20">
                    <p className="text-purple-400/70 text-xs font-light uppercase tracking-widest mb-1">{t('details.email')}</p>
                    <p className="font-semibold text-purple-200 truncate">{selectedProject.clientEmail || '—'}</p>
                  </div>
                  <div className="bg-slate-900/30 rounded-xl p-4 border border-purple-500/20">
                    <p className="text-purple-400/70 text-xs font-light uppercase tracking-widest mb-1">{t('details.type')}</p>
                    <p className="font-semibold text-purple-200">{selectedProject.caseType || '—'}</p>
                  </div>
                  <div className="bg-slate-900/30 rounded-xl p-4 border border-purple-500/20">
                    <p className="text-purple-400/70 text-xs font-light uppercase tracking-widest mb-1">{t('details.assigned')}</p>
                    <p className="font-semibold text-purple-200">{selectedProject.assignedTo || 'Unassigned'}</p>
                  </div>
                  <div className="bg-slate-900/30 rounded-xl p-4 border border-purple-500/20">
                    <p className="text-purple-400/70 text-xs font-light uppercase tracking-widest mb-1">{t('details.created')}</p>
                    <p className="font-semibold text-purple-200">{selectedProject.createdDate}</p>
                  </div>
                  <div className="bg-slate-900/30 rounded-xl p-4 border border-purple-500/20">
                    <p className="text-purple-400/70 text-xs font-light uppercase tracking-widest mb-1">{t('details.updated')}</p>
                    <p className="font-semibold text-purple-200">{selectedProject.lastUpdated}</p>
                  </div>
                </div>
                {selectedProject.notes && (
                  <div className="bg-slate-900/30 rounded-xl p-4 border border-purple-500/20">
                    <p className="text-purple-400/70 text-xs font-light uppercase tracking-widest mb-2">{t('details.notes')}</p>
                    <p className="text-purple-200 leading-relaxed">{selectedProject.notes}</p>
                  </div>
                )}
                <div className="bg-slate-900/20 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-purple-300 text-sm font-semibold">{t('details.files')} ({selectedProject.files.length})</p>
                    <label className="px-4 py-2 bg-gradient-to-r from-purple-600/60 to-pink-600/60 hover:from-purple-600 hover:to-pink-600 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 transform hover:scale-105 border border-purple-400/30 backdrop-blur-sm">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          files.forEach(file => {
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              const base64 = event.target?.result as string
                              const newFile: ProjectFile = {
                                id: Date.now().toString() + Math.random(),
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                data: base64,
                                uploadedDate: new Date().toLocaleDateString()
                              }
                              const updated = projects.map(p => 
                                p.id === selectedProject.id ? { ...p, files: [...p.files, newFile] } : p
                              )
                              saveProjects(updated, currentUser!.company, currentUser!.accessKey)
                              const updatedProject = updated.find(p => p.id === selectedProject.id)
                              if (updatedProject) setSelectedProject(updatedProject)
                            }
                            reader.readAsDataURL(file)
                          })
                        }}
                        className="hidden"
                      />
                      {t('details.upload')}
                    </label>
                  </div>
                  {selectedProject.files.length > 0 ? (
                    <div className="space-y-2">
                      {selectedProject.files.map((file, idx) => (
                        <div 
                          key={file.id} 
                          className="flex items-center justify-between bg-gradient-to-r from-slate-900/60 to-purple-900/40 rounded-lg p-3 border border-purple-500/20 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 animate-slide-up"
                          style={{animationDelay: `${idx * 0.1}s`}}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-purple-200 truncate">📄 {file.name}</p>
                            <p className="text-xs text-purple-400/60">{(file.size / 1024).toFixed(2)} KB • {file.uploadedDate}</p>
                          </div>
                          <div className="flex gap-2 ml-2">
                            <a
                              href={file.data}
                              download={file.name}
                              className="px-3 py-1 bg-gradient-to-r from-blue-600/60 to-cyan-600/60 hover:from-blue-600 hover:to-cyan-600 rounded text-xs font-semibold transition-all duration-300 transform hover:scale-105 border border-blue-400/30"
                            >
                              ⬇️
                            </a>
                            <button
                              onClick={() => deleteFile(selectedProject.id, file.id)}
                              className="px-3 py-1 bg-gradient-to-r from-red-600/60 to-rose-600/60 hover:from-red-600 hover:to-rose-600 rounded text-xs font-semibold transition-all duration-300 transform hover:scale-105 border border-red-400/30"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-purple-400/60 text-sm">{t('details.noFiles')}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </>
  )
}