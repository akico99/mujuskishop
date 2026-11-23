// 2026/27 season, per room per night in KRW. Dates are check-in dates.
(() => {
  const seasons = {
    low: { label: '비수기', silver: 123000, gold: 160000, royal: 190000 },
    shoulder: { label: '준성수기', silver: 160000, gold: 210000, royal: 245000 },
    high: { label: '성수기', silver: 260000, gold: 355000, royal: 405000 },
    peak: { label: '극성수기', silver: 340000, gold: 440000, royal: 520000 }
  };
  const calendar = {};
  function save(month, days, season) {
    for (const day of days) calendar[`${month}-${String(day).padStart(2, '0')}`] = season;
  }
  save('2026-12', Array.from({length:27}, (_,i)=>i+5), 'low');
  save('2026-12', [5,12,19,27,28,29,30], 'shoulder');
  save('2026-12', [24,25,26,31], 'peak');
  save('2027-01', Array.from({length:31}, (_,i)=>i+1), 'shoulder');
  save('2027-01', [8,15,22,29], 'high');
  save('2027-01', [1,2,9,16,23,30], 'peak');
  save('2027-02', Array.from({length:28}, (_,i)=>i+1), 'low');
  save('2027-02', [1,2,3,4,12,19,20,26,27,28], 'shoulder');
  save('2027-02', [5,6,7,8,21,22,23], 'high');

  function priceForDate(date) {
    return Object.hasOwn(calendar, date) ? seasons[calendar[date]] : null;
  }
  function quote(start, nights, counts) {
    const selected = ['silver','gold','royal'].filter(key => counts[key] > 0);
    const result = { total: 0, nights: [], selected, pending: [] };
    if (!selected.length) return result;
    const date = new Date(start + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !Number.isFinite(date.getTime()) ||
        date.toISOString().slice(0,10) !== start || !Number.isInteger(nights) || nights < 1 || nights > 90) {
      return { ...result, total: null, pending: ['숙박 시작일과 박수를 확인해 주세요.'] };
    }
    for (let i=0; i<nights; i++) {
      const iso = date.toISOString().slice(0,10);
      const rates = priceForDate(iso);
      const amount = rates ? selected.reduce((sum,key)=>sum+rates[key]*counts[key],0) : null;
      result.nights.push({date: iso, rates, amount});
      if (amount === null) result.pending.push(iso);
      else result.total += amount;
      date.setUTCDate(date.getUTCDate()+1);
    }
    if (result.pending.length) result.total = null;
    return result;
  }
  globalThis.ResortRooms = { priceForDate, quote };
})();
