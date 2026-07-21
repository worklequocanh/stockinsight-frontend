import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const COMMANDS = [
  { id: 'dashboard', icon: '📊', name: 'Đến trang Tổng quan', path: '/dashboard' },
  { id: 'products', icon: '📦', name: 'Quản lý Sản phẩm & SKU', path: '/dashboard/products' },
  { id: 'imports', icon: '📥', name: 'Phiếu Nhập kho', path: '/dashboard/imports' },
  { id: 'exports', icon: '📤', name: 'Phiếu Xuất kho', path: '/dashboard/exports' },
  { id: 'transfers', icon: '🔄', name: 'Điều chuyển kho', path: '/dashboard/transfers' },
  { id: 'inventory-checks', icon: '📋', name: 'Kiểm kê đối soát', path: '/dashboard/inventory-checks' },
  { id: 'customers', icon: '👥', name: 'Khách hàng', path: '/dashboard/customers' },
  { id: 'suppliers', icon: '🏭', name: 'Nhà cung cấp', path: '/dashboard/suppliers' },
  { id: 'visual-map', icon: '🗺️', name: 'Sơ đồ kho (Visual Map)', path: '/dashboard/visual-map' },
  { id: 'profile', icon: '👤', name: 'Hồ sơ cá nhân', path: '/dashboard/profile' },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredCommands = COMMANDS.filter((cmd) =>
    cmd.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleExecute = (command) => {
    setIsOpen(false);
    navigate(command.path);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleExecute(filteredCommands[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '15vh'
    }}>
      {/* Backdrop */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)'
        }}
        onClick={() => setIsOpen(false)}
      />

      {/* Palette Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '560px',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl), 0 0 0 1px var(--border-medium)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="var(--brand-400)" style={{ width: 20, height: 20, marginRight: 12 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            ref={inputRef}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '1.1rem',
              fontFamily: 'Inter, sans-serif'
            }}
            placeholder="Bạn muốn làm gì? (Tìm kiếm hành động, trang...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd style={{
            fontSize: '0.75rem',
            background: 'var(--bg-glass)',
            color: 'var(--text-muted)',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid var(--border-subtle)'
          }}>ESC</kbd>
        </div>

        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px' }}>
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Không tìm thấy lệnh nào phù hợp "{query}"
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => handleExecute(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    margin: '4px 0',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--bg-glass-hover)' : 'transparent',
                    color: isSelected ? 'var(--brand-400)' : 'var(--text-main)',
                    transition: 'none' // instant feedback
                  }}
                >
                  <span style={{ fontSize: '1.2rem', marginRight: 16 }}>{cmd.icon}</span>
                  <span style={{ flex: 1, fontWeight: isSelected ? 600 : 500 }}>{cmd.name}</span>
                  {isSelected && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--brand-500)' }}>
                      ↵ Enter
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
