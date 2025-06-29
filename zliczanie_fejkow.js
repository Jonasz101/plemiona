(async function () {
  const input = prompt("Wklej dane z planera (pełne, z linkami i nazwami graczy)");
  if (!input) return alert("Brak danych!");

  const lines = input.trim().split('\n');
  const planned = [];

  let currentPlayer = null;

  for (let line of lines) {
    line = line.trim();

    // Jeśli linia to nazwa gracza
    if (/^[A-ZĄĆĘŁŃÓŚŹŻ].*/.test(line) && !line.includes("http")) {
      currentPlayer = line;
    }

    // Jeśli zawiera link do rozkazu
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

  if (!planned.length) return alert("Nie znaleziono żadnych rozkazów.");

  // Pobieranie danych z gry (ajax overview commands)
  const response = await fetch(`https://${game_data.world}.plemiona.pl/game.php?screen=overview_villages&mode=commands&ajax=1`, {
    credentials: 'include'
  });

  const data = await response.json();
  const container = document.createElement('div');
  container.innerHTML = data.commands_table;

  const sentSet = new Set();

  container.querySelectorAll('tr').forEach(row => {
    const a = row.querySelector('a[href*="village="][href*="target="]');
    if (!a) return;
    const href = a.getAttribute('href');
    const m = href.match(/village=(\d+).*?target=(\d+)/);
    if (m) {
      sentSet.add(`${m[1]}->${m[2]}`);
    }
  });

  // Zliczanie statystyk dla graczy
  const playerStats = {};

  planned.forEach(({ player, key }) => {
    if (!playerStats[player]) {
      playerStats[player] = {
        total: 0,
        sent: 0,
        missing: 0
      };
    }

    playerStats[player].total++;
    if (sentSet.has(key)) {
      playerStats[player].sent++;
    } else {
      playerStats[player].missing++;
    }
  });

  // Tworzenie tabeli
  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.margin = "20px auto";
  table.style.background = "#fff";

  const header = table.insertRow();
  ["Gracz", "Wszystkie", "Wysłane", "Nie wysłane"].forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    th.style.border = "1px solid black";
    th.style.padding = "6px 12px";
    th.style.background = "#eee";
    header.appendChild(th);
  });

  Object.entries(playerStats).forEach(([player, stats]) => {
    const row = table.insertRow();
    [player, stats.total, stats.sent, stats.missing].forEach(val => {
      const td = row.insertCell();
      td.textContent = val;
      td.style.border = "1px solid black";
      td.style.padding = "6px 12px";
    });
  });

  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.top = "100px";
  wrapper.style.left = "50%";
  wrapper.style.transform = "translateX(-50%)";
  wrapper.style.background = "#f0f0f0";
  wrapper.style.padding = "20px";
  wrapper.style.zIndex = 9999;
  wrapper.style.boxShadow = "0 0 12px rgba(0,0,0,0.5)";
  wrapper.appendChild(table);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Zamknij";
  closeBtn.style.marginTop = "10px";
  closeBtn.onclick = () => wrapper.remove();
  wrapper.appendChild(closeBtn);

  document.body.appendChild(wrapper);
})();
