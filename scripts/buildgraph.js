import {
  buildQuarters,
  buildTreemapTile,
  createColorPalette,
  buildPalette,
  areAdjacent,
  formatTime,
  countProjectsByCoworker,
} from "./helpers.js";
import {
  animatePieChart,
  animateRadialBars,
  animateTreeMap,
} from "./animation.js";

const ns = "http://www.w3.org/2000/svg";

/**
 * Fonction pour créer le graphique SVG de l'évolution de l'xp au fil du temps
 * @param {GraphQL data} transactions La liste des gains d'xp
 * @returns
 */
function createSVGLineChart(transactions) {
  const [ML, MT, W, H] = [70, 20, 710, 330];

  const quarters = buildQuarters(transactions);

  const timeStart = quarters[0].start.getTime();
  const timeEnd = quarters.at(-1).end.getTime();
  const MAX = Math.ceil(transactions.at(-1).xp / 10_000) * 10_000;

  const sx = (date) =>
    ML + ((new Date(date).getTime() - timeStart) / (timeEnd - timeStart)) * W;
  const sy = (xp) => MT + H - (xp / MAX) * H;

  const points = transactions.map(({ date, xp, projectxp, project }) => ({
    x: sx(date),
    y: sy(xp),
    xp,
    projectxp,
    date: formatTime(date),
    name: project,
  }));

  const ptStr = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const areaStr = `M${points[0].x},${MT + H} ${ptStr} L${points.at(-1).x},${MT + H}Z`;

  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const y = MT + i * (H / 4),
      val = MAX - i * (MAX / 4);
    return `
      <line x1="${ML}" y1="${y}" x2="${ML + W}" y2="${y}" stroke="white" stroke-width=".5" opacity=".15"/>
      <text x="${ML - 10}" y="${y + 5}" text-anchor="end">${val >= 1000 ? val / 1000 + "k" : val}</text>`;
  }).join("");

  const xLabels = quarters
    .map(({ label, start, end }) => {
      const xMid = sx(new Date((start.getTime() + end.getTime()) / 2));
      const xLine = sx(start);
      return `
      <line x1="${xLine}" y1="${MT}" x2="${xLine}" y2="${MT + H}" stroke="white" stroke-width=".5" opacity=".2" stroke-dasharray="4,4"/>
      <text x="${xMid}" y="${MT + H + 25}" text-anchor="middle" font-size="11">${label}</text>`;
    })
    .join("");

  const dots = points
    .map(
      ({ x, y }) => `
    <circle cx="${x}" cy="${y}" r="6"  fill="var(--violet)" opacity="0" pointer-events="none" class="xp-dot-vis"/>
    <circle cx="${x}" cy="${y}" r="12" fill="transparent"  class="xp-dot"/>
  `,
    )
    .join("");

  return {
    points,
    svg: `
      <defs>
        <linearGradient id="xp-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="var(--violet)"   stop-opacity=".6"/>
          <stop offset="100%" stop-color="var(--pale-sky)"  stop-opacity=".05"/>
        </linearGradient>
      </defs>

      <g stroke="white" stroke-width="1.5" opacity=".8">
        <line x1="${ML}" y1="${MT}"     x2="${ML}"        y2="${MT + H}"/>
        <line x1="${ML}" y1="${MT + H}" x2="${ML + W}"    y2="${MT + H}"/>
      </g>

      <g fill="var(--pale-sky)" font-family="var(--font-tech-ui)" font-size="13">
        ${yLabels}
        ${xLabels}
      </g>

      <path d="${areaStr}" fill="url(#xp-fill)"/>
      <polyline points="${ptStr}" fill="none" stroke="var(--violet)" stroke-width="2.5"
                stroke-linejoin="round" style="filter:drop-shadow(0 0 5px var(--violet))"/>
      ${dots}

      
    `,
  };
}

/**
 * Fabrique le graphique en SVG à partir des données du ratio
 * @param {object} ratio Ratio d'audit via l'xp donnée et reçue ratio{given, received, total}
 * @returns
 */
function createSVGPieChart(ratio) {
  const ratioChart = document.getElementById("ratio-chart");
  ratioChart.innerHTML = "";

  const slices = [
    {
      id: "given-xp",
      className: "audit-given",
      value: ratio.given,
      color: "var(--violet)",
    },
    {
      id: "received-xp",
      className: "audit-received",
      value: ratio.received,
      color: "var(--pale-sky)",
    },
  ];

  let currentStartPercent = 0;
  const radius = 45;
  const cx = 50;
  const cy = 50;

  slices.forEach((slice) => {
    const percent = (slice.value / ratio.total) * 100;
    const element = document.createElementNS(ns, "path");

    element.setAttribute("fill", slice.color);
    element.classList.add(slice.className);
    element.setAttribute("stroke", "var(--border-shine)");
    element.setAttribute("stroke-width", "0.8");

    const label = document.getElementById(slice.id);
    element.addEventListener("mouseenter", () => {
      label.classList.add("active");
      ratioChart.appendChild(element);
    });
    element.addEventListener("mouseleave", () =>
      label.classList.remove("active"),
    );

    setTimeout(() => {
      animatePieChart(element, percent, currentStartPercent, radius, cx, cy);
      ratioChart.appendChild(element);
      currentStartPercent += percent;
    }, 500);
  });
}

