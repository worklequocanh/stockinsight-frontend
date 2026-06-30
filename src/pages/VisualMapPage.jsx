import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'
import { parseApiError } from '../utils/helpers'

export default function VisualMapPage() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLoc, setSelectedLoc] = useState(null)

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const res = await api.get('/locations?limit=100')
      setLocations(res.data?.data?.items || [])
    } catch (err) {
      setError(parseApiError(err, 'Lỗi tải danh sách vị trí'))
    } finally {
      setLoading(false)
    }
  }

  // Generate grid cells based on locations (or placeholders if not enough)
  const gridCells = Array.from({ length: 24 }).map((_, i) => {
    const loc = locations[i]
    if (loc) {
      // Simulate occupancy for demo purposes
      const occupancy = Math.floor(Math.random() * 100)
      let statusColor = '#3b82f6' // blue (normal)
      if (occupancy > 80) statusColor = '#ef4444' // red (full)
      if (occupancy < 20) statusColor = '#10b981' // green (empty)

      return { ...loc, occupancy, statusColor }
    }
    return { id: `empty-${i}`, isEmpty: true }
  })

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Sơ đồ kho (Visual Map)</h1>
        <p className="hero-copy">Quản lý và giám sát không gian lưu trữ theo thời gian thực</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(300px, 1fr)', gap: '24px' }}>
        <motion.div 
          className="glass-panel" 
          style={{ padding: '24px', borderRadius: '24px' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{width: 12, height: 12, background: '#ef4444', borderRadius: '50%'}}></div> Đầy (&gt;80%)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{width: 12, height: 12, background: '#3b82f6', borderRadius: '50%'}}></div> Bình thường</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{width: 12, height: 12, background: '#10b981', borderRadius: '50%'}}></div> Trống (&lt;20%)</span>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
            gap: '12px',
            backgroundColor: 'rgba(2, 8, 23, 0.5)',
            padding: '20px',
            borderRadius: '16px',
            border: '1px dashed rgba(148, 163, 184, 0.2)'
          }}>
            {loading ? (
              <p>Đang tải bản đồ...</p>
            ) : (
              gridCells.map((cell) => (
                <motion.div
                  key={cell.id}
                  whileHover={!cell.isEmpty ? { scale: 1.05, borderColor: cell.statusColor } : {}}
                  onClick={() => !cell.isEmpty && setSelectedLoc(cell)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '12px',
                    border: `2px solid ${cell.isEmpty ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.3)'}`,
                    background: cell.isEmpty ? 'transparent' : 'rgba(15, 23, 42, 0.8)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: cell.isEmpty ? 'default' : 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {!cell.isEmpty && (
                    <>
                      <div style={{ 
                        position: 'absolute', bottom: 0, left: 0, width: '100%', 
                        height: `${cell.occupancy}%`, background: cell.statusColor, opacity: 0.2 
                      }}></div>
                      <strong style={{ fontSize: '1.2rem', color: '#f8fafc', zIndex: 1 }}>{cell.code}</strong>
                      <span style={{ fontSize: '0.75rem', color: cell.statusColor, zIndex: 1, marginTop: '4px', fontWeight: 'bold' }}>
                        {cell.occupancy}%
                      </span>
                    </>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div 
          className="glass-card" 
          style={{ padding: '24px', borderRadius: '24px', height: 'fit-content' }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {selectedLoc ? (
            <div>
              <h2 style={{ margin: '0 0 16px', color: '#7dd3fc' }}>Chi tiết vị trí</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Mã vị trí:</span>
                  <strong>{selectedLoc.code}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Tên vị trí:</span>
                  <strong>{selectedLoc.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Mô tả:</span>
                  <span>{selectedLoc.description || 'Không có'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                  <span style={{ color: '#94a3b8' }}>Sức chứa:</span>
                  <span style={{ color: selectedLoc.statusColor, fontWeight: 'bold' }}>{selectedLoc.occupancy}%</span>
                </div>
                
                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>
                    💡 <em>Đang hiển thị dữ liệu mô phỏng cho sức chứa. Trong thực tế, dữ liệu này sẽ được tính toán dựa trên tổng số lượng lô hàng (StockBatch) tồn tại trong vị trí này.</em>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>
              <span style={{ fontSize: '3rem' }}>🎯</span>
              <p>Nhấp vào một ô trên bản đồ để xem chi tiết vị trí</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
