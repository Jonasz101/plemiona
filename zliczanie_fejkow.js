(async function () {
  const input = prompt("Wklej dane z planera (np. 'https://pl212...Wyślij fejk')");
  if (!input) return alert("Brak danych.");

  const lines = input.split('\n');
  const planned = lines
    .map(line => {
      const match = line.match(/village=(\d+)&screen=place&target=(\d+)/);
      if (!match) return null;
      return `${match[1]}->${match[2]}`;
    })
    .filter(Boolean);

  console.log(`📋 Rozkazy z planera: ${planned.length}`);

  const url = `https://${game_data.world}.plemiona.pl/game.php?screen=overview_villages&mode=commands&ajax=1`;

  const response = await fetch(url, { credentials: 'include' });
  const data = await response.json();

  const div = document.createElement('div');
  div.innerHTML = data.commands_table;
  const rows = div.querySelectorAll('tr');
  const sent = [];

  rows.forEach(row => {
    const a = row.querySelector('a[href*="village="][href*="target="]');
    if (!a) return;
    const href = a.getAttribute('href');
    const m = href.match(/village=(\d+)&.*target=(\d+)/);
    if (m) sent.push(`${m[1]}->${m[2]}`);
  });

  const sentSet = new Set(sent);
  const missing = planned.filter(r => !sentSet.has(r));
  const done = planned.filter(r => sentSet.has(r));

  alert(`✅ Wysłane: ${done.length}\n❌ Brakujące: ${missing.length}`);
  if (missing.length > 0) {
    console.log("⏳ Brakujące rozkazy:");
    missing.forEach(r => console.log(r));
  }
})();
