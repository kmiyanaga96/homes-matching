/* =========================
   Constants: Event Definitions
   ========================= */

// Month is 1-based (1 = Jan, 12 = Dec)
const EVENT_DEFINITIONS = [
    { name: "新歓", month: 4, type: "official" },
    { name: "皐月", month: 5, type: "others" },
    { name: "夏ミニ", month: 7, type: "mini" },
    { name: "夏定期", month: 8, type: "official" },
    { name: "夏合宿", month: 8, type: "camp" }, // month 8 per user request
    { name: "秋定期", month: 10, type: "official" }, // month 10 per user request
    { name: "月見", month: 10, type: "others" },
    { name: "秋ミニ", month: 11, type: "mini" }, // month 11 per user request
    { name: "クリラ", month: 12, type: "others" },
    { name: "冬ミニ", month: 1, type: "mini" },
    { name: "冬定期", month: 2, type: "official" },
    { name: "春合宿", month: 2, type: "camp" }, // month 2 per user request
    { name: "追いコン", month: 3, type: "official" },
];

const EVENT_COLORS = {
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
    }
};

// Also keep generic options if needed (e.g. "DMして")?
// User requirement seems to imply these 13 are the main ones for "Recruiting".
// We might keep "DMして" / "むり" as separate flags or additional options?
// For now, adhering strictly to the 13 events for the main status list.
// However, the previous list had "DMして" and "むり".
// I will separate them as "Extra Statuses" if needed, but for now let's focus on the events.
