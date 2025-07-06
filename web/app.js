function addListItem(list, text) {
  const li = document.createElement('li');
  li.textContent = text;
  list.appendChild(li);
}

document.getElementById('addPlayer').addEventListener('click', () => {
  const name = document.getElementById('playerName').value.trim();
  if (name) {
    addListItem(document.getElementById('playerList'), name);
    document.getElementById('playerName').value = '';
  }
});

document.getElementById('addVillage').addEventListener('click', () => {
  const coord = document.getElementById('villageCoord').value.trim();
  if (coord) {
    addListItem(document.getElementById('villageList'), coord);
    document.getElementById('villageCoord').value = '';
  }
});

async function runPlanCheck(input) {
  const lines = input.trim().split('\n');
  const planned = [];
  let currentPlayer = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (/^[A-ZĄĆĘŁŃÓŚŹŻa-z]/.test(line) && !line.includes('http')) {
      currentPlayer = line;
      continue;
    }
    const match = line.match(/village=(\d+).*?target=(\d+)/);
    if (match) {
      planned.push({
        player: currentPlayer || 'Nieznany',
        from: match[1],
        to: match[2],
        key: `${match[1]}->${match[2]}`
      });
    }
  }

  if (planned.length === 0) {
    alert('Nie znaleziono żadnych rozkazów w danych z planera.');
    return null;
  }

  // Poniższy kod wykorzystuje game_data tak jak oryginalny skrypt.
  const res = await fetch(`https://${game_data.world}.plemiona.pl/map/village.txt`);
  const txt = await res.text();
  const myVillageIDs = [];
  txt.trim().split('\n').forEach(line => {
    const [id, , , , owner] = line.split(',');
    if (owner == game_data.player.id) {
      myVillageIDs.push(parseInt(id));
    }
  });

  const sent = new Set();
  for (const id of myVillageIDs) {
    const url = `https://${game_data.world}.plemiona.pl/game.php?village=${id}&screen=info_village&id=${id}`;
    try {
      const r = await fetch(url);
      const html = await r.text();
      const div = document.createElement('div');
      div.innerHTML = html;
      const section = div.querySelector('#commands_outgoings');
      if (!section) continue;
      section.querySelectorAll(".command-row a[href*='village='][href*='target=']").forEach(a => {
        const m = a.href.match(/village=(\d+).*?target=(\d+)/);
        if (m) sent.add(`${m[1]}->${m[2]}`);
      });
    } catch (err) {
      console.warn(`Błąd pobierania rozkazów z wioski ${id}`, err);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  const stats = {};
  planned.forEach(({ player, key }) => {
    if (!stats[player]) stats[player] = { total: 0, sent: 0, missing: 0 };
    stats[player].total++;
    if (sent.has(key)) stats[player].sent++;
    else stats[player].missing++;
  });
  return stats;
}

document.getElementById('processPlan').addEventListener('click', async () => {
  const input = document.getElementById('planInput').value;
  if (!input) return alert('Brak danych!');
  const stats = await runPlanCheck(input);
  if (!stats) return;
  const table = document.getElementById('resultTable');
  table.innerHTML = '<tr><th>Gracz</th><th>Do wysłania</th><th>Wysłane</th><th>Nie wysłane</th></tr>';
  Object.entries(stats).forEach(([player, st]) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${player}</td><td>${st.total}</td><td>${st.sent}</td><td>${st.missing}</td>`;
    table.appendChild(row);
  });
});
