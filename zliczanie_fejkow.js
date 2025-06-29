(async function(){
  const input = prompt("Wklej dane z Planera (linki + gracz)");
  if(!input) { return alert("Brak danych!"); }
  const lines = input.trim().split("\n");

  const planned = [];
  let currentPlayer = null;

  for(let line of lines){
    line = line.trim();
    if(/^([A-ZĄĆĘŁŃÓŚŹŻ]|[A-Z][a-z])/.test(line) && !line.includes("http")) {
      currentPlayer = line;
      console.log("Zmieniono gracza na:", currentPlayer);
      continue;
    }
    let m = line.match(/village=(\d+).*?target=(\d+)/);
    if(m){
      planned.push({player: currentPlayer, key: `${m[1]}->${m[2]}`});
      console.log("Planowany:", currentPlayer, m[1], "->", m[2]);
    }
  }

  console.log("Zaplanowane rozkazy:", planned.length);

  let resp = await fetch(`https://${game_data.world}.plemiona.pl/game.php?screen=overview_villages&mode=commands&ajax=1`, {credentials:'include'});
  let d = await resp.json();
  let div = document.createElement("div");
  div.innerHTML = d.commands_table;

  const sentSet = new Set();

  div.querySelectorAll("tr").forEach((row, i) => {
    let a = row.querySelector('a[href*="village="][href*="target="]');
    if(a){
      let m = a.href.match(/village=(\d+).*?target=(\d+)/);
      if(m){
        let key = `${m[1]}->${m[2]}`;
        sentSet.add(key);
        console.log("Wysłany z gry:", key);
      }
    }
  });

  console.log("Liczba rozkazów faktycznie wysłanych:", sentSet.size);

  const stats = {};
  for(let o of planned){
    stats[o.player] = stats[o.player] || {total:0, sent:0, missing:0};
    stats[o.player].total++;
    if(sentSet.has(o.key)) stats[o.player].sent++;
    else stats[o.player].missing++;
  }

  console.log("Statystyki per gracz:", stats);

  // Tworzenie tabeli
  const tbl = document.createElement("table");
  tbl.style = "border:1px solid #000;margin:10px;padding:5px;background:#fff";
  const hdr = tbl.insertRow();
  for(let h of ["Gracz","Do wysłania","Wysłane","Niewysłane"]){
    let th = document.createElement("th"); th.textContent=h;
    th.style = "border:1px solid #000;padding:4px";
    hdr.appendChild(th);
  }
  Object.entries(stats).forEach(([pl,st]) => {
    let row = tbl.insertRow();
    for(let v of [pl,st.total,st.sent,st.missing]){
      let td = row.insertCell(); td.textContent=v;
      td.style = "border:1px solid #000;padding:4px";
    }
  });
  document.body.prepend(tbl);
})();
