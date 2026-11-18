import React, { useState } from 'react';

export function BrandLogo({ logoUrl, className = 'w-10 h-10', alt = 'Logo Apotek Asahan Farma' }) {
  const [imgError, setImgError] = useState(false);
  const isCustomUpload = Boolean(logoUrl) && !logoUrl.startsWith('/logo-') && !imgError;

  if (isCustomUpload) {
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-xl flex items-center justify-center bg-white ${className}`}>
        <img
          src={logoUrl}
          alt={alt}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Monogram geometris minimalis bawaan sebelum logo apotek diunggah
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-xl flex items-center justify-center bg-blue-600 text-white shadow-xs ${className}`}
      aria-label={alt}
    >
      <svg viewBox="0 0 32 32" className="w-[62%] h-[62%]" fill="none" aria-hidden="true">
        <path
          d="M16 5V27M5 16H27"
          stroke="currentColor"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        <circle cx="24" cy="8" r="2.6" fill="#93C5FD" />
      </svg>
    </div>
  );
}
