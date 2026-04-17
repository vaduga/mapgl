import { ALERTING_STATES } from 'mapLib/utils';

const MAX_ICON_SOURCE_SIZE = 1020;
const DONUT_SOURCE_SCALE = 4;
type CountEntry = { count: number; label?: string };
type CountMap = Record<string, number | CountEntry>;
type StripeItem = { color: string; count: number };
const ORDERED_ALERT_COLORS = [
  '__background__',
  ALERTING_STATES.Alerting,
  ALERTING_STATES.Pending,
  ALERTING_STATES.Normal,
];

function svgToDataURL(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// SVG donut chart for nodeGraph icons and clusters

function createDonutChart({
  colorCounts = {},
  stripeCounts,
  allTotal,
  radius = 45,
  bkColor,
  isDark = false,
  userSvgUrl,
}) {
  void isDark;

  const counts: CountEntry[] = Object.values(colorCounts);
  const colors: string[] = Object.keys(colorCounts);
  const total = allTotal ?? getTotalCount(counts);
  const stripeData = getStripeData({
    stripeCounts,
    total,
    bkColor,
  });

  const r = radius;
  const r0 = Math.round(r * 0.73);
  const ringRadius = (r + r0) / 2;
  const strokeWidth = r - r0;
  const w = r * 2;
  const sourceSize = getDonutIconSrcSize(w);

  let svg = `
  <svg width='${sourceSize}' height='${sourceSize}' stroke-width='1' viewBox='0 0 ${w} ${w}' 
  xmlns='http://www.w3.org/2000/svg'  
  >`;

  // Mask
  svg += `<defs>
            <mask id='donutMask'>
              <circle cx='${r}' cy='${r}' r='${r0}' fill='white'/>
            </mask>
          </defs>`;

  // Drawing outer segments
  let startFraction = 0;

  if (total > 0) {
    for (let i = 0; i < counts.length; i++) {
      const segmentFraction = counts[i].count / total;
      svg += donutSegment(startFraction, segmentFraction, r, ringRadius, strokeWidth, colors[i]);
      startFraction += segmentFraction;
    }
  }

  if (bkColor) {
    svg += `<circle cx='${formatSvgNumber(r)}' cy='${formatSvgNumber(r)}' r='${formatSvgNumber(r0)}' fill='${bkColor}'/>`;
  }

  // Drawing horizontal stripes inside the donut chart
  if (stripeData.total > 0) {
    const revertOffset = r - r0;
    let stripeOffset = revertOffset;

    for (const stripe of stripeData.items) {
      const stripeHeight = (stripe.count / stripeData.total) * (w - revertOffset * 2);
      svg += `<rect x='0' y='${formatSvgNumber(stripeOffset)}' width='${w}' height='${formatSvgNumber(
        stripeHeight
      )}' fill='${stripe.color}' mask='url(#donutMask)'/>`;
      stripeOffset += stripeHeight;
    }
  }

  // Overlay the user SVG icon (centered)
  if (userSvgUrl) {
    const imageSize = r0 * 1.7; // Slightly smaller than the inner radius to fit well
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

function donutSegment(startFraction, segmentFraction, center, ringRadius, strokeWidth, color) {
  if (startFraction >= 1 || segmentFraction <= 0) {
    return '';
  }

  const circumference = 2 * Math.PI * ringRadius;
  const segmentLength = circumference * segmentFraction;

  if (segmentFraction >= 1) {
    return `<circle cx="${formatSvgNumber(center)}" cy="${formatSvgNumber(center)}" r="${formatSvgNumber(
      ringRadius
    )}" fill="none" stroke="${color}" stroke-width="${formatSvgNumber(
      strokeWidth
    )}" />`;
  }

  return `<circle cx="${formatSvgNumber(center)}" cy="${formatSvgNumber(center)}" r="${formatSvgNumber(
    ringRadius
  )}" fill="none" stroke="${color}" stroke-width="${formatSvgNumber(
    strokeWidth
  )}" stroke-dasharray="${formatSvgNumber(segmentLength)} ${formatSvgNumber(
    circumference - segmentLength
  )}" stroke-dashoffset="${formatSvgNumber(-circumference * startFraction)}" transform="rotate(-90 ${formatSvgNumber(
    center
  )} ${formatSvgNumber(center)})" />`;
}

function formatSvgNumber(value: number) {
  return Number(value.toFixed(4));
}

function getTotalCount(counts: CountEntry[]) {
  let total = 0;

  for (const item of counts) {
    total += item.count;
  }

  return total;
}

function getStripeData({
  stripeCounts,
  total,
  bkColor,
}: {
  stripeCounts?: CountMap;
  total: number;
  stripeTotal?: number;
  bkColor: string;
}) {
  if (!stripeCounts && !bkColor) {
    return { items: [] as StripeItem[], total: 0 };
  }

  const normalizedCounts: CountMap = { ...(stripeCounts ?? {}) };
  const stripeTotal = getTotalCount(Object.values(normalizedCounts) as CountEntry[]);
  const unknownCount = Math.max(0, total - stripeTotal);

  if ( unknownCount > 0 ) {
    normalizedCounts[bkColor] = {
      count: unknownCount,
      label: 'Unknown',
    };
  }

  const orderedColors = ORDERED_ALERT_COLORS.map((color) => (color === '__background__' ? bkColor : color));
  const items: StripeItem[] = [];
  let resolvedTotal = 0;

  for (const color of orderedColors) {
    const value = normalizedCounts[color];
    const count = normalizeStripeCount(value);
    if (count <= 0) {
      continue;
    }

    items.push({ color, count });
    resolvedTotal += count;
  }

  if (!items.length) {
    for (const [color, value] of Object.entries(normalizedCounts)) {
      const count = normalizeStripeCount(value);
      if (count <= 0) {
        continue;
      }

      items.push({ color, count });
      resolvedTotal += count;
    }
  }

  return { items, total: resolvedTotal };
}

function normalizeStripeCount(value: number | CountEntry) {
  if (typeof value === 'number') {
    return value;
  }

  if (value && typeof value.count === 'number') {
    return value.count;
  }

  return 0;
}

function getDonutIconSrcSize(size: number) {
  return Math.min(Math.max(size, size * DONUT_SOURCE_SCALE), MAX_ICON_SOURCE_SIZE);
}

export { svgToDataURL, createDonutChart, getDonutIconSrcSize };
