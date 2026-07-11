/**
 * HHスケジュール判定ユーティリティ
 * hh_time の文字列（例: "17:00〜19:00"）を解析し、現在時刻が HH 中かを返す
 */

interface HHRange {
  startMins: number;
  endMins: number;
}

/**
 * "17:00〜19:00" → { startMins: 1020, endMins: 1140 }
 * 解析失敗時は null
 */
export function parseHHTime(hhTime: string): HHRange | null {
  // 全角〜 / 半角~ どちらにも対応
  const match = hhTime.match(/(\d{1,2}):(\d{2})[〜~](\d{1,2}):(\d{2})/);
  if (!match) return null;
  return {
    startMins: parseInt(match[1]) * 60 + parseInt(match[2]),
    endMins:   parseInt(match[3]) * 60 + parseInt(match[4]),
  };
}

/**
 * 現在時刻が HH 時間帯に含まれるかを返す
 * hh_time が未定義または解析できない場合は false
 */
export function isHHActiveNow(hhTime: string | undefined): boolean {
  if (!hhTime) return false;
  const range = parseHHTime(hhTime);
  if (!range) return false;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return nowMins >= range.startMins && nowMins < range.endMins;
}
