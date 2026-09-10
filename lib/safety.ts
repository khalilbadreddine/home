/**
 * The Circle — gentle moderation.
 * Comments are auto-published unless they trip the filter, in which case
 * they're hidden and queued for a human (the owner) to look at.
 */

const BLOCKED = [
  // common English insults / slurs (kept conservative)
  'fuck', 'fucking', 'shit', 'bitch', 'bastard', 'asshole', 'dickhead',
  'porn', 'pornography', 'slut', 'whore', 'cunt', 'motherfucker',
  'nigger', 'nigga', 'faggot', 'kike', 'spic', 'chink',
  'hitler', 'terrorist', 'kill her', 'kill them', 'beheaded',
  'die alone', 'no one likes you', 'you are worthless', 'worthless',
  'ugly woman', 'fat bitch', 'stupid woman',
  'idiot', 'stupid', 'dumb', 'ugly', 'loser', 'trash', 'gross',
  'hate you', 'you suck', 'pathetic', 'disgusting', 'eat shit',
];

const CONTACT_PATTERNS = [
  /\b(?:www\.)?[\w-]+\.(?:com|net|org|io|co|me|shop|store)(?:\/\S*)?/i,
  /https?:\/\//i,
  /@(?:twitter|instagram|pinterest|tiktok)\.com/i,
  /\b(?:instagram|pinterest|tiktok|onlyfans)\s*[:@]/i,
];

export interface CheckResult {
  clean: boolean;
  reasons: string[];
}

export function checkComment(text: string): CheckResult {
  const reasons: string[] = [];
  const t = ` ${text.toLowerCase()} `;

  for (const word of BLOCKED) {
    const w = word.trim();
    if (!w) continue;
    // word-boundary check so "ash" isn't caught by "shit"-like fragments
    const re = new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'i');
    if (re.test(t)) {
      reasons.push('language we keep out of the Circle');
      break;
    }
  }

  for (const re of CONTACT_PATTERNS) {
    if (re.test(text)) {
      reasons.push('links & handles are kept out of comments (share your love here, find each other on Pinterest)');
      break;
    }
  }

  if (text.length > 1200) reasons.push('a little too long for a note');

  return { clean: reasons.length === 0, reasons };
}
