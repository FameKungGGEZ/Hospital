import { serviceRecords, studentDirectory } from '../data/mockData'
import type { ServiceRecord, Student } from '../types'

const STUDENTS_KEY = 'hospital.students.v2'
const SERVICE_RECORDS_KEY = 'hospital.service-records.v2'

function readStoredArray<T>(key: string, fallback: T[]): T[] {
  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return fallback

    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? (parsed as T[]) : fallback
  } catch {
    return fallback
  }
}

export const getStudentDirectory = (): Student[] =>
  readStoredArray(STUDENTS_KEY, studentDirectory)

export const saveStudentDirectory = (students: Student[]): void => {
  window.localStorage.setItem(STUDENTS_KEY, JSON.stringify(students))
}

export const getServiceRecords = (): ServiceRecord[] =>
  readStoredArray(SERVICE_RECORDS_KEY, serviceRecords)

export const saveServiceRecords = (records: ServiceRecord[]): void => {
  window.localStorage.setItem(SERVICE_RECORDS_KEY, JSON.stringify(records))
}