import React, { useState } from 'react';
import { getCompanyAvatarTone, getCompanyInitials } from '../../utils/companyBrand';

interface CompanyBrandAvatarProps {
  name: string;
  logoUrl?: string | null;
  seed?: string | number;
  className?: string;
  textClassName?: string;
}

/** Logo da empresa ou iniciais quando não houver imagem. */
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
      <img
        src={logoUrl ?? undefined}
        alt={name}
        className={`${className} object-cover shrink-0`}
        referrerPolicy="no-referrer"
        onError={() => setImageFailed(true)}
      />
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
