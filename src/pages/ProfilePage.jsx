import { useState } from 'react'
import api from '../services/api'
import { parseApiError } from '../utils/helpers'
import { translateRole } from '../utils/translations'
import { useAuth } from '../context/AuthContext'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()

  const [name, setName] = useState(user?.name || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState(false)

  async function handleUpdateProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMsg('')
    try {
      const res = await api.put('/auth/profile', { name })
      updateUser(res.data?.user || { ...user, name })
      setProfileMsg('Cập nhật hồ sơ thành công!')
    } catch (err) {
      setProfileMsg(parseApiError(err, 'Lỗi khi cập nhật hồ sơ'))
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPwMsg('Mật khẩu xác nhận không khớp')
      setPwError(true)
      return
    }
    if (newPassword.length < 6) {
      setPwMsg('Mật khẩu mới phải có ít nhất 6 ký tự')
      setPwError(true)
      return
    }
    setSavingPw(true)
    setPwMsg('')
    setPwError(false)
    try {
      await api.put('/auth/change-password', { oldPassword, newPassword })
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPwMsg('Đổi mật khẩu thành công!')
      setPwError(false)
    } catch (err) {
      setPwMsg(parseApiError(err, 'Lỗi khi đổi mật khẩu'))
      setPwError(true)
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Hồ sơ cá nhân</h1>
        <p className="hero-copy">Quản lý thông tin tài khoản của bạn</p>
      </div>

      <div className="resource-layout">
        <section className="resource-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">Thông tin</p>
              <h2>Chỉnh sửa hồ sơ</h2>
            </div>
          </div>

          {profileMsg && (
            <p className={profileMsg.includes('thành công') ? 'success-banner' : 'error-banner'}>{profileMsg}</p>
          )}

          <form className="resource-form" onSubmit={handleUpdateProfile}>
            <label>
              Tên hiển thị
              <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Email
              <input className="field-input" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
            </label>
            <label>
              Vai trò
              <input className="field-input" value={translateRole(user?.role) || ''} disabled style={{ opacity: 0.5 }} />
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={savingProfile}>
                {savingProfile ? 'Đang lưu...' : 'Cập nhật hồ sơ'}
              </button>
            </div>
          </form>
        </section>

        <section className="resource-panel">
          <div className="resource-header">
            <div>
              <p className="section-label">Bảo mật</p>
              <h2>Đổi mật khẩu</h2>
            </div>
          </div>

          {pwMsg && (
            <p className={pwError ? 'error-banner' : 'success-banner'}>{pwMsg}</p>
          )}

          <form className="resource-form" onSubmit={handleChangePassword}>
            <label>
              Mật khẩu hiện tại
              <input type="password" className="field-input" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
            </label>
            <label>
              Mật khẩu mới
              <input type="password" className="field-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="Tối thiểu 6 ký tự" />
            </label>
            <label>
              Xác nhận mật khẩu mới
              <input type="password" className="field-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={savingPw}>
                {savingPw ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
