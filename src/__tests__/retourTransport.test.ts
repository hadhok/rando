/**
 * Tests for the transport card mappings in RetourScreen.
 * Extracted as pure data — no React imports needed.
 */

import { TREKS } from '../data/treks';

// Mirrors constants from RetourScreen.tsx
const TREK_TO_CARD: Record<string, string> = {
  gr10:     'gr10',
  ayous:    'ossau',
  artouste: 'ossau',
};

interface TransportCard {
  id: string;
  trekIds: string[];
  icon: string;
  title: string;
  meta: string;
}

const CARDS: TransportCard[] = [
  {
    id: 'gr10',
    trekIds: ['gr10'],
    icon: '🚌',
    title: 'Depuis Sare ou Ainhoa',
    meta: '→ Biriatou',
  },
  {
    id: 'ossau',
    trekIds: ['ayous', 'artouste'],
    icon: '🏔',
    title: "Depuis Lacs d'Ayous / Artouste",
    meta: '→ Parking Bious-Oumettes',
  },
];

// ─── TREK_TO_CARD ─────────────────────────────────────────────────────────────

describe('TREK_TO_CARD mappings', () => {
  test('gr10 → gr10 card', () => {
    expect(TREK_TO_CARD['gr10']).toBe('gr10');
  });

  test('ayous → ossau card', () => {
    expect(TREK_TO_CARD['ayous']).toBe('ossau');
  });

  test('artouste → ossau card', () => {
    expect(TREK_TO_CARD['artouste']).toBe('ossau');
  });

  test('every mapped card ID exists in CARDS', () => {
    const cardIds = new Set(CARDS.map(c => c.id));
    for (const cardId of Object.values(TREK_TO_CARD)) {
      expect(cardIds.has(cardId)).toBe(true);
    }
  });

  test('bidarray-sare has no card (not mapped) — returns undefined', () => {
    expect(TREK_TO_CARD['bidarray-sare']).toBeUndefined();
  });
});

// ─── CARDS data integrity ─────────────────────────────────────────────────────

describe('CARDS data integrity', () => {
  test('has at least 2 cards', () => {
    expect(CARDS.length).toBeGreaterThanOrEqual(2);
  });

  test('all card IDs are unique', () => {
    const ids = CARDS.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every card has a non-empty title', () => {
    for (const card of CARDS) {
      expect(card.title.trim().length).toBeGreaterThan(0);
    }
  });

  test('every card has a non-empty icon', () => {
    for (const card of CARDS) {
      expect(card.icon.trim().length).toBeGreaterThan(0);
    }
  });

  test('every card has at least one trekId', () => {
    for (const card of CARDS) {
      expect(card.trekIds.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('gr10 card covers only gr10', () => {
    const gr10Card = CARDS.find(c => c.id === 'gr10')!;
    expect(gr10Card.trekIds).toContain('gr10');
    expect(gr10Card.trekIds).toHaveLength(1);
  });

  test('ossau card covers both ayous and artouste', () => {
    const ossauCard = CARDS.find(c => c.id === 'ossau')!;
    expect(ossauCard.trekIds).toContain('ayous');
    expect(ossauCard.trekIds).toContain('artouste');
  });
});

// ─── Filter logic (mirrors RetourScreen visible card logic) ───────────────────

describe('RetourScreen visible card filtering', () => {
  function getVisibleCards(activeTrekId: string | null) {
    return activeTrekId
      ? CARDS.filter(c => c.id === TREK_TO_CARD[activeTrekId])
      : CARDS;
  }

  test('no active trek → all cards visible', () => {
    expect(getVisibleCards(null)).toHaveLength(CARDS.length);
  });

  test('gr10 active → only gr10 card', () => {
    const cards = getVisibleCards('gr10');
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe('gr10');
  });

  test('ayous active → only ossau card', () => {
    const cards = getVisibleCards('ayous');
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe('ossau');
  });

  test('artouste active → only ossau card', () => {
    const cards = getVisibleCards('artouste');
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe('ossau');
  });

  test('bidarray-sare active → no cards (not yet mapped)', () => {
    // TREK_TO_CARD['bidarray-sare'] is undefined → filter matches nothing
    const cards = getVisibleCards('bidarray-sare');
    expect(cards).toHaveLength(0);
  });

  test('unknown trek → no cards shown', () => {
    expect(getVisibleCards('nonexistent')).toHaveLength(0);
  });
});
