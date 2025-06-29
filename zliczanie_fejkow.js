(async function () {
  const input = prompt("Wklej dane z planera (zawierające linki do rozkazów).");
  if (!input) return alert("Brak danych.");

  const lines = input.trim().split("\n");

  const orders = [];
  let currentPlayer = null;

  for (let line of lines) {
    line = line.trim();

    // Wykrycie gracza (np. Haiden)
    if (/^[A-ZĄĆĘŁŃÓŚŹŻ]/.test(line) && !line.startsWith("http")) {
      currentPlayer = line;
      continue;
    }

    const match = line.match(/village=(\d+).*?target=(\d+)/);
    if (match) {
      orders.push({
        player: currentPlayer || "Nieznany",
        from: match[1],
        to: match[2],
        key: `${match[1]}->${match[2]}`
      });
    }
  }

  // Pobranie rozkazów wysłanych z gry (AJAX)
  const url = `https://${game_data.world}.plemiona.pl/game.php?screen=overview_villages&mode=commands&ajax=1`;
  const response = await fetch(url, { credentials: 'include' });
  const data = await response.json();

  const container = document.createElement('div');
  container.innerHTML = data.commands_table;
  const rows = container.querySelectorAll('tr');

  const sent = new Set();

  rows.forEach(row => {
    const link = row.querySelector('a[href*="village="][href*="target="]');
    if (link) {
      const href = link.getAttribute('href');
      const match = href.match(/village=(\d+).*?target=(\d+)/);
      if (match) {
        sent.add(`${match[1]}->${match[2]}`);
      }
    }
  });

  // Agregacja po graczu
  const stats = {};

  orders.forEach(order => {
    const { player, key } = order;
    if (!stats[player]) {
      stats[player] = {
        total: 0,
        sent: 0,
        missing: 0
      };
    }

    stats[player].total++;

    if (sent.has(key)) {
      stats[player].sent++;
    } else {
      stats[player].missing++;
    }
  });

  // Tworzenie tabeli
  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.margin = "20px";
  table.style.background = "#fff";

  const header = table.insertRow();
  ["Gracz", "Do wysłania", "Wysłane", "Nie wysłane"].forEach(text => {
    const th = document.createElement("th");
    th.textContent = text;
    th.style.border = "1px solid black";
    th.style.padding = "5px 10px";
    header.appendChild(th);
  });

  Object.entries(stats).forEach(([player, stat]) => {
    const row = table.insertRow();
    [player, stat.total, stat.sent, stat.missing].forEach(val => {
      const td = row.insertCell();
      td.textContent = val;
      td.style.border = "1px solid black";
      td.style.padding = "5px 10px";
    });
  });

  // Wyświetlenie tabeli na ekranie
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.top = "80px";
  wrapper.style.left = "50%";
  wrapper.style.transform = "translateX(-50%)";
  wrapper.style.background = "#f0f0f0";
  wrapper.style.padding = "20px";
  wrapper.style.zIndex = 9999;
  wrapper.style.boxShadow = "0 0 10px rgba(0,0,0,0.4)";
  wrapper.appendChild(table);

  const btn = document.createElement("button");
  btn.textContent = "Zamknij";
  btn.style.marginTop = "10px";
  btn.onclick = () => wrapper.remove();
  wrapper.appendChild(btn);

  document.body.appendChild(wrapper);
})();
