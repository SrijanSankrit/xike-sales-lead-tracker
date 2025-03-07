export type UserRole = 'admin' | 'write' | 'read'

export type LeadStage = 'Lead' | 'To Pitch' | 'Pitched'

export interface Lead {
  id: string
  name: string
  category: string[]
  image_url?: string
  acp: number
  location: string
  area: string
  note?: string
  instagram_account?: string
  competitor_apps_discount?: string
  branches: string
  stage: LeadStage
  status: string
  created_at: string
  updated_at: string
  spoc_name?: string
  spoc_number?: string
  spoc_designation?: string
  response_rating?: number
  next_approach_date?: string
  number_of_attempts?: number
  created_by: string
  approved_by?: string
  approved_at?: string
}

export interface UserRoleData {
  id: string
  user_id: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
} 