import { createClient } from '@/lib/supabase'
import { Lead } from '@/types'

const supabase = createClient()

export async function getLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .insert([{
      ...lead,
      added_by: lead.added_by
    }])
    .select()
    .single()

  if (error) throw error
  return {
    ...data,
    added_by: data.added_by
  }
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .update({
      ...updates,
      added_by: updates.added_by
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return {
    ...data,
    added_by: data.added_by
  }
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id)

  if (error) throw error
} 