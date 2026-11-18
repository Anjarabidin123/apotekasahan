import React from 'react';

export function BrandLogo({ logoUrl, className = 'w-10 h-10', alt = 'Logo Apotek Asahan Farma' }) {
  const defaultLogo = '/logo-asahan.svg';
  const effectiveUrl = logoUrl || defaultLogo;

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-2xl flex items-center justify-center ${className}`}>
      <img
        src={effectiveUrl}
        alt={alt}
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback ke default logo jika custom image gagal load
          if (e.target.src !== defaultLogo) {
            e.target.src = defaultLogo;
          }
        }}
      />
    </div>
  );
}
