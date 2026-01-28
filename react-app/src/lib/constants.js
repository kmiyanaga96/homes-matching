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

export const PARTS = ["Vo", "Gt", "Key", "Ba", "Dr", "その他"];

export const GRADES = ["1", "2", "3", "4", "OB/OG"];

// --- v1.0.0: 役職・権限・スタジオ定義 ---

export const ROLES = {
  admin: "管理者",
  president: "代表",
  vicePresident: "副代表",
  secretary: "事務",
  treasurer: "会計",
  groupLeader: "班長",
  partLeader: "パートリーダー",
};

export const ROLE_KEYS = Object.keys(ROLES);

// 班の種類（班長用）
export const GROUPS = ["撮影班", "PA班", "照明班"];

// 権限定義
export const PERMISSIONS = {
  eventEdit: "イベント作成編集",
  noticeEdit: "お知らせ作成編集",
  studioEdit: "スタジオ表作成編集",
  timetableEdit: "タイムテーブル作成編集",
  setlistEdit: "セットリスト作成編集",
  archiveUpload: "アーカイブアップロード",
};

// 役職ごとの権限マッピング
const ALL_PERMISSIONS = Object.keys(PERMISSIONS);
const LIMITED_PERMISSIONS = ["eventEdit", "noticeEdit"];

export const ROLE_PERMISSIONS = {
  admin: ALL_PERMISSIONS,
  president: ALL_PERMISSIONS,
  vicePresident: ALL_PERMISSIONS,
  secretary: ALL_PERMISSIONS,
  treasurer: ALL_PERMISSIONS,
  groupLeader: LIMITED_PERMISSIONS,
  partLeader: LIMITED_PERMISSIONS,
};

// ユーザーの役職配列から権限を判定
export function hasPermission(roles, permission) {
  if (!roles || roles.length === 0) return false;
  return roles.some(role => {
    const perms = ROLE_PERMISSIONS[role];
    return perms && perms.includes(permission);
  });
}

// 管理画面アクセス可能か（管理者のみ）
export function isAdmin(roles) {
  return roles && roles.includes("admin");
}

// 幹部権限か（代表・副代表・事務・会計・管理者）
export function isExecutive(roles) {
  if (!roles) return false;
  const executiveRoles = ["admin", "president", "vicePresident", "secretary", "treasurer"];
  return roles.some(r => executiveRoles.includes(r));
}

// スタジオ練習場所
export const STUDIO_LOCATIONS = [
  "NOAH新宿",
  "NOAH高田馬場",
  "NOAH渋谷1号",
  "NOAH渋谷2号",
  "NOAH渋谷本店",
  "NOAH池袋",
  "NOAH秋葉原",
];

// バンドステータス
export const BAND_STATUS = {
  recruiting: "募集中",
  closed: "〆",
};

// イベントタイプ（v1.0.0）
export const EVENT_TYPES = {
  live: "ライブ",
  other: "その他",
};

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
