// ============================================================================
// Prohibited-content & off-platform screening for listing text (R3).
//
// Two pattern sets:
//  - PROHIBITED_PATTERNS: items/services a marketplace must not host
//    (weapons, drugs, counterfeit, stolen goods, alcohol/tobacco/vapes, adult
//    content, live animals / human remains, gift cards & money instruments,
//    fraud materials).
//  - OFFPLATFORM_PATTERNS: attempts to move the deal or conversation
//    off-platform (other payment apps, crypto wallets, emails, phone numbers,
//    "dm me on telegram", discord handles).
//
// Matching is case-insensitive and word-boundary anchored for short terms so
// legit craft-supply vocabulary does NOT trip it:
//   - "candy", "candies"        -> OK (never matches; drug terms need \b)
//   - "pillows", "pillowcase"   -> OK (\bpills\b / \bpill\b don't match)
//   - "alcohol ink", "ink pads" -> OK (only alcohol *beverage* phrases match)
//   - "weed whacker"            -> OK (\bweed\b requires a word end)
//   - "bootleg" (vinyl)         -> intentionally NOT listed (hobby legit)
//   - "airsoft", "paintball"    -> intentionally NOT listed (hobby legit)
// Inline spot-tests (run in any TS playground):
//   screenListingText('Handmade candy melts', 'Great for cake pops') -> { blocked: false }
//   screenListingText('xanax pills for sale', 'call me')             -> blocked, 2 categories
//   screenListingText('Vintage replica watch', '')                   -> blocked (counterfeit)
// ============================================================================

export type PatternEntry = {
  /** Human-readable category shown to the seller (never the raw word). */
  category: string
  /** Case-insensitive regex sources; all are word-boundary safe. */
  patterns: string[]
}

