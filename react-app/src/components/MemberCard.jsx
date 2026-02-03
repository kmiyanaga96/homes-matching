import { getEventColor } from '../lib/constants';

export default function MemberCard({ member, isFavorite, onToggleFavorite, visibleEvents }) {
  const isOBOG = member.grade === 'OB/OG';
  const gradeDisplay = isOBOG ? 'OB/OG' : `${member.grade}年`;
  const parts = (member.part || '').split('/').filter(Boolean);

  const memberStatuses = (member.status || '').split('/').filter(Boolean);
  const visibleEventNames = visibleEvents.map(e => e.name);
  const visibleStatuses = memberStatuses.filter(s => visibleEventNames.includes(s));

  const avatarUrl = `https://unavatar.io/twitter/${member.id}?fallback=https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || '')}`;

  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
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

        {/* Twitter link & Favorite */}
        <div className="flex items-center gap-1">
          <a
            href={`https://twitter.com/${member.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-400 hover:text-blue-500 transition"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <button
            onClick={onToggleFavorite}
            className={`text-2xl transition ${isFavorite ? 'text-rose-500' : 'text-slate-300'}`}
          >
            ♡
          </button>
        </div>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-1 px-3 pb-2">
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

      {/* Comment */}
      <div className="px-3 pb-3">
        <p className="text-[13px] text-slate-500">
          {member.comment || 'イエッタイガー！'}
        </p>
      </div>
    </div>
  );
}
