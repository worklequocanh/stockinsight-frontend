import { useState } from 'react'
import api from '../services/api'
import { parseApiError } from '../utils/helpers'
import { translateRole } from '../utils/translations'
import { useAuth } from '../context/AuthContext'
import './ProfilePage.css'

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
      setProfileMsg('✅ Cập nhật hồ sơ cá nhân thành công!')
    } catch (err) {
      setProfileMsg(parseApiError(err, 'Lỗi khi cập nhật hồ sơ'))
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPwMsg('⚠️ Mật khẩu xác nhận không khớp với mật khẩu mới')
      setPwError(true)
      return
    }
    if (newPassword.length < 6) {
      setPwMsg('⚠️ Mật khẩu mới phải có ít nhất 6 ký tự bảo mật')
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
      setPwMsg('🎉 Đổi mật khẩu bảo mật thành công! Sử dụng mật khẩu mới cho lần đăng nhập tiếp theo.')
      setPwError(false)
    } catch (err) {
      setPwMsg(parseApiError(err, 'Lỗi khi đổi mật khẩu'))
      setPwError(true)
    } finally {
      setSavingPw(false)
    }
  }

  const roleBadgeClass = user?.role === 'ADMIN' ? 'danger' : user?.role === 'WAREHOUSE_MANAGER' ? 'info' : 'success'

  return (
    <div className="profile-container">
      {/* Hero Header */}
      <div className="profile-hero">
        <div className="profile-hero-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span className="status-pill info">● IDENTITY & CREDENTIALS</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Thiết lập bảo mật tài khoản cá nhân</span>
          </div>
          <h1>Hồ Sơ Cá Nhân & Cài Đặt Bảo Mật (User Profile & Security)</h1>
          <p>Quản lý định danh tài khoản, cập nhật tên hiển thị, theo dõi quyền hạn hệ thống đang sở hữu và thay đổi định kỳ mật khẩu đăng nhập bảo mật.</p>
        </div>
        <div>
          <span className={`status-pill ${roleBadgeClass}`} style={{ fontSize: '0.9rem', padding: '10px 20px', fontWeight: 800 }}>
            👤 {user ? translateRole(user.role) : 'Tài Khoản'}
          </span>
        </div>
      </div>

      <div className="profile-cards-grid">
        {/* Profile Card */}
        <div className="profile-card">
          <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="profile-avatar-hero">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <span className="status-pill info" style={{ marginBottom: 4 }}>📝 THÔNG TIN ĐỊNH DANH</span>
              <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#fff' }}>Chỉnh Sửa Hồ Sơ</h2>
            </div>
          </div>

          {profileMsg && (
            <div className={`status-pill ${profileMsg.includes('thành công') ? 'success' : 'danger'}`} style={{ padding: 14, fontSize: '0.9rem', marginBottom: 20, display: 'block' }}>
              {profileMsg}
            </div>
          )}

          <form className="form-grid" onSubmit={handleUpdateProfile}>
            <div className="form-group full-width">
              <label>Tên hiển thị trên hệ thống *</label>
              <input
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Nhập họ tên của bạn..."
              />
            </div>

            <div className="form-group full-width">
              <label>Địa chỉ Email (Đăng nhập) </label>
              <input
                className="input-field"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed', background: 'rgba(0,0,0,0.4)' }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>🔒 Email định danh không thể tự do thay đổi.</span>
            </div>

            <div className="form-group full-width">
              <label>Quyền hạn thao tác (IAM Role)</label>
              <input
                className="input-field"
                value={translateRole(user?.role) || ''}
                disabled
                style={{ opacity: 0.5, cursor: 'not-allowed', background: 'rgba(0,0,0,0.4)' }}
              />
            </div>

            <div className="form-group full-width" style={{ marginTop: 12 }}>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px 20px', fontSize: '1rem' }} disabled={savingProfile}>
                {savingProfile ? '⏳ Đang lưu thay đổi...' : '💾 Cập Nhật Thông Tin Hồ Sơ'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="profile-card">
          <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: 16, marginBottom: 24 }}>
            <span className="status-pill warning" style={{ marginBottom: 6 }}>🔐 BẢO MẬT TÀI KHOẢN</span>
            <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#fff' }}>Thay Đổi Mật Khẩu</h2>
          </div>

          {pwMsg && (
            <div className={`status-pill ${pwError ? 'danger' : 'success'}`} style={{ padding: 14, fontSize: '0.9rem', marginBottom: 20, display: 'block' }}>
              {pwMsg}
            </div>
          )}

          <form className="form-grid" onSubmit={handleChangePassword}>
            <div className="form-group full-width">
              <label>Mật khẩu hiện tại *</label>
              <input
                type="password"
                className="input-field"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                placeholder="Nhập mật khẩu bạn đang dùng..."
              />
            </div>

            <div className="form-group full-width">
              <label>Mật khẩu mới (Tối thiểu 6 ký tự) *</label>
              <input
                type="password"
                className="input-field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Nhập mật khẩu mới bảo mật..."
              />
            </div>

            <div className="form-group full-width">
              <label>Xác nhận lại mật khẩu mới *</label>
              <input
                type="password"
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Nhập lại chính xác mật khẩu mới..."
              />
            </div>

            <div className="form-group full-width" style={{ marginTop: 12 }}>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px 20px', fontSize: '1rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }} disabled={savingPw}>
                {savingPw ? '⏳ Đang đổi mật khẩu...' : '🔑 Xác Nhận Đổi Mật Khẩu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
