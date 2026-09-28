import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export type StaffProfile = {
  id: string
  username: string
  display_name: string
  role: 'admin' | 'staff'
  active: boolean
}

export async function signInWithUsername(username: string, password: string): Promise<StaffProfile> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('ยังไม่ได้เชื่อมต่อ Supabase')
  }

  const { data, error } = await supabase.functions.invoke<{ access_token: string; refresh_token: string }>(
    'username-login',
    { body: { username: username.trim(), password } },
  )

  if (error || !data?.access_token || !data.refresh_token) {
    throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  })

  if (sessionError || !sessionData.user) {
    throw new Error('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่')
  }

  const profile = await getProfileForUser(sessionData.user)
  if (!profile?.active) {
    await supabase.auth.signOut()
    throw new Error('บัญชีนี้ยังไม่ได้รับสิทธิ์เข้าใช้งาน')
  }

  return profile
}

export async function getActiveStaffProfile(): Promise<StaffProfile | null> {
  if (!supabase || !isSupabaseConfigured) return null

  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.user) return null
  const profile = await getProfileForUser(data.session.user)
  return profile?.active ? profile : null
}

async function getProfileForUser(user: User): Promise<StaffProfile | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('users')
    .select('id, username, display_name, role, active')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data || (data.role !== 'admin' && data.role !== 'staff')) return null
  return data as StaffProfile
}

export async function signOutStaff(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}