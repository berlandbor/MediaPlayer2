let stations = [];
const playlistGrid = document.getElementById("playlistGrid");
const fileInput = document.getElementById("fileInput");
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("visible");
});

window.onload = () => {
  const saved = localStorage.getItem("media_autoload");
  if (saved) {
    try {
      stations = JSON.parse(saved);
      renderGrid();
    } catch (e) {
      console.error("Ошибка чтения базы:", e);
    }
  }
};

fileInput.addEventListener("change", handleFile);

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const text = reader.result;
    const lines = text.split(/\r?\n/);
    const isM3U = file.name.endsWith(".m3u");

    stations = [];

    if (isM3U) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("#EXTINF")) {
          const nameMatch = line.match(/,(.+)$/);
          const name = nameMatch ? nameMatch[1].trim() : "Без названия";

          const logoMatch = line.match(/tvg-logo="(.*?)"/);
          let logo = logoMatch ? logoMatch[1].trim() : null;
          if (!logo || !logo.startsWith("http")) {
            logo = "https://via.placeholder.com/140x80?text=Канал";
          }

          const groupMatch = line.match(/group-title="(.*?)"/);
          const group = groupMatch ? groupMatch[1].trim() : null;

          const url = lines[i + 1]?.trim();
          if (url && !url.startsWith("#")) {
            stations.push({ name, url, logo, group });
            i++;
          }
        } else if (line && !line.startsWith("#")) {
          const name = line.split("/").pop();
          stations.push({ name, url: line, logo: "https://via.placeholder.com/140x80?text=Канал", group: null });
        }
      }
    } else {
      stations = lines.map(line => {
        const [name, url] = line.split(" - ");
        return { name: name?.trim(), url: url?.trim(), logo: "https://via.placeholder.com/140x80?text=Канал", group: null };
      }).filter(s => s.name && s.url);
    }

    if (stations.length) {
      localStorage.setItem("media_autoload", JSON.stringify(stations));
      renderGrid();
    } else {
      alert("Плейлист пуст или нераспознан.");
    }
  };

  reader.readAsText(file);
}

function renderGrid() {
  playlistGrid.innerHTML = "";
  stations.forEach((station, i) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.onclick = () => openPlayer(station, i);

    const img = document.createElement("img");
    img.src = station.logo;
    img.alt = station.name;

    const nameEl = document.createElement("span");
    nameEl.textContent = station.name;

    const groupEl = document.createElement("span");
    groupEl.style.fontSize = "12px";
    groupEl.style.opacity = "0.7";
    groupEl.textContent = station.group || "";

    tile.appendChild(img);
    tile.appendChild(nameEl);
    if (station.group) tile.appendChild(groupEl);

    playlistGrid.appendChild(tile);
  });
}

function openPlayer(station, index) {
  const encodedName = encodeURIComponent(station.name);
  const encodedUrl = encodeURIComponent(station.url);
  const encodedLogo = encodeURIComponent(station.logo || "");
  window.open(`player.html?name=${encodedName}&url=${encodedUrl}&logo=${encodedLogo}&index=${index}`, "_blank");
}

function clearAutoload() {
  localStorage.removeItem("media_autoload");
  stations = [];
  playlistGrid.innerHTML = "";
  alert("Плейлист очищен.");
}