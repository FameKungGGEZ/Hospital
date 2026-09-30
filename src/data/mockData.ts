import type { NoteOption, ServiceRecord, Student, SymptomOption } from '../types'

export const studentDirectory: Student[] = []

export const symptomOptions: SymptomOption[] = [
  { id: 'headache_fever', label: 'ปวดหัว/เป็นไข้', type: 'neutral' },
  { id: 'menstrual_pain', label: 'ปวดรอบเดือน', type: 'neutral' },
  { id: 'stomach_pain', label: 'ปวดท้อง/แสบร้อน', type: 'neutral' },
  { id: 'bloating', label: 'ปวดท้องอืดเฟ้อ', type: 'neutral' },
  { id: 'diarrhea', label: 'ท้องเสีย', type: 'neutral' },
  { id: 'nausea_vomit', label: 'คลื่นไส้/อาเจียน', type: 'neutral' },
  { id: 'runny_nose', label: 'น้ำมูก/แพ้อากาศ', type: 'neutral' },
  { id: 'cough_phlegm', label: 'แก้ไอเสมหะ', type: 'neutral' },
  { id: 'allergic_rash', label: 'แพ้ผื่นคัน/แมลงต่อย', type: 'neutral' },
  { id: 'massage_cool', label: 'ปวดนวด/ประคบ', type: 'neutral' },
  { id: 'eye_rinse', label: 'ล้างตา/ตาแดง', type: 'neutral' },
  { id: 'insect_bite', label: 'แมลงกัดต่อย', type: 'neutral' },
  { id: 'wound_care', label: 'ทำแผล', type: 'neutral' },
]

export const noteOptions: NoteOption[] = [
  { id: 'rest', label: 'นอนพัก', tone: 'rest' },
  { id: 'go_home', label: 'กลับบ้าน', tone: 'neutral' },
  { id: 'accident', label: 'อุบัติเหตุ', tone: 'accident' },
  { id: 'send_hospital', label: 'ส่ง รพ.', tone: 'neutral' },
  { id: 'return_class', label: 'กลับห้องเรียน', tone: 'neutral' },
  { id: 'other', label: 'อื่นๆ', tone: 'neutral' },
]

export const serviceRecords: ServiceRecord[] = []
