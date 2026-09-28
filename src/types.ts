export type Sex = 'ชาย' | 'หญิง'

export type Student = {
  student_id: string
  number: number
  name: string
  surname: string
  sex: Sex
  class_name: string
  academic_year: string
  status: 'ปกติ' | 'ติดตาม' | 'ลาพัก'
}

export type SymptomOption = {
  id: string
  label: string
  type: 'neutral'
}

export type NoteOption = {
  id: string
  label: string
  tone: 'neutral' | 'rest' | 'accident'
}

export type ServiceRecord = {
  id: number
  service_datetime: string
  student_id: string
  selected_items: string[]
}

export type AdminUser = {
  username: string
  password: string
  displayName: string
}
