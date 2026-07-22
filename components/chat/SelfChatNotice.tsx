import React from 'react';
import { Info } from 'lucide-react';
import { SELF_CHAT_NOTICE } from '../../utils/chatSelfThread';

export const SelfChatNotice: React.FC = () => (
  <div
    className="mx-4 mt-3 mb-1 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-950"
    role="status"
  >
    <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" aria-hidden />
    <p className="leading-relaxed">{SELF_CHAT_NOTICE}</p>
  </div>
);
