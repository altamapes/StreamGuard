export const getPossibleDates = (d: Date): string[] => {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  
  const mPad = String(m).padStart(2, '0');
  const dPad = String(day).padStart(2, '0');
  
  return [
    d.toLocaleDateString(),
    d.toLocaleDateString('en-US'),
    d.toLocaleDateString('en-GB'),
    d.toLocaleDateString('id-ID'),
    `${y}-${mPad}-${dPad}`,
    `${y}-${m}-${day}`,
    `${dPad}/${mPad}/${y}`,
    `${day}/${m}/${y}`,
    `${mPad}/${dPad}/${y}`,
    `${m}/${day}/${y}`
  ];
};
