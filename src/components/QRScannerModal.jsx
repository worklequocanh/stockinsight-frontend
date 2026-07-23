import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Modal from './common/Modal';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {

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

    const onScanError = () => {
      // Ignore scan errors, as they happen continuously when no QR code is in frame
    };

    scanner.render(onScan, onScanError);

    // Cleanup when component unmounts or modal closes
    return () => {
      scanner.clear().catch(console.error);
    };
  }, [isOpen, onScanSuccess]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quét mã QR / Barcode" maxWidth="420px">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div id="qr-reader" style={{ width: '100%', maxWidth: '350px' }}></div>
        <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center' }}>
          Đưa mã vạch hoặc mã QR vào khung ngắm camera để tự động quét & nhận dạng sản phẩm.
        </p>
      </div>
    </Modal>
  );
}