/**
 * Fabrique le graphique treemap à partir des données de projet
 * @param {object} projects La liste complète des projets catégorisés
 */
function createTreeMap(projects) {
  const container = document.getElementById("projects-graph");
  container.innerHTML = "";

  const getColor = createColorPalette();
  const palette = buildPalette();

  const groupMap = {};
  const standalone = [];

  for (const p of projects) {
    if (p.category === "main-project")
      groupMap[p.originalName] = { ...p, subs: [], type: "group" };
    else if (p.category === "stand-alone")
      standalone.push({ ...p, type: "standalone", totalXP: p.xp });
  }

  for (const p of projects.filter((p) => p.category?.includes("sub-project"))) {
    const parentName = p.category.slice("sub-project (".length, -1);
    groupMap[parentName]?.subs.push(p);
  }

  const items = [
    ...Object.values(groupMap).map((g) => ({
      ...g,
      totalXP: (g.xp || 0) + g.subs.reduce((sum, s) => sum + s.xp, 0),
    })),
    ...standalone,
  ].sort((a, b) => b.totalXP - a.totalXP);

  const maxXP = items[0].totalXP;

  const tiles = items.map((item) => {
    const ratio = item.totalXP / maxXP;
    const colSpan = Math.max(1, Math.round(Math.pow(ratio, 0.35) * 9));
    const rowSpan = Math.max(1, Math.ceil(Math.sqrt(ratio) * 4));

    const tile = buildTreemapTile(item.name, item.totalXP, item.type);
    Object.assign(tile.style, {
      gridColumn: `span ${colSpan}`,
      gridRow: `span ${rowSpan}`,
      overflow: "hidden",
    });
    tile._item = item;
    container.append(tile);
    return tile;
  });

  void container.offsetHeight;
  const rects = tiles.map((t) => t.getBoundingClientRect());

  const adj = tiles.map(() => new Set());
  for (let i = 0; i < tiles.length; i++)
    for (let j = i + 1; j < tiles.length; j++)
      if (areAdjacent(rects[i], rects[j])) {
        adj[i].add(j);
        adj[j].add(i);
      }

  const lru = Array(palette.length).fill(0);
  let tick = 0;
  const assigned = new Array(tiles.length).fill(-1);

  for (let i = 0; i < tiles.length; i++) {
    const forbidden = new Set(
      [...adj[i]].map((j) => assigned[j]).filter((c) => c !== -1),
    );
    const available = Array.from(
      { length: palette.length },
      (_, k) => k,
    ).filter((k) => !forbidden.has(k));
    const pool =
      available.length > 0
        ? available
        : Array.from({ length: palette.length }, (_, k) => k); // fallback
    const chosen = pool.reduce((best, k) => (lru[k] < lru[best] ? k : best));
    lru[chosen] = ++tick;
    assigned[i] = chosen;
  }

  tiles.forEach((tile, i) => {
    const colorIndex = assigned[i];
    const colors = getColor(colorIndex);
    const item = tile._item;

    Object.assign(tile.style, {
      backgroundColor: colors.bg,
      border: `2px double ${colors.border}`,
      color: colors.isLight ? "var(--dusk-blue)" : "var(--border-shine)",
    });

    if (item.type === "group") {
      const subs = [
        ...(item.xp
          ? [{ name: "principal", xp: item.xp, ogname: item.name }]
          : []),
        ...item.subs,
      ].sort((a, b) => b.xp - a.xp);

      for (const [idx, s] of subs.entries()) {
        const sub = buildTreemapTile(s.name, s.xp, "sub", s.ogname);
        const subColors = getColor(colorIndex, true, idx);
        sub.style.backgroundColor = subColors.bg;
        sub.style.flex = `${s.xp} ${s.xp} auto`;
        tile.append(sub);
      }
    }
  });
  animateTreeMap(tiles);
}

function createCollabCaption(coworker, colors) {
  const captionZone = document.getElementById("collab-names");

  const coworkerInfo = document.createElement("span");
  coworkerInfo.classList.add("collab-cw");
  coworkerInfo.id = coworker.login;
  coworkerInfo.style.backgroundColor = colors.bg;
  coworkerInfo.style.color = colors.isLight
    ? "var(--dusk-blue)"
    : "var(--border-shine)";
  coworkerInfo.innerHTML = `${coworker.firstName} ${coworker.lastName} (${coworker.login})`;

  captionZone.appendChild(coworkerInfo);
}

