import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import { parseApiError } from '../utils/helpers'
import './VisualMapPage.css'

export default function VisualMapPage() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLoc, setSelectedLoc] = useState(null)
  const [searchCode, setSearchCode] = useState('')
  const [zoneFilter, setZoneFilter] = useState('ALL')

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
      const occupancy = Math.floor((i * 37) % 95) + 10 // realistic simulated capacity
      let statusColor = '#38bdf8' // blue normal
      let badgeLabel = 'Bình thường'
      if (occupancy >= 80) { statusColor = '#fb7185'; badgeLabel = 'Đầy hạn mức' }
      if (occupancy <= 25) { statusColor = '#34d399'; badgeLabel = 'Trống nhiều' }

      // Assign fake zones A, B, C for demo categorization
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
          <div className="map-grid-board">
            {loading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                ⏳ Đang số hóa không gian kho và tính toán sức chứa...
              </div>
            ) : filteredCells.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                ❌ Không tìm thấy kệ lưu trữ nào phù hợp với bộ lọc
              </div>
            ) : (
              filteredCells.map((cell) => (
                <div
                  key={cell.id}
                  onClick={() => setSelectedLoc(cell)}
                  className={`grid-cell ${cell.isEmpty ? 'empty-cell' : 'active-cell'}`}
                  style={{
                    borderColor: selectedLoc?.id === cell.id ? cell.statusColor : undefined,
                    boxShadow: selectedLoc?.id === cell.id ? `0 0 25px ${cell.statusColor}50` : undefined
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
                    <strong style={{ color: cell.isEmpty ? 'var(--text-dim)' : '#ffffff' }}>
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
              ))
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
                    <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>{selectedLoc.code}</h2>
                  </div>
                  <button onClick={() => setSelectedLoc(null)} className="btn-secondary" style={{ padding: '6px 12px' }} title="Đóng">✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="occupancy-meter">
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tỷ lệ lấp đầy (Sức chứa hiện tại):</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                      <div className="meter-track">
                        <div style={{ width: `${selectedLoc.occupancy || 0}%`, height: '100%', background: selectedLoc.statusColor || '#38bdf8' }} />
                      </div>
                      <strong style={{ fontSize: '1.15rem', color: selectedLoc.statusColor || '#fff', fontWeight: 800 }}>
                        {selectedLoc.occupancy || 0}%
                      </strong>
                    </div>
                  </div>

                  <div className="loc-detail-row">
                    <span style={{ color: 'var(--text-muted)' }}>Tên vị trí kệ:</span>
                    <strong style={{ color: '#fff' }}>{selectedLoc.name || 'Chưa đặt tên'}</strong>
                  </div>

                  <div className="loc-detail-row">
                    <span style={{ color: 'var(--text-muted)' }}>Trạng thái lưu trữ:</span>
                    <span style={{ color: selectedLoc.statusColor, fontWeight: 700 }}>
                      {selectedLoc.isEmpty ? 'Kệ trống (Sẵn sàng xếp hàng)' : selectedLoc.badgeLabel}
                    </span>
                  </div>

                  <div className="loc-detail-row">
                    <span style={{ color: 'var(--text-muted)' }}>Ghi chú kỹ thuật:</span>
                    <span style={{ color: 'var(--text-main)' }}>{selectedLoc.description || 'Đạt chuẩn bảo quản nhiệt độ khô'}</span>
                  </div>

                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button type="button" className="btn-primary" style={{ width: '100%' }}>
                      🔍 Tra cứu Lô hàng & SKU tại Kệ này
                    </button>
                    <button type="button" className="btn-secondary" style={{ width: '100%' }}>
                      ⚙️ Điều chỉnh định mức & cấu hình kệ
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🧭</div>
                <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: 6 }}>Chọn Vị Trí Kệ Hàng</h3>
                <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                  Nhấp vào một ô kệ trên sơ đồ bên trái để kiểm tra chi tiết lô hàng đang lưu trữ, tỷ lệ lấp đầy và thông số kỹ thuật.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
