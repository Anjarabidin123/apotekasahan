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

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-600 to-sky-500 text-white shadow-sm shadow-blue-600/25 ${className}`}
      aria-label={alt}
    >
      <svg viewBox="0 0 36 36" className="w-[74%] h-[74%]" fill="none" aria-hidden="true">
        <rect x="14" y="6" width="8" height="24" rx="4" fill="#FFFFFF" />
        <rect x="6" y="14" width="24" height="8" rx="4" fill="#FFFFFF" />
        <circle cx="18" cy="18" r="2.8" fill="#2563EB" />
        <path
          d="M25.5 7.5C27.8 7.5 29.5 9.2 29.5 11.5C27.2 11.5 25.5 9.8 25.5 7.5Z"
          fill="#5EEAD4"
        />
      </svg>
    </div>
  );
}
