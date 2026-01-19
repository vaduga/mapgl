import {ALERTING_STATES, DEFAULT_CLUSTER_BK_COLOR} from 'mapLib/utils';

function svgToDataURL(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// SVG donut chart for nodeGraph icons and clusters

function createDonutChart({colorCounts, radius = 45, userSvgUrl}) {
  const offsets: number[] = [];
  let total = 0

  const counts: any[] = Object.values(colorCounts)
  const colors: string[] = Object.keys(colorCounts)

  if (counts.length) {
    counts.forEach((item, i)=> {
      offsets.push(total);
      total += item.count;
    })
  }

  const r = radius
  const r0 = Math.round(r * 0.73);
  const w = r * 2;

  let svg = `
  <svg width='${w*2}' height='${w*2}' stroke-width='1' viewBox='0 0 ${w} ${w}' 
  xmlns='http://www.w3.org/2000/svg'  
  >`;

  // Mask
  svg += `<defs>
            <mask id='donutMask'>
              <circle cx='${r}' cy='${r}' r='${r0}' fill='white'/>
            </mask>
          </defs>`;

  // Drawing outer segments
  let startAngle = 0;

    for (let i = 0; i < counts.length; i++) {
      const endAngle = startAngle + (counts[i].count / total) * 360;
      svg += donutSegment(
          startAngle / 360,
          endAngle / 360,
          r,
          r0,
          colors[i]
      );
      startAngle = endAngle;
    }

  // Overlay the user SVG icon (centered)
  if (userSvgUrl) {
    const imageSize = r0 * 1.4; // Slightly smaller than the inner radius to fit well
    const imageX = r - imageSize / 2; // Centered X
    const imageY = r - imageSize / 2; // Centered Y

    svg += `
    <image href="${userSvgUrl}" x="${imageX}" y="${imageY}" 
      width="${imageSize}" height="${imageSize}" 
      preserveAspectRatio="xMidYMid meet" />
  `;
  }

  svg += `</svg>`;

  return svg;
}

function donutSegment(start, end, r, r0, color) {
  if (end - start === 1) {end -= 0.00001;}
  const a0 = 2 * Math.PI * (start - 0.25);
  const a1 = 2 * Math.PI * (end - 0.25);
  const x0 = Math.cos(a0),
    y0 = Math.sin(a0);
  const x1 = Math.cos(a1),
    y1 = Math.sin(a1);
  const largeArc = end - start > 0.5 ? 1 : 0;

  // draw an SVG path
  return `<path d="M ${r + r0 * x0} ${r + r0 * y0} L ${r + r * x0} ${
    r + r * y0
  } A ${r} ${r} 0 ${largeArc} 1 ${r + r * x1} ${r + r * y1} L ${r + r0 * x1} ${
    r + r0 * y1
  } A ${r0} ${r0} 0 ${largeArc} 0 ${r + r0 * x0} ${
    r + r0 * y0
  }" fill="${color}" />`;
}

export { svgToDataURL, createDonutChart };
