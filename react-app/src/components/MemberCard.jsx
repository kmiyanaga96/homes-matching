import { useState } from 'react';
import { getEventColor } from '../lib/constants';

export default function MemberCard({ member, isFavorite, onToggleFavorite, visibleEvents }) {
  const [expanded, setExpanded] = useState(false);

  const isOBOG = member.grade === 'OB/OG';
  const gradeDisplay = isOBOG ? 'OB/OG' : `${member.grade}年`;
  const parts = (member.part || '').split('/').filter(Boolean);

  const memberStatuses = (member.status || '').split('/').filter(Boolean);
  const visibleEventNames = visibleEvents.map(e => e.name);
  const visibleStatuses = memberStatuses.filter(s => visibleEventNames.includes(s));

  const avatarUrl = `https://unavatar.io/twitter/${member.id}?fallback=https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || '')}`;

  return (
    <div
      className={`bg-white rounded-2xl shadow overflow-hidden transition-all ${
        expanded ? 'ring-2 ring-slate-300' : ''
      }`}
    >
      {/* Header - Always visible */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => setExpanded(prev => !prev)}
      >
        <img
          src={avatarUrl}
          alt={member.name}
          className="w-12 h-12 rounded-full object-cover bg-slate-200"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || '')}`;
          }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 truncate">{member.name}</span>
            <span className="text-xs text-slate-500">/ {gradeDisplay}</span>
          </div>

          <div className="flex flex-wrap gap-1 mt-1">
            {parts.map(p => (
              <span
                key={p}
                className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`text-xl ${isFavorite ? 'text-rose-500' : 'text-slate-300'}`}
        >
          ★
        </button>
      </div>

      {/* Status chips - Always visible */}
      <div className="flex flex-wrap gap-1 px-3 pb-3">
        {visibleStatuses.map(status => {
          const color = getEventColor(status);
          return (
            <span
              key={status}
              className={`text-xs px-2 py-0.5 rounded-full ${color.bg} ${color.text} border ${color.border}`}
            >
              {status}
            </span>
          );
        })}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-100">
          <p className="text-sm text-slate-600 whitespace-pre-wrap">
            {member.comment || 'イエッタイガー！'}
          </p>

          <a
            href={`https://twitter.com/${member.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs text-blue-500 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            @{member.id}
          </a>
        </div>
      )}
    </div>
  );
}
