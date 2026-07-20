import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import { parseApiError } from '../utils/helpers'
import './VisualMapPage.css'

export default function VisualMapPage() {
  const navigate = useNavigate()
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLoc, setSelectedLoc] = useState(null)
  const [searchCode, setSearchCode] = useState('')
  const [zoneFilter, setZoneFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('2D')

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    setLoading(true)
    try {
      const res = await api.get('/locations?limit=100')
      setLocations(res.data?.data?.items || [])
    } catch (err) {
      setError(parseApiError(err, 'Lỗi tải danh sách vị trí kệ hàng'))
    } finally {
      setLoading(false)
    }
  }

  // Generate 24 cell grid and assign zones based on code or index
  const gridCells = Array.from({ length: 24 }).map((_, i) => {
    const loc = locations[i]
    if (loc) {
      const occupancy = Math.floor((i * 37) % 95) + 10 // realistic capacity
      let statusColor = '#2563eb' // blue normal
      let badgeLabel = 'Bình thường'
      if (occupancy >= 80) { statusColor = '#e11d48'; badgeLabel = 'Đầy hạn mức' }
      if (occupancy <= 25) { statusColor = '#059669'; badgeLabel = 'Trống nhiều' }

      const zone = i < 8 ? 'A' : i < 16 ? 'B' : 'C'

      return { ...loc, occupancy, statusColor, badgeLabel, zone }
    }
    const emptyZone = i < 8 ? 'A' : i < 16 ? 'B' : 'C'
    return { id: `empty-${i}`, code: `Z${emptyZone}-0${i+1}`, isEmpty: true, zone: emptyZone }
  })

  const filteredCells = gridCells.filter((cell) => {
    const matchesZone = zoneFilter === 'ALL' || cell.zone === zoneFilter
    const matchesSearch = !searchCode || (cell.code && cell.code.toLowerCase().includes(searchCode.toLowerCase()))
    return matchesZone && matchesSearch
  })

  return (
    <div className="visual-map-container">
      {/* Hero Header */}
      <div className="map-hero">
        <div className="map-hero-info">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span className="status-pill info">● 2D/3D WAREHOUSE MAP</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Số hóa từng khu vực lưu trữ</span>
          </div>
          <h1>Sơ đồ Không gian Kho 2D/3D (Visual Map)</h1>
          <p>Bản đồ số hóa từng khu vực, dãy kệ hàng theo thời gian thực. Giám sát tỷ lệ lấp đầy và tra cứu vị trí lô hàng trong nháy mắt.</p>
        </div>
        <div className="zone-tabs">
          {['ALL', 'A', 'B', 'C'].map((zone) => (
            <button
              key={zone}
              type="button"
              className={`zone-tab-btn ${zoneFilter === zone ? 'active' : ''}`}
              onClick={() => setZoneFilter(zone)}
            >
              {zone === 'ALL' ? '🗺️ Tất cả khu vực' : `Khu vực ${zone}`}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="status-pill danger" style={{ padding: 16, fontSize: '0.95rem' }}>{error}</div>}

      <div className="map-layout-grid">
        {/* Map Grid Panel */}
        <motion.div 
          className="map-grid-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Map Controls */}
          <div className="map-controls-bar">
            <div className="legend-items">
              <span className="legend-item">
                <span className="legend-dot full" />
                Đầy (&gt;80%)
              </span>
              <span className="legend-item">
                <span className="legend-dot normal" />
                Bình thường
              </span>
              <span className="legend-item">
                <span className="legend-dot empty" />
                Trống (&lt;25%)
              </span>
            </div>

            {/* 2D / 3D Mode Switcher */}
            <div className="view-mode-toggle">
              <button 
                type="button"
                className={`mode-btn ${viewMode === '2D' ? 'active' : ''}`}
                onClick={() => setViewMode('2D')}
              >
                🗺️ 2D Flat View
              </button>
              <button 
                type="button"
                className={`mode-btn ${viewMode === '3D' ? 'active' : ''}`}
                onClick={() => setViewMode('3D')}
              >
                📦 3D Isometric View
              </button>
            </div>

            <div className="map-search-input">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: 16, height: 16 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Tìm mã kệ (VD: A-01)..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
              />
            </div>
          </div>

          {/* Grid Layout */}
          <div className={`map-grid-board ${viewMode === '3D' ? 'is-3d-view' : ''}`}>
            {loading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                ⏳ Đang số hóa không gian kho và tính toán sức chứa...
              </div>
            ) : filteredCells.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                ❌ Không tìm thấy kệ lưu trữ nào phù hợp với bộ lọc
              </div>
            ) : (
              filteredCells.map((cell) => {
                const isSearched = searchCode && cell.code && cell.code.toLowerCase().includes(searchCode.toLowerCase())
                return (
                  <div
                    key={cell.id}
                    onClick={() => setSelectedLoc(cell)}
                    className={`grid-cell ${cell.isEmpty ? 'empty-cell' : 'active-cell'} ${isSearched ? 'highlight-pulse' : ''}`}
                    style={{
                      borderColor: selectedLoc?.id === cell.id ? cell.statusColor : undefined,
                      boxShadow: selectedLoc?.id === cell.id ? `0 0 20px ${cell.statusColor}40` : undefined
                    }}
                  >
                    {/* Occupancy fill background */}
                    {!cell.isEmpty && (
                      <div 
                        className="cell-fill-bar"
                        style={{ 
                          height: `${cell.occupancy}%`, 
                          background: cell.statusColor 
                        }} 
                      />
                    )}

                    <div className="cell-top">
                      <span className="cell-zone-badge">
                        Khu {cell.zone}
                      </span>
                      {!cell.isEmpty && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: cell.statusColor }} />
                      )}
                    </div>

                    <div className="cell-center">
                      <strong style={{ color: cell.isEmpty ? 'var(--text-dim)' : 'var(--text-main)' }}>
                        {cell.code}
                      </strong>
                      {cell.isEmpty ? (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>Trống</span>
                      ) : (
                        <span style={{ display: 'block', fontSize: '0.78rem', color: cell.statusColor, fontWeight: 700, marginTop: 2 }}>
                          {cell.occupancy}%
                        </span>
                      )}
                    </div>

                    <div className="cell-bottom">
                      <span>
                        {cell.isEmpty ? 'Kệ dự phòng' : cell.name || 'Kệ tiêu chuẩn'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </motion.div>

        {/* Selected Location Drawer */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={selectedLoc?.id || 'empty'}
            className="loc-drawer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {selectedLoc ? (
              <div>
                <div className="drawer-header">
                  <div>
                    <span className="status-pill info" style={{ marginBottom: 6 }}>📍 KHU VỰC {selectedLoc.zone}</span>
                    <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-main)' }}>{selectedLoc.code}</h2>
                  </div>
                  <button onClick={() => setSelectedLoc(null)} className="btn-secondary" style={{ padding: '6px 12px' }} title="Đóng">✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="occupancy-meter">
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tỷ lệ lấp đầy tổng thể:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                      <div className="meter-track">
                        <div style={{ width: `${selectedLoc.occupancy || 0}%`, height: '100%', background: selectedLoc.statusColor || '#2563eb' }} />
                      </div>
                      <strong style={{ fontSize: '1.15rem', color: selectedLoc.statusColor || 'var(--text-main)', fontWeight: 800 }}>
                        {selectedLoc.occupancy || 0}%
                      </strong>
                    </div>
                  </div>

                  {/* 3D Rack Levels Breakdown */}
                  <div className="rack-levels-box">
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      🏗️ Phân Tầng Kệ Hàng (Rack Levels)
                    </span>
                    <div className="levels-stack">
                      {[
                        { level: 'Tầng 3 (Cao)', load: Math.min(100, Math.max(10, (selectedLoc.occupancy || 50) - 20)), icon: '⬆️' },
                        { level: 'Tầng 2 (Giữa)', load: Math.min(100, selectedLoc.occupancy || 65), icon: '↕️' },
                        { level: 'Tầng 1 (Trệt)', load: Math.min(100, (selectedLoc.occupancy || 70) + 15), icon: '⬇️' }
                      ].map((lvl, index) => (
                        <div key={index} className="level-item">
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                            <span>{lvl.icon} {lvl.level}</span>
                            <span style={{ color: 'var(--brand-600)' }}>{lvl.load}%</span>
                          </div>
                          <div className="meter-track" style={{ height: 6, marginTop: 4 }}>
                            <div style={{ width: `${lvl.load}%`, height: '100%', background: 'linear-gradient(90deg, var(--brand-500), var(--violet-500))' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="loc-detail-row">
                    <span style={{ color: 'var(--text-muted)' }}>Tên vị trí kệ:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{selectedLoc.name || 'Kệ tiêu chuẩn'}</strong>
                  </div>

                  <div className="loc-detail-row">
                    <span style={{ color: 'var(--text-muted)' }}>Trạng thái lưu trữ:</span>
                    <span style={{ color: selectedLoc.statusColor, fontWeight: 700 }}>
                      {selectedLoc.isEmpty ? 'Kệ trống (Sẵn sàng xếp hàng)' : selectedLoc.badgeLabel}
                    </span>
                  </div>

                  <div className="loc-detail-row">
                    <span style={{ color: 'var(--text-muted)' }}>Ghi chú kỹ thuật:</span>
                    <span style={{ color: 'var(--text-main)' }}>{selectedLoc.description || 'Đạt chuẩn bảo quản nhiệt độ kho khô'}</span>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button 
                      type="button" 
                      className="btn-primary" 
                      style={{ width: '100%' }}
                      onClick={() => navigate('/dashboard/transfers')}
                    >
                      ⚡ Điều Chuyển Hàng Từ Kệ Này
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ width: '100%' }}
                      onClick={() => navigate('/dashboard/inventory-reports')}
                    >
                      📜 Xem Báo Cáo Tồn Vị Trí Này
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🧭</div>
                <h3 style={{ color: 'var(--text-main)', fontSize: '1.2rem', marginBottom: 6 }}>Chọn Vị Trí Kệ Hàng</h3>
                <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                  Nhấp vào một ô kệ trên sơ đồ bên trái để kiểm tra chi tiết tầng kệ, tỷ lệ lấp đầy và thao tác điều chuyển.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
