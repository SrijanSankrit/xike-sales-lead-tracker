import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import { createLead } from '@/utils/leads'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { LeadStage } from '@/types'

interface AddLeadModalProps {
  onLeadAdded: () => void
}

const SUGGESTED_EMAILS = [
  'utkarsh@xike.in',
  'sanskar@xike.in',
  'srijan@xike.in',
  'mayank@xike.in',
  'uday.krishna@xike.in'
]

export function AddLeadModal({ onLeadAdded }: AddLeadModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false)
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([])
  const emailInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const [formData, setFormData] = useState({
    name: '',
    category: [] as string[],
    acp: '',
    location: '',
    area: '',
    note: '',
    instagram_account: '',
    competitor_apps_discount: '',
    branches: '',
    image_url: '',
    stage: LeadStage.Lead,
    status: 'Active' as const,
    added_by: '',
    assigned_to: '',
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
      }
    }
    getUser()
  }, [supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('You must be logged in to add a lead')
        return
      }

      const userEmail = session.user.email
      if (!userEmail) {
        toast.error('User email not found')
        return
      }

      // Create timeline entry
      const timelineEntry = {
        timestamp: new Date().toISOString(),
        description: formData.note
      }

      // Insert the lead with timeline
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
          name: formData.name,
          category: formData.category,
          acp: formData.acp,
          location: formData.location,
          area: formData.area,
          instagram_account: formData.instagram_account,
          competitor_apps_discount: formData.competitor_apps_discount,
          branches: formData.branches,
          image_url: formData.image_url,
          stage: 'Lead',
          status: 'Active',
          added_by: userEmail,
          timeline: [timelineEntry]
        })
        .select()
        .single()

      if (leadError) throw leadError

      toast.success('Lead added successfully')
      onLeadAdded()
      setIsOpen(false)
    } catch (error) {
      console.error('Error adding lead:', error)
      toast.error('Failed to add lead')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userEmail) {
      toast.error('User not authenticated')
      return
    }
    setIsLoading(true)

    try {
      const fileInput = document.getElementById('csvFile') as HTMLInputElement
      const file = fileInput?.files?.[0]
      if (!file) {
        toast.error('Please select a CSV file')
        return
      }

      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string
          const rows = text.split('\n').slice(1) // Skip header row
          
          for (const row of rows) {
            const [name, category, acp, location, area, note, instagram_account, competitor_apps_discount, branches] = row.split(',')
            
            // Create timeline entry
            const timelineEntry = {
              timestamp: new Date().toISOString(),
              description: `New lead created on ${new Date().toISOString()}\n Creator remarks: ${note?.trim() || 'No notes'}`
            }

            await createLead({
              name: name.trim(),
              category: [category.trim()],
              acp: Number(acp),
              location: location.trim(),
              area: area.trim(),
              instagram_account: instagram_account?.trim(),
              competitor_apps_discount: competitor_apps_discount?.trim(),
              branches: branches?.trim(),
              stage: LeadStage.Lead,
              status: 'Active',
              added_by: userEmail,
              timeline: [timelineEntry]
            })
          }

          toast.success('Leads added successfully')
          setIsOpen(false)
          onLeadAdded()
        } catch (error) {
          console.error('Error processing CSV:', error)
          toast.error('Failed to process CSV file')
        }
      }
      reader.readAsText(file)
    } catch (error) {
      console.error('Error reading file:', error)
      toast.error('Failed to read file')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData(prev => ({ ...prev, assigned_to: value }))
    
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
    setFormData(prev => ({ ...prev, assigned_to: email }))
    setShowEmailSuggestions(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-white text-black border border-black hover:bg-gray-50">
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-black">Add New Lead</DialogTitle>
          <DialogDescription className="text-gray-600">
            Add a single lead or bulk import leads from a CSV file.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2 border border-gray-200 bg-white">
            <TabsTrigger value="single" className="data-[state=active]:bg-black data-[state=active]:text-white border-r border-gray-200">Single Add</TabsTrigger>
            <TabsTrigger value="bulk" className="data-[state=active]:bg-black data-[state=active]:text-white">Bulk Add</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium mb-1 text-gray-700">
                    Category
                  </label>
                  <select
                    id="category"
                    required
                    className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                    value={formData.category[0] || ''}
                    onChange={(e) => setFormData({ ...formData, category: [e.target.value] })}
                  >
                    <option value="">Select a category</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Cafe">Cafe</option>
                    <option value="Salon">Salon</option>
                    <option value="Spa">Spa</option>
                    <option value="Fashion">Fashion</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="acp" className="block text-sm font-medium mb-1 text-gray-700">
                    ACP
                  </label>
                  <input
                    type="number"
                    id="acp"
                    required
                    className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                    value={formData.acp}
                    onChange={(e) => setFormData({ ...formData, acp: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium mb-1 text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    required
                    className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="area" className="block text-sm font-medium mb-1 text-gray-700">
                    Area
                  </label>
                  <input
                    type="text"
                    id="area"
                    required
                    className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="branches" className="block text-sm font-medium mb-1 text-gray-700">
                    Branches
                  </label>
                  <input
                    type="text"
                    id="branches"
                    required
                    className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                    value={formData.branches}
                    onChange={(e) => setFormData({ ...formData, branches: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="note" className="block text-sm font-medium mb-1 text-gray-700">
                  Note
                </label>
                <textarea
                  id="note"
                  className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="instagram_account" className="block text-sm font-medium mb-1 text-gray-700">
                    Instagram Account
                  </label>
                  <input
                    type="text"
                    id="instagram_account"
                    className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                    value={formData.instagram_account}
                    onChange={(e) => setFormData({ ...formData, instagram_account: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="competitor_apps_discount" className="block text-sm font-medium mb-1 text-gray-700">
                    Competitor Apps Discount
                  </label>
                  <input
                    type="text"
                    id="competitor_apps_discount"
                    className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                    value={formData.competitor_apps_discount}
                    onChange={(e) => setFormData({ ...formData, competitor_apps_discount: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="image_url" className="block text-sm font-medium mb-1 text-gray-700">
                  Outlet Photo URL
                </label>
                <input
                  type="url"
                  id="image_url"
                  className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isLoading} className="bg-white text-black border border-black hover:bg-gray-50">
                  {isLoading ? 'Adding...' : 'Add Lead'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="bulk" className="mt-4">
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <label htmlFor="csvFile" className="block text-sm font-medium mb-1 text-gray-700">
                  CSV File
                </label>
                <input
                  type="file"
                  id="csvFile"
                  accept=".csv"
                  required
                  className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2"
                />
                <p className="mt-2 text-sm text-gray-600">
                  CSV format: name,category,acp,location,area,note,instagram_account,competitor_apps_discount,branches
                  <br />
                  Categories should be semicolon-separated within the category column
                </p>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isLoading} className="bg-black text-white hover:bg-black/90">
                  {isLoading ? 'Processing...' : 'Import Leads'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 