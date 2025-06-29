// ✅ Skrypt Plemiona: Zliczanie rozkazów z planera vs. faktycznie wysłane (dla wszystkich wiosek gracza)

(async function() {
  alert("Skrypt uruchomiony! Wczytywanie danych z planera...");

  const input = prompt("Wklej dane z Planera (zawierające linki + graczy)");
  if (!input) return alert("Brak danych!");

  const lines = input.trim().split("\n");
  const planned = [];
  let currentPlayer = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (/^[A-ZĄĆĘŁŃÓŚŹŻa-z]/.test(line) && !line.includes("http")) {
      currentPlayer = line;
      continue;
    }
    const match = line.match(/village=(\d+).*?target=(\d+)/);
    if (match) {
      planned.push({
        player: currentPlayer || "Nieznany",
        from: match[1],
        to: match[2],
        key: `${match[1]}->${match[2]}`
      });
    }
  }

  if (planned.length === 0) return alert("Nie znaleziono żadnych rozkazów w danych z planera.");

  alert("Wczytywanie wysłanych rozkazów z wiosek...");

  // Pobranie listy wiosek gracza
  const res = await fetch(`https://${game_data.world}.plemiona.pl/map/village.txt`);
  const txt = await res.text();

  const villageLines = txt.trim().split("\n");
  const myVillageIDs = [];
  for (let line of villageLines) {
    const [id, name, x, y, owner] = line.split(",");
    if (owner == game_data.player.id) {
      myVillageIDs.push(parseInt(id));
    }
  }

  // Pobranie rozkazów dla każdej wioski
  const sent = new Set();

  for (const id of myVillageIDs) {
    const url = `https://${game_data.world}.plemiona.pl/game.php?village=${id}&screen=info_village&id=${id}`;
    try {
      const r = await fetch(url);
      const html = await r.text();
      const div = document.createElement("div");
      div.innerHTML = html;
      const section = div.querySelector("#commands_outgoings");
      if (!section) continue;
      section.querySelectorAll(".command-row a[href*='village='][href*='target=']").forEach(a => {
        const m = a.href.match(/village=(\d+).*?target=(\d+)/);
        if (m) {
          sent.add(`${m[1]}->${m[2]}`);
        }
      });
    } catch (err) {
      console.warn(`Błąd pobierania rozkazów z wioski ${id}`, err);
    }
    await new Promise(r => setTimeout(r, 200)); // oddech dla serwera
  }

  // Porównanie z planem
  const stats = {};
  planned.forEach(({ player, key }) => {
    if (!stats[player]) stats[player] = { total: 0, sent: 0, missing: 0 };
    stats[player].total++;
    if (sent.has(key)) stats[player].sent++;
    else stats[player].missing++;
  });

  // Tabela wynikowa
  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.margin = "20px auto";
  table.style.background = "#fff";
  const header = table.insertRow();
  ["Gracz", "Do wysłania", "Wysłane", "Nie wysłane"].forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    th.style.border = "1px solid #000";
    th.style.padding = "6px 12px";
    th.style.background = "#ddd";
    header.appendChild(th);
  });

  Object.entries(stats).forEach(([player, st]) => {
    const row = table.insertRow();
    [player, st.total, st.sent, st.missing].forEach(val => {
      const td = row.insertCell();
      td.textContent = val;
      td.style.border = "1px solid #000";
      td.style.padding = "6px 12px";
    });
  });

  const wrap = document.createElement("div");
  wrap.style.position = "fixed";
  wrap.style.top = "80px";
  wrap.style.left = "50%";
  wrap.style.transform = "translateX(-50%)";
  wrap.style.background = "#f9f9f9";
  wrap.style.padding = "20px";
  wrap.style.zIndex = 9999;
  wrap.style.boxShadow = "0 0 12px rgba(0,0,0,0.4)";
  wrap.appendChild(table);

  const btn = document.createElement("button");
  btn.textContent = "Zamknij";
  btn.style.marginTop = "10px";
  btn.onclick = () => wrap.remove();
  wrap.appendChild(btn);

  document.body.appendChild(wrap);
})();
