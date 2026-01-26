import { useState, useEffect, useMemo } from 'react';
import { API } from '../lib/api';
import { getVisibleEvents, getEventColor, PARTS, GRADES } from '../lib/constants';
import MemberCard from '../components/MemberCard';

export default function SearchPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [filterPart, setFilterPart] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortMode, setSortMode] = useState(() =>
    localStorage.getItem('sort_mode') || 'updatedDesc'
  );
  const [favorites, setFavorites] = useState(() =>
    JSON.parse(localStorage.getItem('fav_members') || '[]')
  );
  const [favFilterActive, setFavFilterActive] = useState(false);

  const visibleEvents = useMemo(() => getVisibleEvents(), []);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    localStorage.setItem('sort_mode', sortMode);
  }, [sortMode]);

  useEffect(() => {
    localStorage.setItem('fav_members', JSON.stringify(favorites));
  }, [favorites]);

  async function fetchMembers() {
    setLoading(true);
    try {
      const data = await API.getMembers();
      setMembers(data);
    } catch (e) {
      console.error('[fetchMembers]', e);
    }
    setLoading(false);
  }

  const toggleFavorite = (id) => {
    setFavorites(prev =>
      prev.includes(id)
        ? prev.filter(f => f !== id)
        : [...prev, id]
    );
  };

  const filteredMembers = useMemo(() => {
    const visibleNames = visibleEvents.map(e => e.name);
    const nameVal = searchName.toLowerCase();

    let filtered = members.filter(m => {
      const matchName = (m.name || '').toLowerCase().includes(nameVal);
      const matchPart = filterPart === '' || (m.part || '').split('/').includes(filterPart);
      const matchGrade = filterGrade === '' || String(m.grade) === filterGrade;

      const memberStatuses = (m.status || '').split('/').filter(Boolean);
      const visibleStatuses = memberStatuses.filter(s => visibleNames.includes(s));
      const matchStatus = filterStatus === '' || visibleStatuses.includes(filterStatus);
      const hasVisibleStatus = visibleStatuses.length > 0;

      const matchFav = !favFilterActive || favorites.includes(m.id);

      return matchName && matchPart && matchGrade && matchStatus && hasVisibleStatus && matchFav;
    });

    // Sort
    const gradeToNumber = (g) => {
      if (String(g).trim() === 'OB/OG') return 5;
      const n = Number(g);
      return Number.isFinite(n) ? n : 999;
    };

    const partOrder = ['Vo', 'Gt', 'Key', 'Ba', 'Dr'];
    const partRank = (partStr) => {
      const parts = String(partStr || '').split('/').filter(Boolean);
      let best = 999;
      parts.forEach(p => {
        const idx = partOrder.indexOf(p);
        if (idx !== -1) best = Math.min(best, idx);
      });
      return best;
    };

    const toTime = (m) => {
      const d = m.updatedAt ? new Date(m.updatedAt) : null;
      return d && !isNaN(d.getTime()) ? d.getTime() : 0;
    };

    if (sortMode === 'updatedDesc') {
      filtered.sort((a, b) => toTime(b) - toTime(a));
    } else if (sortMode === 'gradeAsc') {
      filtered.sort((a, b) => {
        const ga = gradeToNumber(a.grade);
        const gb = gradeToNumber(b.grade);
        if (ga !== gb) return ga - gb;
        const pa = partRank(a.part);
        const pb = partRank(b.part);
        if (pa !== pb) return pa - pb;
        return String(a.name || '').localeCompare(String(b.name || ''), 'ja');
      });
    } else {
      filtered.sort((a, b) => {
        const ga = gradeToNumber(a.grade);
        const gb = gradeToNumber(b.grade);
        if (ga !== gb) return gb - ga;
        const pa = partRank(a.part);
        const pb = partRank(b.part);
        if (pa !== pb) return pa - pb;
        return String(a.name || '').localeCompare(String(b.name || ''), 'ja');
      });
    }

    return filtered;
  }, [members, searchName, filterPart, filterGrade, filterStatus, sortMode, favFilterActive, favorites, visibleEvents]);

  return (
    <div className="py-4">
      {/* Search & Filters */}
      <div className="bg-white rounded-2xl shadow p-4 mb-4">
        <input
          type="text"
          placeholder="名前で検索..."
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3"
        />

        <div className="flex gap-2 mb-3">
          <select
            value={filterPart}
            onChange={e => setFilterPart(e.target.value)}
            className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
          >
            <option value="">パート</option>
            {PARTS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={filterGrade}
            onChange={e => setFilterGrade(e.target.value)}
            className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
          >
            <option value="">学年</option>
            {GRADES.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
          >
            <option value="">募集中ライブ</option>
            {visibleEvents.map(e => (
              <option key={e.name} value={e.name}>{e.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value)}
            className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
          >
            <option value="updatedDesc">更新順</option>
            <option value="gradeAsc">学年↑</option>
            <option value="gradeDesc">学年↓</option>
          </select>

          <button
            onClick={() => setFavFilterActive(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              favFilterActive
                ? 'bg-rose-100 text-rose-600'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            ♡ お気に入り
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">読み込み中...</div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          該当するメンバーがいません
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              isFavorite={favorites.includes(member.id)}
              onToggleFavorite={() => toggleFavorite(member.id)}
              visibleEvents={visibleEvents}
            />
          ))}
        </div>
      )}
    </div>
  );
}
