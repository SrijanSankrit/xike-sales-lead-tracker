import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { UserRole } from '@/types'
import toast from 'react-hot-toast'

export function useUserRole() {
  const [role, setRole] = useState<UserRole>('read')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.log('No user found')
          return
        }

        // First try to get existing role
        const { data: roleData, error: fetchError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // No role found, create a default role for new user
            console.log('Creating new role for user:', user.email)
            const { data: newRole, error: insertError } = await supabase
              .from('user_roles')
              .insert([
                {
                  user_id: user.id,
                  email: user.email,
                  role: 'read' as UserRole,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ])
              .select()
              .single()

            if (insertError) {
              console.error('Error creating new role:', insertError)
              toast.error('Failed to create user role')
              throw insertError
            }

            if (newRole) {
              console.log('Successfully created new role:', newRole)
              setRole(newRole.role)
              toast.success('Welcome! You have been granted read access.')
            }
          } else {
            console.error('Error fetching role:', fetchError)
            toast.error('Failed to fetch user role')
            throw fetchError
          }
        } else if (roleData) {
          console.log('Found existing role:', roleData)
          setRole(roleData.role)
        }
      } catch (error) {
        console.error('Error in getUserRole:', error)
        toast.error('Error setting up user role')
      } finally {
        setLoading(false)
      }
    }

    getUserRole()
  }, [supabase.auth])

  return {
    role,
    loading,
    canWrite: role === 'write' || role === 'admin',
    isAdmin: role === 'admin'
  }
} 