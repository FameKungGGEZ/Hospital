# API Contract Draft

## 1. Authentication

Admin sign-in uses Supabase Auth `signInWithPassword` with the configured staff email and password. Do not implement credential checking in the frontend or store plaintext passwords in the `users` table. After sign-in, read the caller's `users` profile; inactive profiles must be denied access. The JWT authenticates admin requests, while RLS enforces staff/admin permissions.

## 2. Public Student Flow

### POST /functions/v1/student-lookup
Request:
```json
{
  "student_id": "30003"
}
```

Response:
```json
{
  "student": {
    "student_id": "30003",
    "student_name": "ธนพัฒน์",
    "surname": "ธูปคำ",
    "sex": "ชาย",
    "class_name": "ม.6/4",
    "academic_year": "2568"
  }
}
```

The function returns only the fields required for on-screen identity confirmation. This response is not an authorization token; the submit function must look up and validate the student again.

### POST /functions/v1/service-submit
Request:
```json
{
  "student_id": "30003",
  "item_codes": [
    "headache_fever",
    "runny_nose",
    "rest"
  ],
  "other_detail": null
}
```

Response:
```json
{
  "record_id": 1024,
  "service_datetime": "2026-09-28T13:25:42Z",
  "student_id": "30003",
  "selected_items": [
    "headache_fever",
    "runny_nose",
    "rest"
  ]
}
```

The Edge Function validates the request and calls `public.create_service_record` using a server-side Supabase client. That database function validates active student status, active item codes, duplicate selections, and the required `other_detail`, then inserts the visit and items atomically. Never send the service-role key to the browser.

## 3. Admin Dashboard

### GET /api/admin/dashboard
Response:
```json
{
  "today_total": 6,
  "male_total": 3,
  "female_total": 3,
  "month_total": 128,
  "frequent_symptoms": [
    { "label": "ปวดหัว/เป็นไข้", "count": 72 },
    { "label": "ท้องเสีย", "count": 46 }
  ],
  "recent_activity": [
    {
      "time": "10:42",
      "student_id": "30003",
      "name": "ธนพัฒน์",
      "surname": "ธูปคำ",
      "class_name": "ม.6/4",
      "selected_items": ["ปวดหัว/เป็นไข้", "นอนพัก"]
    }
  ]
}
```

## 4. Admin Students

### GET /api/admin/students?search=&class=&sex=&page=1&limit=20
Response:
```json
{
  "items": [
    {
      "number": 1,
      "student_id": "30003",
      "name": "ธนพัฒน์",
      "surname": "ธูปคำ",
      "sex": "ชาย",
      "class_name": "ม.6/4",
      "academic_year": "2568",
      "status": "ปกติ"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

## 5. History

### GET /api/admin/history
Query params:
- date_from
- date_to
- student_id
- class
- sex
- symptom
- note

Response:
```json
{
  "items": [
    {
      "date": "2026-09-28",
      "time": "13:25",
      "student_id": "30003",
      "name": "ธนพัฒน์",
      "surname": "ธูปคำ",
      "class_name": "ม.6/4",
      "selected_items": ["ปวดหัว/เป็นไข้", "น้ำมูก/แพ้อากาศ", "นอนพัก"]
    }
  ]
}
```

## 6. Import Preview

### POST /api/admin/import/preview
Request: multipart/form-data with file

Response:
```json
{
  "total_rows": 1248,
  "new_count": 1180,
  "duplicate_same_count": 60,
  "duplicate_changed_count": 6,
  "invalid_count": 2,
  "rows": [
    {
      "row_number": 1,
      "student_id": "30009",
      "status": "NEW",
      "data": {
        "number": 9,
        "sex": "ชาย",
        "name": "ภูริช",
        "surname": "ทองคำ",
        "class": "ม.4/1"
      }
    },
    {
      "row_number": 2,
      "student_id": "30003",
      "status": "DUPLICATE_CHANGED",
      "data": {
        "number": 3,
        "sex": "ชาย",
        "name": "ธนพัฒน์",
        "surname": "ธูปคำ",
        "class": "ม.6/5"
      },
      "diff": {
        "class": {
          "old": "ม.6/4",
          "new": "ม.6/5"
        }
      }
    }
  ]
}
```

### POST /api/admin/import/confirm
Request:
```json
{
  "confirmed_rows": [
    {
      "row_number": 1,
      "action": "import",
      "student_id": "30009"
    },
    {
      "row_number": 2,
      "action": "use_new",
      "student_id": "30003"
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "imported_count": 2,
  "message": "Import completed successfully"
}
```

## 7. Export Records

### GET /api/admin/export/records?from=2026-08-01&to=2026-09-30
Response:
```json
{
  "rows": [
    {
      "sequence": 1,
      "date": "2026-09-28",
      "time": "13:25",
      "male": true,
      "female": false,
      "full_name": "ธนพัฒน์ ธูปคำ",
      "class_name": "ม.6/4",
      "symptom_flags": {
        "headache_fever": true,
        "runny_nose": true,
        "stomach_pain": false
      },
      "note_flags": {
        "rest": true,
        "go_home": false,
        "accident": false,
        "send_hospital": false,
        "other": false
      }
    }
  ],
  "summary": {
    "total_records": 10,
    "male": 6,
    "female": 4,
    "symptoms": {
      "headache_fever": 5,
      "runny_nose": 2
    },
    "notes": {
      "rest": 3,
      "go_home": 2,
      "accident": 0,
      "send_hospital": 1,
      "other": 0
    }
  }
}
```

## 8. Report

### GET /api/admin/report?academic_year=2568&semester=1&start_month=8&end_month=9
Response:
```json
{
  "total_users": 248,
  "male": 126,
  "female": 122,
  "symptom_summary": [
    { "name": "ปวดหัว/เป็นไข้", "count": 80 },
    { "name": "ท้องเสีย", "count": 25 }
  ],
  "note_summary": [
    { "name": "นอนพัก", "count": 40 },
    { "name": "กลับบ้าน", "count": 55 }
  ],
  "monthly_summary": [
    { "month": "2026-08", "count": 100 },
    { "month": "2026-09", "count": 148 }
  ]
}
```

## 9. Security Notes

- Public student lookup and service submission are Edge Functions; the anon role has no direct application-table grants.
- Rate-limit public lookup/submission by IP and student ID, return generic not-found errors, and avoid logging submitted health details.
- Admin operations require a valid Supabase Auth session and active `users` profile.
- RLS policies restrict data by staff/admin role; service-role credentials stay server-side only.
- Student list should not be exposed publicly.
- Use file extension and MIME validation for uploads.

## 10. Implementation Notes

- Prefer server-side validation before DB insert.
- Use transactions for imports and batch logic.
- Use SQL aggregate queries for report generation.
- Recompute statistics from raw records whenever possible.
- The `/api/admin/*` routes above describe logical admin operations. They can be implemented as authenticated Supabase queries/RPCs or server-side Edge Functions; they are not deployed endpoints yet.