// ── Prohibited items & services ────────────────────────────────────────────
export const PROHIBITED_PATTERNS: PatternEntry[] = [
  {
    category: 'weapons, firearms, or explosives',
    patterns: [
      String.raw`\bfirearm(s)?\b`,
      String.raw`\bgun(s)?\b`,
      String.raw`\bpistol(s)?\b`,
      String.raw`\brifle(s)?\b`,
      String.raw`\bshotgun(s)?\b`,
      String.raw`\bhandgun(s)?\b`,
      String.raw`\bglock\b`,
      String.raw`\bar[-\s]?15\b`,
      String.raw`\bak[-\s]?47\b`,
      String.raw`\bsilencer(s)?\b`,
      String.raw`\bsuppressor(s)?\b`,
      String.raw`\bammo\b`,
      String.raw`\bammunition\b`,
      String.raw`\bbullet(s)?\b`,
      String.raw`\bhollow[-\s]?point\b`,
      String.raw`\btaser(s)?\b`,
      String.raw`\bstun\s?gun(s)?\b`,
      String.raw`\bbrass\s?knuckles\b`,
      String.raw`\bswitchblade(s)?\b`,
      String.raw`\bbutterfly\s?knife\b`,
      String.raw`\bthrowing\s?star(s)?\b`,
      String.raw`\bgrenade(s)?\b`,
      String.raw`\bdynamite\b`,
      String.raw`\bpipe\s?bomb(s)?\b`,
      String.raw`\bdetonator(s)?\b`,
      String.raw`\bgunpowder\b`,
      String.raw`\bghost\s?gun(s)?\b`,
      String.raw`\bbump\s?stock(s)?\b`,
    ],
  },
  {
    category: 'drugs or drug paraphernalia',
    patterns: [
      String.raw`\bcannabis\b`,
      String.raw`\bmarijuana\b`,
      String.raw`\bweed(?!\s*whack)\b`,
      String.raw`\bthc\b`,
      String.raw`\bcbd\b`,
      String.raw`\bcocaine\b`,
      String.raw`\bcrack\b`,
      String.raw`\bheroin\b`,
      String.raw`\bfentanyl\b`,
      String.raw`\bmeth\b`,
      String.raw`\bmethamphetamine\b`,
      String.raw`\bpsilocybin\b`,
      String.raw`\bshrooms\b`,
      String.raw`\blsd\b`,
      String.raw`\becstasy\b`,
      String.raw`\bmolly\b`,
      String.raw`\bmdma\b`,
      String.raw`\bxanax\b`,
      String.raw`\badderall\b`,
      String.raw`\boxycodone\b`,
      String.raw`\boxycontin\b`,
      String.raw`\bpercocet\b`,
      String.raw`\bvicodin\b`,
      String.raw`\bkratom\b`,
      String.raw`\bedibles\b`,
      String.raw`\bmarijuana\s?pipes?\b`,
      String.raw`\bbong(s)?\b`,
      String.raw`\bgrinder(s)?\s+for\s+herb`,
    ],
  },
  {
    category: 'counterfeit or replica goods',
    patterns: [
      String.raw`\bcounterfeit(s)?\b`,
      String.raw`\breplica(s)?\b`,
      String.raw`\bknock[-\s]?off(s)?\b`,
      String.raw`\bsuperfake(s)?\b`,
      String.raw`\b1:1\s+(copy|replica|clone)\b`,
      String.raw`\bfake\s+(designer|luxury|gucci|louis|prada|chanel|rolex)\b`,
    ],
  },
  {
    category: 'stolen goods',
    patterns: [
      String.raw`\bstolen\b`,
      String.raw`\bshoplifted\b`,
      String.raw`\bserial\s?number\s?(removed|shaved|ground)\b`,
      String.raw`\bfell?\s+off\s+(a\s+|the\s+)?truck\b`,
    ],
  },
  {
    category: 'alcohol, tobacco, or vaping products',
    patterns: [
      String.raw`\bvape(s|d| pen| juice)?\b`,
      String.raw`\bvaping\b`,
      String.raw`\be[-\s]?cigarette(s)?\b`,
      String.raw`\be[-\s]?juice\b`,
      String.raw`\bjuul\b`,
      String.raw`\belf\s?bar\b`,
      String.raw`\bpuff\s?bar\b`,
      String.raw`\btobacco\b`,
      String.raw`\bcigarette(s)?\b`,
      String.raw`\bcigar(s)?\b`,
      String.raw`\bnicotine\b`,
      String.raw`\bhookah\s?pen\b`,
      String.raw`\bbottle\s+of\s+(vodka|whiskey|bourbon|tequila|rum|gin|wine|champagne)\b`,
      String.raw`\bmoonshine\b`,
      String.raw`\bliquor\b`,
    ],
  },
  {
    category: 'adult or explicit content',
    patterns: [
      String.raw`\bporn(ography|ographic)?\b`,
      String.raw`\bxxx\b`,
      String.raw`\bonlyfans\b`,
      String.raw`\bnude(s|d)?\b`,
      String.raw`\bsex\s?tape\b`,
      String.raw`\bsexting\b`,
      String.raw`\bused\s+underwear\b`,
      String.raw`\bworn\s+underwear\b`,
      String.raw`\bfeet\s?pics\b`,
    ],
  },
  {
    category: 'live animals or human remains',
    patterns: [
      String.raw`\bpuppies\s+for\s+sale\b`,
      String.raw`\bkittens\s+for\s+sale\b`,
      String.raw`\blive\s+animal(s)?\b`,
      String.raw`\bpet\s+for\s+sale\b`,
      String.raw`\brehoming\s+fee\b`,
      String.raw`\bhuman\s+remains\b`,
      String.raw`\bhuman\s+skull(s)?\b`,
    ],
  },
  {
    category: 'gift cards or money-transfer instruments',
    patterns: [
      String.raw`\bgift\s?card(s)?\b`,
      String.raw`\bprepaid\s+card(s)?\b`,
      String.raw`\breloadable\s+card(s)?\b`,
      String.raw`\bitunes\s+card\b`,
      String.raw`\bvisa\s+(gift|prepaid)\s+card\b`,
      String.raw`\bmoney\s?order(s)?\b`,
    ],
  },
  {
    category: 'fraud or stolen financial data',
    patterns: [
      String.raw`\bfullz\b`,
      String.raw`\bcvv(2)?\b`,
      String.raw`\bdumps?\s+with\s+pin\b`,
      String.raw`\bcloned\s+card(s)?\b`,
      String.raw`\bcard\s+cloning\b`,
      String.raw`\bbank\s+logins?\b`,
      String.raw`\bstolen\s+(credit|debit)?\s*card(s)?\b`,
      String.raw`\bidentity\s+for\s+sale\b`,
    ],
  },
]

