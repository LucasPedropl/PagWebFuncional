import React from 'react';
import { InfoTooltip } from '../../../components/ui/InfoTooltip';

interface CobrancaStatCardProps {
  label: string;
  tooltip: string;
  amount: string;
  footer: React.ReactNode;
  amountClassName: string;
  iconWrapClassName: string;
  icon: React.ReactNode;
  interactive: boolean;
  isActive: boolean;
  activeClassName: string;
  onToggle?: () => void;
}

/** Card de KPI. Vira botão só quando o filtro é controlado pela página. */
export const CobrancaStatCard: React.FC<CobrancaStatCardProps> = ({
  label,
  tooltip,
  amount,
  footer,
  amountClassName,
  iconWrapClassName,
  icon,
  interactive,
  isActive,
  activeClassName,
  onToggle,
}) => {
  const body = (
    <>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {label}
            </span>
            <InfoTooltip text={tooltip} popoverRadiusClass="rounded-[5px]" />
          </div>
          <h3 className={`text-xl font-bold mt-2 ${amountClassName}`}>{amount}</h3>
        </div>
        <div className={`p-2.5 rounded-[5px] border ${iconWrapClassName}`}>{icon}</div>
      </div>
      <div className="mt-2 flex items-center text-xs">{footer}</div>
    </>
  );

  const baseClassName = `w-full text-left bg-white p-5 rounded-[5px] shadow-sm border border-gray-100 transition-all hover:shadow-md ${
    isActive ? activeClassName : ''
  }`;

  if (!interactive || !onToggle) {
    return <div className={baseClassName}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isActive}
      className={`${baseClassName} cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900`}
    >
      {body}
    </button>
  );
};
