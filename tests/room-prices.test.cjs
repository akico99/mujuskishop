const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = {};
const source = path.join(__dirname, '../room-prices.js');
if (fs.existsSync(source)) vm.runInNewContext(fs.readFileSync(source, 'utf8'), context);

test('photo calendar has all 86 priced nights and exact season changes', () => {
  assert.ok(context.ResortRooms, 'saved resort calendar must exist');
  // Each character is one calendar day: - unknown, L low, M shoulder, H high, P peak.
  const months = {
    '2026-12': '----MLLLLLLMLLLLLLMLLLLPPPMMMMP',
    '2027-01': 'PPMMMMMHPMMMMMHPMMMMMHPMMMMMHPM',
    '2027-02': 'MMMMHHHHLLLMLLLLLLM MHHHLLMMM'.replaceAll(' ', '')
  };
  const rates = { L: [123000,160000,190000], M: [160000,210000,245000], H: [260000,355000,405000], P: [340000,440000,520000] };
  let known = 0;
  for (const [month, days] of Object.entries(months)) {
    assert.equal(days.length, month.endsWith('02') ? 28 : 31);
    [...days].forEach((code, i) => {
      const date = `${month}-${String(i + 1).padStart(2,'0')}`;
      const actual = context.ResortRooms.priceForDate(date);
      if (code === '-') assert.equal(actual, null, date);
      else {
        known++;
        assert.deepEqual([actual.silver, actual.gold, actual.royal], rates[code], date);
      }
    });
  }
  assert.equal(known, 86);
});

test('multi-night price uses each check-in date and sums all room types', () => {
  assert.ok(context.ResortRooms);
  const result = context.ResortRooms.quote('2026-12-23', 3, { silver: 2, gold: 1, royal: 1 });
  assert.equal(result.total, (123000*2+160000+190000) + (340000*2+440000+520000)*2);
  assert.equal(result.nights.map(n=>n.date).join(','), '2026-12-23,2026-12-24,2026-12-25');
  assert.equal(context.ResortRooms.quote('2026-12-31', 2, {gold: 1}).total, 880000);
});

test('missing, out-of-calendar, and invalid stays never become a final zero or partial price', () => {
  assert.ok(context.ResortRooms);
  for (const [date, nights] of [['2026-12-04',2],['2027-02-28',2],['',1],['2027-02-30',1],['2027-01-01',0],['2027-01-01',1.5]]) {
    assert.equal(context.ResortRooms.quote(date, nights, {silver: 1}).total, null, `${date}/${nights}`);
  }
  assert.equal(context.ResortRooms.priceForDate('2027-03-01'), null);
  assert.equal(context.ResortRooms.quote('', 1, {}).total, 0);
});