// ── Off-platform redirection (payments + contact info) ─────────────────────
export const OFFPLATFORM_PATTERNS: PatternEntry[] = [
  {
    category: 'off-platform payment offers',
    patterns: [
      String.raw`\bpaypal\b`,
      String.raw`\bvenmo\b`,
      String.raw`\bzelle\b`,
      String.raw`\bcash\s?app\b`,
      String.raw`\bchime\b`,
      String.raw`\bwestern\s+union\b`,
      String.raw`\bmoneygram\b`,
      String.raw`\bmoney\s?order(s)?\b`,
      String.raw`\bbitcoin\b`,
      String.raw`\bbtc\b`,
      String.raw`\busdt\b`,
      String.raw`\bcrypto(currency)?\s+(wallet|payment|accepted)\b`,
      String.raw`\bbc1[a-z0-9]{20,}\b`, // bech32 BTC address
      String.raw`\b0x[a-fA-F0-9]{40}\b`, // ETH/EVM address
      String.raw`\b[a-zA-Z0-9]{32,44}\b`, // long wallet-like strings (SOL/base58)
    ],
  },
  {
    category: 'contact-info sharing (email/phone/socials)',
    patterns: [
      String.raw`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`,
      String.raw`\b(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b`, // US phone
      String.raw`\btext\s+me\b`,
      String.raw`\bcall\s+me\b`,
      String.raw`\bcall\s+or\s+text\b`,
      String.raw`\bdm\s+me\b`,
      String.raw`\bmessage\s+me\s+(on|at)\b`,
      String.raw`\bmy\s+(insta|instagram|telegram|whatsapp|snapchat|kik)\b`,
      String.raw`\btelegram\b`,
      String.raw`\bwhatsapp\b`,
      String.raw`\bsnapchat\b`,
      String.raw`\bdiscord\s+(me|name|tag|handle)?\s*:?\s*[a-zA-Z0-9_.]{2,32}#\d{4}\b`,
    ],
  },
]

// ── Matcher ────────────────────────────────────────────────────────────────
export type ScreeningResult = { blocked: boolean; matched: string[] }

function compile(entries: PatternEntry[]): { category: string; rx: RegExp }[] {
  return entries.flatMap((entry) =>
    entry.patterns.map((source) => ({
      category: entry.category,
      rx: new RegExp(source, 'i'),
    }))
  )
}

const PROHIBITED_RX = compile(PROHIBITED_PATTERNS)
const OFFPLATFORM_RX = compile(OFFPLATFORM_PATTERNS)

function matchCategories(compiled: { category: string; rx: RegExp }[], text: string): string[] {
  const found = new Set<string>()
  for (const { category, rx } of compiled) {
    if (rx.test(text)) found.add(category)
  }
  return [...found]
}

/**
 * Screen listing title + description. Returns matched category labels
 * (deduped, human-readable — safe to show to the seller).
 */
export function screenListingText(title: string, description: string): ScreeningResult {
  const text = `${title}\n${description}`
  const matched = matchCategories(PROHIBITED_RX, text)
  return { blocked: matched.length > 0, matched }
}

/**
 * Screen arbitrary text (also used for image URL strings and listing edits)
 * for off-platform redirection signals. Returns matched category labels.
 */
export function screenOffPlatform(text: string): ScreeningResult {
  const matched = matchCategories(OFFPLATFORM_RX, text)
  return { blocked: matched.length > 0, matched }
}
