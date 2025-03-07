'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useUserRole } from '@/hooks/useUserRole'
import { Lead, LeadStage } from '@/types'
import { getLeads, updateLead } from '@/utils/leads'
import { AddLeadModal } from '@/components/AddLeadModal'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Check, Trash2, UserPlus, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TimelineView } from '@/components/TimelineView'
import { Checkbox } from '@/components/ui/checkbox'

const SUGGESTED_EMAILS = [
  'utkarsh@xike.in',
  'sanskar@xike.in',
  'srijan@xike.in',
  'mayank@xike.in',
  'uday.krishna@xike.in'
]

export default function Dashboard() {
  const router = useRouter()
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<LeadStage>(LeadStage.Lead)
  const [leads, setLeads] = useState<Lead[]>([])
  const { role, loading: roleLoading, canWrite, isAdmin } = useUserRole()
  const supabase = createClient()
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showRemarksModal, setShowRemarksModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [assignedTo, setAssignedTo] = useState('')
  const [remarks, setRemarks] = useState('')
  const [responseRating, setResponseRating] = useState('')
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false)
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([])
  const [showTimeline, setShowTimeline] = useState<Record<string, boolean>>({})
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [visitRemarks, setVisitRemarks] = useState('')
  const [showRemarkModal, setShowRemarkModal] = useState(false)
  const [remarkText, setRemarkText] = useState('')
  const [isConverted, setIsConverted] = useState(false)
  const [nextApproachDate, setNextApproachDate] = useState('')
  const [assignRemark, setAssignRemark] = useState('')
  const [dateError, setDateError] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error('Session error:', sessionError)
          router.push('/')
          return
        }
        if (!session) {
          console.log('No session found, redirecting to login')
          router.push('/')
          return
        }
        console.log('User session found:', session.user.email)
        setUserEmail(session.user.email || '')
        setUserName(session.user.user_metadata.full_name || (session.user.email ? session.user.email.split('@')[0] : 'User'))
      } catch (error) {
        console.error('Error checking user:', error)
        router.push('/')
      }
    }
    checkUser()
  }, [router, supabase.auth])

  const loadLeads = async () => {
    try {
      setIsLoading(true)
      console.log('Loading leads...')
      const allLeads = await getLeads()
      console.log('Leads loaded:', allLeads.length)
      setLeads(allLeads)
    } catch (error) {
      console.error('Error loading leads:', error)
      toast.error('Failed to load leads')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!userEmail) {
      console.log('No user email, skipping lead load')
      return
    }
    console.log('Loading leads for user:', userEmail)
    loadLeads()
  }, [userEmail])

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

  const handleApprove = (lead: Lead) => {
    setSelectedLead(lead)
    setShowAssignModal(true)
  }

  const handleAssignSubmit = async () => {
    if (!selectedLead || !assignedTo) return

    try {
      const timelineEntry = {
        timestamp: new Date().toISOString(),
        description: `Lead approved and assigned to ${assignedTo} ${ assignRemark ? `\n Approver remarks: ${assignRemark}` : '' }`
      }

      await updateLead(selectedLead.id, {
        stage: LeadStage.ToPitch,
        assigned_to: assignedTo,
        added_by: selectedLead.added_by,
        approved_by: userEmail || undefined,
        timeline: [...(selectedLead.timeline || []), timelineEntry]
      })

      toast.success('Lead approved and assigned successfully')
      setShowAssignModal(false)
      setAssignRemark('')
      loadLeads()
    } catch (error) {
      console.error('Error approving lead:', error)
      toast.error('Failed to approve lead')
    }
  }

  const handlePitchComplete = (lead: Lead) => {
    setSelectedLead(lead)
    setShowRemarksModal(true)
  }

  const handleRemarksSubmit = async () => {
    if (!selectedLead) return

    try {
      const timelineEntry = {
        timestamp: new Date().toISOString(),
        description: `Pitched to retailer on ${new Date().toLocaleString()}\nRemarks: ${remarks}`
      }

      await updateLead(selectedLead.id, {
        stage: LeadStage.Pitched,
        response_rating: parseFloat(responseRating),
        timeline: [...(selectedLead.timeline || []), timelineEntry]
      })

      toast.success('Pitch marked as complete')
      setShowRemarksModal(false)
      setRemarks('')
      setResponseRating('')
      loadLeads()
    } catch (error) {
      console.error('Error completing pitch:', error)
      toast.error('Failed to complete pitch')
    }
  }

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAssignedTo(value)
    
    if (value) {
      const suggestions = SUGGESTED_EMAILS.filter(email => 
        email.toLowerCase().includes(value.toLowerCase())
      )
      setEmailSuggestions(suggestions)
      setShowEmailSuggestions(true)
    } else {
      setEmailSuggestions([])
      setShowEmailSuggestions(false)
    }
  }

  const handleEmailSuggestionClick = (email: string) => {
    setAssignedTo(email)
    setShowEmailSuggestions(false)
  }

  const handleShopVisit = async () => {
    if (!selectedLead) return

    try {
      const timelineEntry = {
        timestamp: new Date().toISOString(),
        description: `Shop Visit:\n${visitRemarks}`
      }

      await updateLead(selectedLead.id, {
        timeline: [...(selectedLead.timeline || []), timelineEntry]
      })

      toast.success('Shop visit added to timeline')
      setShowVisitModal(false)
      setVisitRemarks('')
      loadLeads()
    } catch (error) {
      console.error('Error adding shop visit:', error)
      toast.error('Failed to add shop visit')
    }
  }

  const handleRemarkSubmit = async () => {
    if (!selectedLead) return

    // Validate date before submitting
    if (nextApproachDate) {
      const selectedDate = new Date(nextApproachDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        setDateError('Next approach date must be in the future')
        return
      }
    }

    try {
      const timelineEntry = {
        timestamp: new Date().toISOString(),
        description: remarkText,
        next_approach_date: nextApproachDate || undefined,
        is_converted: isConverted
      }

      const newStage = isConverted ? LeadStage.Onboarded : selectedLead.stage

      await updateLead(selectedLead.id, {
        stage: newStage,
        timeline: [...(selectedLead.timeline || []), timelineEntry]
      })

      toast.success('Remark added successfully')
      setShowRemarkModal(false)
      setRemarkText('')
      setNextApproachDate('')
      setIsConverted(false)
      setDateError(null)
      loadLeads()
    } catch (error) {
      console.error('Error adding remark:', error)
      toast.error('Failed to add remark')
    }
  }

  if (roleLoading || isLoading) {
    console.log('Loading state:', { roleLoading, isLoading })
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!userEmail) {
    console.log('No user email, showing loading state')
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-black">XIKE Sales Lead Tracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-[#9D1FFF]">{userName}</span>
                <span className="px-2 py-1 text-sm font-medium rounded-md bg-green-500 text-white">
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
              </div>
              <Button
                onClick={handleSignOut}
                className="bg-white text-black border border-red-500 hover:bg-gray-50"
              >
                Log out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b bg-white">
            <div className="flex justify-between items-center p-4">
              <nav className="-mb-px flex" aria-label="Tabs">
                {Object.values(LeadStage).map((stage) => (
                  <button
                    key={stage}
                    onClick={() => setActiveTab(stage)}
                    className={`
                      px-4 py-2 text-sm font-medium border-b-2
                      ${activeTab === stage
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
                      }
                    `}
                  >
                    {stage}
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {leads.filter(lead => lead.stage === stage).length}
                    </span>
                  </button>
                ))}
              </nav>
              {canWrite && (
                <AddLeadModal onLeadAdded={loadLeads} />
              )}
            </div>
          </div>
          
          <div className="p-6 bg-white">
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-[#9D1FFF]">{lead.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{lead.location}</p>
                          <div className="mt-2 flex items-center space-x-4">
                            <span className="text-sm text-gray-600">ACP: ₹{lead.acp}</span>
                            <span className="text-sm text-gray-600">Category: {lead.category.join(', ')}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isAdmin && lead.stage === 'Lead' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-600 hover:text-[#9D1FFF]"
                              onClick={() => handleApprove(lead)}
                            >
                              <Check className="h-5 w-5" />
                            </Button>
                          )}
                          {isAdmin && lead.stage === LeadStage.Lead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-600 hover:text-[#9D1FFF]"
                              onClick={() => {/* TODO: Implement assign */}}
                            >
                              <UserPlus className="h-5 w-5" />
                            </Button>
                          )}
                          {(isAdmin || lead.added_by === userEmail) && lead.stage === 'Lead' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-600 hover:text-red-500"
                              onClick={() => {/* TODO: Implement delete */}}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          )}
                          {lead.stage === LeadStage.ToPitch && lead.assigned_to === userEmail && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-600 hover:text-[#9D1FFF]"
                              onClick={() => handlePitchComplete(lead)}
                            >
                              <Check className="h-5 w-5" />
                            </Button>
                          )}
                          {lead.stage === LeadStage.Pitched && lead.assigned_to === userEmail && !lead.timeline.some(entry => entry.is_converted) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-600 hover:text-[#9D1FFF]"
                              onClick={() => {
                                setSelectedLead(lead)
                                setShowRemarkModal(true)
                              }}
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Area</p>
                          <p className="text-gray-900">{lead.area}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Branches</p>
                          <p className="text-gray-900">{lead.branches || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Instagram</p>
                          <p className="text-gray-900">{lead.instagram_account || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Competitor Apps Discount</p>
                          <p className="text-gray-900">{lead.competitor_apps_discount || 'N/A'}</p>
                        </div>
                        {lead.assigned_to && (
                          <div className="col-span-2">
                            <p className="text-gray-500">Assigned To</p>
                            <p className="text-gray-900">{lead.assigned_to}</p>
                          </div>
                        )}
                        {lead.approved_by && (
                          <div className="col-span-2">
                            <p className="text-gray-500">Approved By</p>
                            <p className="text-gray-900">{lead.approved_by}</p>
                          </div>
                        )}
                        {lead.response_rating && (
                          <div className="col-span-2">
                            <p className="text-gray-500">Response Rating</p>
                            <p className="text-gray-900">{lead.response_rating.toFixed(1)}</p>
                          </div>
                        )}
                        <div className="col-span-2">
                          <Button
                            variant="ghost"
                            className="text-[#9D1FFF] hover:text-[#9D1FFF]/80"
                            onClick={() => setShowTimeline(prev => ({
                              ...prev,
                              [lead.id]: !prev[lead.id]
                            }))}
                          >
                            {showTimeline[lead.id] ? 'Hide Timeline' : 'Show Timeline'}
                          </Button>
                        </div>
                        {showTimeline[lead.id] && lead.timeline && (
                          <div className="col-span-2 mt-4">
                            <TimelineView entries={lead.timeline} />
                          </div>
                        )}
                      </div>
                    </div>
                    {lead.image_url && (
                      <div className="ml-4">
                        <img 
                          src={lead.image_url} 
                          alt={lead.name}
                          className="w-24 h-24 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/96?text=No+Image';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Lead Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Approve and Assign Lead</DialogTitle>
            <DialogDescription className="text-gray-600">
              Assign this lead to a team member and move it to the "To Pitch" stage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <label htmlFor="assigned_to" className="block text-sm font-medium mb-1 text-gray-700">
                Assign To
              </label>
              <input
                type="email"
                id="assigned_to"
                className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                value={assignedTo}
                onChange={handleEmailInputChange}
                placeholder="Enter email to assign"
              />
              {showEmailSuggestions && emailSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                  {emailSuggestions.map((email) => (
                    <div
                      key={email}
                      className="px-3 py-2 text-gray-900 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleEmailSuggestionClick(email)}
                    >
                      {email}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="assignRemark" className="block text-sm font-medium mb-1 text-gray-700">
                Remark (Optional)
              </label>
              <textarea
                id="assignRemark"
                className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                value={assignRemark}
                onChange={(e) => setAssignRemark(e.target.value)}
                placeholder="Add any remarks about the assignment..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAssignSubmit}
              disabled={!assignedTo}
              className="bg-white text-black border border-black hover:bg-gray-50"
            >
              Approve and Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remarks Modal */}
      <Dialog open={showRemarksModal} onOpenChange={setShowRemarksModal}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Complete Pitch</DialogTitle>
            <DialogDescription className="text-gray-600">
              Add remarks about the pitch and rate the response before marking it as complete.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium mb-1 text-gray-700">
                Pitch Remarks
              </label>
              <textarea
                id="remarks"
                className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter pitch remarks..."
                rows={4}
              />
            </div>
            <div>
              <label htmlFor="responseRating" className="block text-sm font-medium mb-1 text-gray-700">
                Response Rating (0.0 - 5.0)
              </label>
              <input
                type="number"
                id="responseRating"
                className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                value={responseRating}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  if (value >= 0 && value <= 5) {
                    setResponseRating(e.target.value)
                  }
                }}
                placeholder="Enter rating (0.0 - 5.0)"
                step="0.1"
                min="0"
                max="5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleRemarksSubmit}
              disabled={!remarks.trim() || !responseRating}
              className="bg-white text-black border border-black hover:bg-gray-50"
            >
              Complete Pitch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visit Modal */}
      <Dialog open={showVisitModal} onOpenChange={setShowVisitModal}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Add Shop Visit</DialogTitle>
            <DialogDescription className="text-gray-600">
              Add remarks about your visit to the shop.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label htmlFor="visitRemarks" className="block text-sm font-medium mb-1 text-gray-700">
              Visit Remarks
            </label>
            <textarea
              id="visitRemarks"
              className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
              value={visitRemarks}
              onChange={(e) => setVisitRemarks(e.target.value)}
              placeholder="Enter visit remarks..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleShopVisit}
              disabled={!visitRemarks.trim()}
              className="bg-white text-black border border-black hover:bg-gray-50"
            >
              Add Visit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Remark Modal */}
      <Dialog open={showRemarkModal} onOpenChange={(open) => {
        setShowRemarkModal(open)
        if (!open) {
          setDateError(null)
        }
      }}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Add Remark</DialogTitle>
            <DialogDescription className="text-gray-600">
              Add a remark about your interaction with the lead.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="remark" className="block text-sm font-medium mb-1 text-gray-700">
                Remark
              </label>
              <textarea
                id="remark"
                className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                placeholder="Enter your remark..."
                rows={4}
              />
            </div>
            <div>
              <label htmlFor="nextApproachDate" className="block text-sm font-medium mb-1 text-gray-700">
                Next Approach Date (Optional)
              </label>
              <input
                type="date"
                id="nextApproachDate"
                className={`w-full rounded-md border ${dateError ? 'border-red-500' : 'border-gray-300'} bg-white text-gray-900 px-3 py-2`}
                value={nextApproachDate}
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value)
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  
                  setNextApproachDate(e.target.value)
                  
                  if (selectedDate < today) {
                    setDateError('Next approach date must be in the future')
                  } else {
                    setDateError(null)
                  }
                }}
                min={new Date().toISOString().split('T')[0]}
              />
              {dateError && (
                <p className="mt-1 text-sm text-red-500">{dateError}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isConverted"
                checked={isConverted}
                onCheckedChange={(checked) => setIsConverted(checked as boolean)}
              />
              <label htmlFor="isConverted" className="text-sm font-medium text-gray-700">
                Lead has been converted
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleRemarkSubmit}
              disabled={!remarkText.trim()}
              className="bg-white text-black border border-black hover:bg-gray-50"
            >
              Add Remark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 