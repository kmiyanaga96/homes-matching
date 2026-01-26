// Event Definitions (Month: 1-based, 0 = always visible)
export const EVENT_DEFINITIONS = [
  { name: "新歓", month: 4, type: "official" },
  { name: "皐月", month: 5, type: "others" },
  { name: "夏ミニ", month: 7, type: "mini" },
  { name: "夏定期", month: 8, type: "official" },
  { name: "夏合宿", month: 8, type: "camp" },
  { name: "秋定期", month: 10, type: "official" },
  { name: "月見", month: 10, type: "others" },
  { name: "秋ミニ", month: 11, type: "mini" },
  { name: "クリラ", month: 12, type: "others" },
  { name: "冬ミニ", month: 1, type: "mini" },
  { name: "冬定期", month: 2, type: "official" },
  { name: "春合宿", month: 2, type: "camp" },
  { name: "追いコン", month: 3, type: "official" },
  { name: "お休み", month: 0, type: "rest" },
];

export const EVENT_COLORS = {
  official: {
    bg: "bg-red-50", text: "text-red-500", border: "border-red-100",
    active: "bg-red-100", ring: "ring-red-400"
  },
  mini: {
    bg: "bg-orange-50", text: "text-orange-500", border: "border-orange-100",
    active: "bg-orange-100", ring: "ring-orange-400"
  },
  camp: {
    bg: "bg-sky-50", text: "text-sky-500", border: "border-sky-100",
    active: "bg-sky-100", ring: "ring-sky-400"
  },
  others: {
    bg: "bg-lime-50", text: "text-lime-500", border: "border-lime-100",
    active: "bg-lime-100", ring: "ring-lime-400"
  },
  rest: {
    bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200",
    active: "bg-slate-200", ring: "ring-slate-400"
  }
};

export const PARTS = ["Vo", "Gt", "Key", "Ba", "Dr"];

export const GRADES = ["1", "2", "3", "4", "OB/OG"];

// Get visible events based on current month (6 month window)
export function getVisibleEvents() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;

  const months = [];
  for (let i = 0; i < 6; i++) {
    let m = currentMonth + i;
    if (m > 12) m -= 12;
    months.push(m);
  }

  let visible = EVENT_DEFINITIONS.filter(ev => ev.month === 0 || months.includes(ev.month));

  visible.sort((a, b) => {
    const distA = a.month === 0 ? 999 : (a.month - currentMonth + 12) % 12;
    const distB = b.month === 0 ? 999 : (b.month - currentMonth + 12) % 12;
    return distA - distB;
  });

  return visible;
}

export function getEventDef(name) {
  return EVENT_DEFINITIONS.find(e => e.name === name);
}

export function getEventColor(name) {
  const def = getEventDef(name);
  if (!def) return EVENT_COLORS.others;
  return EVENT_COLORS[def.type] || EVENT_COLORS.others;
}
