export type BadgeType = 'dep' | 'fin' | 'eau' | 'biv' | 'ref' | 'parc' | 'star' | 'stop';

export interface ItWaypoint {
  name: string;
  badges: BadgeType[];
  rowClass: string; // 'lac' | 'biv' | 'star' | 'jstart' | ''
  distCum: string;  // e.g. "2.0 km"
  alt: string;      // e.g. "1416 m"
  dp: string;       // e.g. "+120 m" or "—"
  dm: string;       // e.g. "-10 m" or "—"
  segTime: string;  // e.g. "+0h55" or "—"
  cumTime: string;  // e.g. "0h55" or "—"
  heure: string;    // e.g. "09h55"
}

export interface ItDay {
  label: string;
  waypoints: ItWaypoint[];
}

export interface Itineraire {
  title: string;
  subtitle: string;
  warnings: string[];
  days: ItDay[];
  notes: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTds(trBody: string): string[] {
  const tds: string[] = [];
  const re = /<td[^>]*>([\s\S]*?)<\/td>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(trBody)) !== null) tds.push(m[1]);
  return tds;
}

function extractBadges(tdHtml: string): BadgeType[] {
  const badges: BadgeType[] = [];
  const re = /class="badge\s+b-([^"\s]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tdHtml)) !== null) badges.push(m[1] as BadgeType);
  return badges;
}

function cleanName(tdHtml: string): string {
  const noBadges = tdHtml.replace(/<span[^>]*class="badge[^"]*"[\s\S]*?<\/span>/g, '');
  return stripHtml(noBadges);
}

export function parseItineraire(content: string): Itineraire | null {
  try {
    const titleM = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const title = titleM ? stripHtml(titleM[1]) : 'Itinéraire';

    const subM = content.match(/class="subtitle"[^>]*>([\s\S]*?)<\/p>/);
    const subtitle = subM ? stripHtml(subM[1]) : '';

    const warnM = content.match(/class="warn"[^>]*>([\s\S]*?)<\/div>/);
    const warnings: string[] = [];
    if (warnM) {
      warnM[1].split(/<br\s*\/?>/i).forEach((line) => {
        const cl = stripHtml(line);
        if (cl) warnings.push(cl);
      });
    }

    const noteM = content.match(/class="note"[^>]*>([\s\S]*?)<\/p>/);
    const notes = noteM ? stripHtml(noteM[1]) : '';

    const tbodyM = content.match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (!tbodyM) return null;

    const days: ItDay[] = [];
    let currentDay: ItDay | null = null;

    const trRe = /<tr([^>]*)>([\s\S]*?)<\/tr>/g;
    let trm: RegExpExecArray | null;
    while ((trm = trRe.exec(tbodyM[1])) !== null) {
      const trBody = trm[2];

      // Day header row
      if (/class="jour"/.test(trBody)) {
        const jourM = trBody.match(/<td[^>]*>([\s\S]*?)<\/td>/);
        if (jourM) {
          currentDay = { label: stripHtml(jourM[1]), waypoints: [] };
          days.push(currentDay);
        }
        continue;
      }

      // Data row
      const tds = extractTds(trBody);
      if (tds.length < 8 || !currentDay) continue;

      const rowClassM = trm[1].match(/class="([^"]+)"/);
      currentDay.waypoints.push({
        name: cleanName(tds[0]),
        badges: extractBadges(tds[0]),
        rowClass: rowClassM ? rowClassM[1] : '',
        distCum: stripHtml(tds[1]),
        alt: stripHtml(tds[2]),
        dp: stripHtml(tds[3]),
        dm: stripHtml(tds[4]),
        segTime: stripHtml(tds[5]),
        cumTime: stripHtml(tds[6]),
        heure: stripHtml(tds[7]),
      });
    }

    if (days.length === 0) return null;
    return { title, subtitle, warnings, days, notes };
  } catch {
    return null;
  }
}
