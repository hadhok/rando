import { CHECKLIST_DATA, CheckSection, CheckItem } from '../data/checklist';

describe('CHECKLIST_DATA structure', () => {
  test('is a non-empty array', () => {
    expect(Array.isArray(CHECKLIST_DATA)).toBe(true);
    expect(CHECKLIST_DATA.length).toBeGreaterThan(0);
  });

  test('has at least 6 sections', () => {
    expect(CHECKLIST_DATA.length).toBeGreaterThanOrEqual(6);
  });

  test('every section has a non-empty section name', () => {
    for (const section of CHECKLIST_DATA) {
      expect(typeof section.section).toBe('string');
      expect(section.section.trim().length).toBeGreaterThan(0);
    }
  });

  test('every section has at least one item', () => {
    for (const section of CHECKLIST_DATA) {
      expect(Array.isArray(section.items)).toBe(true);
      expect(section.items.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('section names are all unique', () => {
    const names = CHECKLIST_DATA.map(s => s.section);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('CHECKLIST_DATA items integrity', () => {
  const allItems = CHECKLIST_DATA.flatMap(s => s.items);

  test('all item IDs are unique', () => {
    const ids = allItems.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('all item IDs are non-empty strings', () => {
    for (const item of allItems) {
      expect(typeof item.id).toBe('string');
      expect(item.id.trim().length).toBeGreaterThan(0);
    }
  });

  test('all item names are non-empty strings', () => {
    for (const item of allItems) {
      expect(typeof item.name).toBe('string');
      expect(item.name.trim().length).toBeGreaterThan(0);
    }
  });

  test('vital is a boolean', () => {
    for (const item of allItems) {
      expect(typeof item.vital).toBe('boolean');
    }
  });

  test('weight is a non-negative number when present', () => {
    for (const item of allItems) {
      if (item.weight !== undefined) {
        expect(typeof item.weight).toBe('number');
        expect(item.weight).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('who is one of papa | fille | shared', () => {
    const valid = new Set(['papa', 'fille', 'shared']);
    for (const item of allItems) {
      expect(valid.has(item.who)).toBe(true);
    }
  });

  test('note is a string when present', () => {
    for (const item of allItems) {
      if (item.note !== undefined) {
        expect(typeof item.note).toBe('string');
      }
    }
  });

  test('there is at least one vital item', () => {
    expect(allItems.some(i => i.vital)).toBe(true);
  });
});

describe('CHECKLIST_DATA expected sections', () => {
  const sectionNames = CHECKLIST_DATA.map(s => s.section.toLowerCase());

  test('has a sleeping/shelter section', () => {
    const has = sectionNames.some(n => n.includes('couchage') || n.includes('abri') || n.includes('nuit'));
    expect(has).toBe(true);
  });

  test('has a navigation section', () => {
    const has = sectionNames.some(n => n.includes('navigation') || n.includes('carte'));
    expect(has).toBe(true);
  });

  test('has a water/food section', () => {
    const has = sectionNames.some(n => n.includes('eau') || n.includes('aliment') || n.includes('nourriture'));
    expect(has).toBe(true);
  });

  test('has a safety/health section', () => {
    const has = sectionNames.some(n => n.includes('sécurité') || n.includes('santé') || n.includes('médical'));
    expect(has).toBe(true);
  });
});

describe('CHECKLIST_DATA expected item categories', () => {
  const allItems = CHECKLIST_DATA.flatMap(s => s.items);
  const names = allItems.map(i => i.name.toLowerCase());

  test('has navigation item (téléphone or GPS or carte)', () => {
    const has = names.some(n => n.includes('téléphone') || n.includes('gps') || n.includes('carte') || n.includes('navigation'));
    expect(has).toBe(true);
  });

  test('has water-related item', () => {
    const has = names.some(n => n.includes('eau') || n.includes('gourde') || n.includes('filtre') || n.includes('bouteille'));
    expect(has).toBe(true);
  });

  test('has sleeping equipment', () => {
    const has = names.some(n =>
      n.includes('tarp') || n.includes('tente') || n.includes('sac de couchage') || n.includes('matelas')
    );
    expect(has).toBe(true);
  });

  test('has first-aid or medical items', () => {
    const has = names.some(n =>
      n.includes('trousse') || n.includes('pharmacie') || n.includes('médical') ||
      n.includes('pansement') || n.includes('tique') || n.includes('douleur') || n.includes('antiseptique')
    );
    expect(has).toBe(true);
  });

  test('has items attributed to papa', () => {
    expect(allItems.some(i => i.who === 'papa')).toBe(true);
  });

  test('has items attributed to fille', () => {
    expect(allItems.some(i => i.who === 'fille')).toBe(true);
  });

  test('has shared items', () => {
    expect(allItems.some(i => i.who === 'shared')).toBe(true);
  });
});

describe('CHECKLIST_DATA weight sanity', () => {
  const allItems = CHECKLIST_DATA.flatMap(s => s.items);
  const withWeight = allItems.filter(i => i.weight !== undefined);

  test('has some items with weight defined', () => {
    expect(withWeight.length).toBeGreaterThan(0);
  });

  test('no individual item weighs more than 10 kg (10000g)', () => {
    for (const item of withWeight) {
      expect(item.weight!).toBeLessThanOrEqual(10000);
    }
  });

  test('total weight of all items is under 30 kg', () => {
    const total = withWeight.reduce((sum, i) => sum + i.weight!, 0);
    expect(total).toBeLessThan(30000);
  });
});
