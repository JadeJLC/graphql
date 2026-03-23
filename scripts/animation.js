/**
 * Animation de création du graphique au chargement de la page
 * (code généré par IA)
 * @param {SVGPathElement} element Le morceau du graphique à animer
 * @param {int} targetPercent Pourcentage finale à atteindre
 * @param {int} startPercent Pourcentage actuel
 * @param {int} radius Rayon du cercle
 * @param {int} cx Distance entre la gauche du cercle et le centre
 * @param {int} cy Distance entre le haut du cercle et le centre
 */
function animatePieChart(element, targetPercent, startPercent, radius, cx, cy) {
  const duration = 1300;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const easedProgress = 1 - Math.pow(1 - progress, 3);

    const currentPercent = targetPercent * easedProgress;
    const pathData = getPathData(currentPercent, startPercent, radius, cx, cy);

    element.setAttribute("d", pathData);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}

/**
 * Fonction assistante pour l'animation, récupère la trajectoire à parcourir à la construction du graphique
 * @param {int} percent Pourcentage actuel
 * @param {int} startPercent Pourcentage de départ
 * @param {int} radius Rayon du cercle
 * @param {int} cx Distance entre la gauche du cercle et le centre
 * @param {int} cy Distance entre le haut du cercle et le centre
 * @returns
 */
function getPathData(percent, startPercent, radius, cx, cy) {
  if (percent <= 0) return "";
  if (percent >= 100) percent = 99.99;

  const startAngle = (startPercent * 3.6 - 90) * (Math.PI / 180);
  const endAngle = ((startPercent + percent) * 3.6 - 90) * (Math.PI / 180);

  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);

  const largeArcFlag = percent > 50 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
}

function animateXPGraph(svgEl) {
  const line = svgEl.querySelector("polyline");
  const area = svgEl.querySelector("path");

  // --- Ligne ---
  const length = line.getTotalLength();
  line.style.strokeDasharray = length;
  line.style.strokeDashoffset = length;

  // --- Aire : clip-path ---
  const svgNS = "http://www.w3.org/2000/svg";
  const clipId = "xp-reveal-clip";
  const fullWidth = svgEl.viewBox.baseVal.width || svgEl.clientWidth;

  const clipPath = document.createElementNS(svgNS, "clipPath");
  clipPath.setAttribute("id", clipId);

  const rect = document.createElementNS(svgNS, "rect");
  rect.setAttribute("y", "0");
  rect.setAttribute("height", "100%");
  rect.style.width = "0px";

  clipPath.appendChild(rect);
  svgEl.querySelector("defs").appendChild(clipPath);
  area.setAttribute("clip-path", `url(#${clipId})`);

  // --- Force le reflow AVANT de déclencher l'animation ---
  void line.getBoundingClientRect();

  line.style.transition = "stroke-dashoffset 1.6s ease-in-out";
  rect.style.transition = "width 1.6s ease-in-out";
  line.style.strokeDashoffset = "0";
  rect.style.width = `${fullWidth}px`;
}

function animateTreeMap(tiles) {
  const totalDuration = 1.5; // Total time in seconds
  const stagger = totalDuration / tiles.length;

  tiles.forEach((tile, i) => {
    // 1. Set initial state to hidden
    tile.style.opacity = "0";

    // 2. Add the animation class
    tile.classList.add("animating-tile");

    // 3. Apply calculated delay
    tile.style.animationDelay = `${i * stagger}s`;
  });
}

export { animatePieChart, animateXPGraph, animateTreeMap };
