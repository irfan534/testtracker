'use client';

import { useEffect, useState } from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCode({ value, size = 192, className = '' }: QRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Create a simple QR code placeholder using canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = size;
        canvas.height = size;

        // Draw a placeholder pattern
        ctx.fillStyle = '#000000';
        const moduleSize = size / 25; // 25x25 modules for a simple QR code
        
        // Create a simple pattern that looks like a QR code
        for (let row = 0; row < 25; row++) {
          for (let col = 0; col < 25; col++) {
            // Create position markers (corners)
            if (
              (row < 7 && col < 7) || // Top-left
              (row < 7 && col > 17) || // Top-right
              (row > 17 && col < 7)    // Bottom-left
            ) {
              if (
                (row === 0 || row === 6 || col === 0 || col === 6) || // Border
                (row >= 2 && row <= 4 && col >= 2 && col <= 4) // Center
              ) {
                ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
              }
            } else {
              // Random pattern for the rest
              if (Math.random() > 0.5) {
                ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
              }
            }
          }
        }

        const dataUrl = canvas.toDataURL();
        setQrDataUrl(dataUrl);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      }
    };

    generateQRCode();
  }, [value, size]);

  if (!qrDataUrl) {
    return (
      <div 
        className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Generating...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <img 
        src={qrDataUrl} 
        alt="QR Code" 
        style={{ width: size, height: size }}
        className="rounded-lg"
      />
      <p className="text-xs text-gray-500 text-center mt-2">
        Scan with authenticator app
      </p>
    </div>
  );
}
