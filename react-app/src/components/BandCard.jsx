import { BAND_STATUS } from '../lib/constants';

export default function BandCard({ band, onTap }) {
  const isRecruiting = band.status === 'recruiting';
  const memberNames = (band.members || []).map(m => m.name || m.id).join(', ');

  return (
    <button
      onClick={() => onTap(band)}
      className="w-full bg-white rounded-2xl shadow p-4 text-left hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-800 truncate">{band.name}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              isRecruiting
                ? 'bg-lime-100 text-lime-700'
                : 'bg-slate-100 text-slate-500'
            }`}>
              {BAND_STATUS[band.status] || band.status}
            </span>
          </div>

          <p className="text-xs text-slate-500 truncate">{memberNames}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {(band.members || []).length}人
          </p>
        </div>

        {band.comment && (
          <p className="text-[11px] text-slate-500 max-w-[120px] truncate">{band.comment}</p>
        )}
      </div>
    </button>
  );
}
