import { getNodeIconAtlasSourceSize } from './svgIconAtlas';

export type UserSvgVariantKeyInput = {
  iconName?: string;
  tintMode: string;
  tintColor?: string;
  revision: number;
};

export type UserSvgAtlasDiagnostics = {
  ownershipGeneration: string;
  activeKeys: readonly string[];
  entryCount: number;
  sourceTier: number;
  width: number;
  height: number;
  estimatedRgbaBytes: number;
};

export type UserSvgAtlasPlan = {
  sourceTier: number;
  diagnostics: UserSvgAtlasDiagnostics;
};

export type UserSvgAtlasEntry = {
  key: string;
  url: string;
  width: number;
  height: number;
};

export type UserSvgIconMapping = Record<string, { x: number; y: number; width: number; height: number; mask: boolean }>;

export type UserSvgAtlas = {
  iconAtlas: string | null;
  iconMapping: UserSvgIconMapping;
};

export const BLANK_USER_SVG_ICON = '__blank_user_svg__';

const ICON_ATLAS_BUFFER = 4;
const ICON_ATLAS_WIDTH = 1024;

const escapeXmlAttribute = (value: string) => {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
};

const svgToDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export const getUserSvgVariantKey = ({
  iconName,
  tintMode,
  tintColor,
  revision,
}: UserSvgVariantKeyInput): string | undefined => {
  if (!iconName) {
    return undefined;
  }

  return `svg:${iconName}:${revision}:${tintMode}:${tintColor ?? 'base'}`;
};

export const createUserSvgAtlasPlan = (
  maxSizesByVariant: ReadonlyMap<string, number>,
  options: { revision: number; devicePixelRatio?: number; qualityMargin?: number }
): UserSvgAtlasPlan => {
  const activeKeys = [...maxSizesByVariant.keys()].sort();
  if (!activeKeys.length) {
    return {
      sourceTier: 0,
      diagnostics: {
        ownershipGeneration: `${options.revision}:empty`,
        activeKeys,
        entryCount: 0,
        sourceTier: 0,
        width: 0,
        height: 0,
        estimatedRgbaBytes: 0,
      },
    };
  }

  const entryCount = activeKeys.length;
  const requiredDisplaySize = Math.max(1, ...maxSizesByVariant.values());
  const sourceTier = getNodeIconAtlasSourceSize(entryCount, {
    requiredDisplaySize,
    devicePixelRatio: options.devicePixelRatio,
    qualityMargin: options.qualityMargin,
  });
  const cellSize = sourceTier + ICON_ATLAS_BUFFER;
  const width = ICON_ATLAS_WIDTH;
  const columns = Math.max(1, Math.floor(width / cellSize));
  const height = Math.ceil(entryCount / columns) * cellSize;

  return {
    sourceTier,
    diagnostics: {
      ownershipGeneration: `${options.revision}:${sourceTier}:${activeKeys.join('|')}`,
      activeKeys,
      entryCount,
      sourceTier,
      width,
      height,
      estimatedRgbaBytes: width * height * 4,
    },
  };
};

export const createUserSvgAtlas = (plan: UserSvgAtlasPlan, entries: readonly UserSvgAtlasEntry[]): UserSvgAtlas => {
  if (!plan.sourceTier || !plan.diagnostics.entryCount) {
    return { iconAtlas: null, iconMapping: {} };
  }

  const entriesByKey = new Map(entries.map((entry) => [entry.key, entry]));
  const cellSize = plan.sourceTier + ICON_ATLAS_BUFFER;
  const columns = Math.max(1, Math.floor(plan.diagnostics.width / cellSize));
  const iconMapping: UserSvgIconMapping = {
    [BLANK_USER_SVG_ICON]: { x: plan.sourceTier + 2, y: 1, width: 1, height: 1, mask: false },
  };
  const images: string[] = [];

  plan.diagnostics.activeKeys.forEach((key, keyIndex) => {
    const entry = entriesByKey.get(key);
    if (!entry) {
      iconMapping[key] = iconMapping[BLANK_USER_SVG_ICON];
      return;
    }

    const slotIndex = keyIndex;
    const slotX = (slotIndex % columns) * cellSize;
    const slotY = Math.floor(slotIndex / columns) * cellSize;
    const width = Math.max(1, Math.min(plan.sourceTier, Math.round(entry.width)));
    const height = Math.max(1, Math.min(plan.sourceTier, Math.round(entry.height)));
    const x = slotX + Math.floor((plan.sourceTier - width) / 2);
    const y = slotY + Math.floor((plan.sourceTier - height) / 2);

    iconMapping[key] = { x, y, width, height, mask: false };
    images.push(
      `<image href="${escapeXmlAttribute(entry.url)}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" />`
    );
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${plan.diagnostics.width}" height="${plan.diagnostics.height}" viewBox="0 0 ${plan.diagnostics.width} ${plan.diagnostics.height}">${images.join('')}</svg>`;

  return { iconAtlas: svgToDataUrl(svg), iconMapping };
};
