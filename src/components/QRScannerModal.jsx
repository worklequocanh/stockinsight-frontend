import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    // Create the scanner instance when the modal is open
    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [0] // Prefer camera
    }, false);

    const onScan = (decodedText) => {
      // Clear the scanner on successful scan to prevent multiple reads
      scanner.clear();
      onScanSuccess(decodedText);
    };

    const onScanError = (err) => {
      // Ignore scan errors, as they happen continuously when no QR code is in frame
      // console.warn(err);
    };

    scanner.render(onScan, onScanError);

    // Cleanup when component unmounts or modal closes
    return () => {
      scanner.clear().catch(console.error);
    };
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>Quét mã QR / Barcode</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {error && <p className="error-banner">{error}</p>}
          <div id="qr-reader" style={{ width: '100%', maxWidth: '350px' }}></div>
          <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
            Đưa mã vạch hoặc mã QR vào khung ngắm để tự động quét.
          </p>
        </div>
      </div>
    </>
  );
}