function createSVGRadialBarChart(organizedProjects) {
  const svg = document.getElementById("collab-graph");
  if (!svg) return;
  svg.innerHTML = "";

  const getColor = createColorPalette("arc");
  const collaborators = countProjectsByCoworker(organizedProjects);
  const details = document.getElementById("collab-details");

  if (collaborators.length === 0) return;

  // Make the SVG fill its container — viewBox is square so the chart is centred
  svg.setAttribute("viewBox", "0 0 400 400");
  svg.setAttribute("width", "70%");
  svg.setAttribute("height", "70%");

  const cx = 200;
  const cy = 200;
  const maxRadius = 175;
  const minRadius = 30;

  const usableRange = maxRadius - minRadius;
  const slotSize = Math.min(28, Math.floor(usableRange / collaborators.length));
  const ringWidth = Math.max(8, Math.floor(slotSize * 0.55));

  const maxCount = collaborators[0].count;

  // Arcs are collected here and passed to animate() so animation logic stays
  // completely separate from rendering logic.
  const arcs = [];

  collaborators.forEach((collab, i) => {
    const r = maxRadius - i * slotSize;
    if (r < minRadius) return;

    const circumference = 2 * Math.PI * r;
    const pct = Math.min(collab.count / maxCount, 1);
    const colorIndex = (i * 2) % 8;
    const color = getColor(colorIndex);

    // Background track
    const track = document.createElementNS(ns, "circle");
    track.setAttribute("cx", cx);
    track.setAttribute("cy", cy);
    track.setAttribute("r", r);
    track.setAttribute("fill", "none");
    track.setAttribute("stroke", "rgba(150,150,150,0.12)");
    track.setAttribute("stroke-width", ringWidth);
    svg.appendChild(track);

    // Coloured arc — hidden initially, revealed by animate()
    const arc = document.createElementNS(ns, "circle");
    arc.setAttribute("cx", cx);
    arc.setAttribute("cy", cy);
    arc.setAttribute("r", r);
    arc.setAttribute("fill", "none");
    arc.setAttribute("stroke", color.bg);
    arc.setAttribute("stroke-width", ringWidth);
    arc.setAttribute("stroke-dasharray", circumference);
    arc.setAttribute("stroke-dashoffset", circumference); // fully hidden
    arc.setAttribute("stroke-linecap", "round");
    arc.setAttribute("transform", `rotate(-90, ${cx}, ${cy})`);
    arc.style.transition = `stroke-dashoffset ${0.6 + i * 0.08}s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.06}s`;
    svg.appendChild(arc);

    // Hover → populate #collab-details

    createCollabCaption(collab, color);
    const caption = document.getElementById(collab.login);

    arc.addEventListener("mouseenter", () =>
      radialHoverEffect(collab, caption, details, "hover", arc),
    );

    caption.addEventListener("mouseenter", () =>
      radialHoverEffect(collab, caption, details, "hover", arc),
    );

    arc.addEventListener("mouseleave", () =>
      radialHoverEffect(collab, caption, details, "off", arc),
    );

    caption.addEventListener("mouseleave", () =>
      radialHoverEffect(collab, caption, details, "off", arc),
    );

    arcs.push({ arc, circumference, pct });
  });

  animateRadialBars(arcs);
}

function radialHoverEffect(collab, caption, details, mode, arc) {
  const displayName = collab.firstName
    ? `${collab.firstName}&nbsp${collab.lastName[0]}`.trim()
    : collab.login;
  const projectLabel =
    collab.projects.length === 1
      ? "1 projet"
      : `${collab.projects.length} projets`;

  const optionLabel =
    collab.subprojects.length === 0
      ? ""
      : collab.subprojects.length === 1
        ? "1 optionnel"
        : `${collab.subprojects.length} optionnels
    `;
  const projectNames = collab.projects.join(", ");

  switch (mode) {
    case "hover":
      if (details) {
        arc.style.cursor = "context-menu";
        details.innerHTML = `${displayName}.&nbsp-&nbsp${collab.count} (${projectLabel}, ${optionLabel})`;
        details.classList.add("capitalize");

        caption.style.filter = arc.style.filter = "brightness(1.3)";
      }
      return;

    case "off":
      if (details) {
        details.innerHTML = "Survolez un collègue pour les détails";
        details.classList.remove("capitalize");
        caption.style.filter = arc.style.filter = "";
      }
      return;
  }
}

export {
  createSVGLineChart,
  createSVGPieChart,
  createTreeMap,
  createSVGRadialBarChart,
};
