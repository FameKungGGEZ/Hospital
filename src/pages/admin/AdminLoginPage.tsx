import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { signInWithUsername } from '../../services/authService'

function AdminLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('กรุณากรอก Username และ Password ให้ครบถ้วน')
      return
    }

    setLoading(true)
    setError('')

    try {
      await signInWithUsername(username, password)
      navigate('/nurse/admin/dashboard')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <LockKeyhole size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">เข้าสู่ระบบ</h1>
          <p className="mt-2 text-sm text-slate-500">Admin / Teacher</p>
        </div>

        <div className="space-y-5">
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-3.5 text-slate-400" size={18} />
            <Input
              aria-label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
              className="pl-10"
              error={error && !username ? 'กรุณากรอก Username' : undefined}
            />
          </div>

          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 text-slate-400" size={18} />
            <Input
              aria-label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="pl-10 pr-10"
              error={error && !password ? 'กรุณากรอก Password' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-3.5 text-slate-500"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage
