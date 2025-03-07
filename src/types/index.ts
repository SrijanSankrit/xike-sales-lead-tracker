export enum UserRole {
  Admin = 'admin',
  Write = 'write',
  Read = 'read'
}

export enum LeadStage {
  Lead = 'Lead',
  ToPitch = 'To Pitch',
  Pitched = 'Pitched',
  Onboarded = 'Onboarded'
}

export enum LeadStatus {
  Active = 'Active',
  Onboarded = 'Onboarded',
  Failed = 'Failed'
}

export interface TimelineEntry {
  timestamp: string
  description: string,
  next_approach_date?: string
  is_converted?: boolean
}

export interface Lead {
  id: string
  name: string
  category: string[]
  acp: number
  location: string
  area: string
  instagram_account?: string
  competitor_apps_discount?: string
  branches?: string
  image_url?: string
  stage: LeadStage
  status: 'Active' | 'Inactive'
  added_by: string
  assigned_to?: string
  approved_by?: string
  response_rating?: number
  timeline: TimelineEntry[]
  created_at: string
  updated_at: string
}

export interface UserRoleData {
  id: string
  user_id: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
} 