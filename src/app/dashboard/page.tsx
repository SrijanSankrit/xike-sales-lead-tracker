'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useUserRole } from '@/hooks/useUserRole'
import { Lead, LeadStage } from '@/types'
import { getLeads } from '@/utils/leads'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const router = useRouter()
  const [userName, setUserName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<LeadStage>('Lead')
  const [leads, setLeads] = useState<Lead[]>([])
  const { role, loading: roleLoading, canWrite, isAdmin } = useUserRole()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/')
          return
        }
        setUserName(session.user.user_metadata.full_name || (session.user.email ? session.user.email.split('@')[0] : 'User'))
      } catch (error) {
        console.error('Error checking user:', error)
        router.push('/')
      }
    }
    checkUser()
  }, [router, supabase.auth])

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const allLeads = await getLeads()
        setLeads(allLeads)
      } catch (error) {
        console.error('Error loading leads:', error)
        toast.error('Failed to load leads')
      } finally {
        setIsLoading(false)
      }
    }
    loadLeads()
  }, [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Signed out successfully')
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  const filteredLeads = leads.filter(lead => lead.stage === activeTab)

  if (roleLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">XIKE Sales Lead Tracker</h1>
              <span className="ml-4 px-2 py-1 text-sm font-medium rounded-md bg-gray-100 text-gray-800">
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{userName}</span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              {(['Lead', 'To Pitch', 'Pitched'] as LeadStage[]).map((stage) => (
                <button
                  key={stage}
                  onClick={() => setActiveTab(stage)}
                  className={`
                    w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm
                    ${activeTab === stage
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {stage}
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {leads.filter(lead => lead.stage === stage).length}
                  </span>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-6">
            {/* Lead List will go here */}
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium">{lead.name}</h3>
                  <p className="text-sm text-gray-600">{lead.location}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-sm text-gray-500">ACP: {lead.acp}</span>
                    <span className="text-sm text-gray-500">Area: {lead.area}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 