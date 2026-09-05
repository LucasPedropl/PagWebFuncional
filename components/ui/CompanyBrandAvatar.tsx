import React, { useState } from 'react';
import { getCompanyAvatarTone, getCompanyInitials } from '../../utils/companyBrand';

interface CompanyBrandAvatarProps {
  name: string;
  logoUrl?: string | null;
  seed?: string | number;
  className?: string;
  textClassName?: string;
}

/** Logo da empresa (cabe inteira no slot) ou iniciais quando não houver imagem. */
export const CompanyBrandAvatar: React.FC<CompanyBrandAvatarProps> = ({
  name,
  logoUrl,
  seed,
  className = 'w-10 h-10 rounded-lg',
  textClassName = 'text-sm font-bold',
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(logoUrl) && !imageFailed;
  const tone = getCompanyAvatarTone(seed ?? name);

  if (showImage) {
    return (
      <div
        className={`${className} overflow-hidden shrink-0 bg-white flex items-center justify-center`}
        aria-label={name}
        title={name}
      >
        <img
          src={logoUrl ?? undefined}
          alt={name}
          className="max-h-full max-w-full w-full h-full object-contain p-[10%]"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} ${tone} text-white flex items-center justify-center shrink-0`}
      aria-label={name}
      title={name}
    >
      <span className={textClassName}>{getCompanyInitials(name)}</span>
    </div>
  );
};
