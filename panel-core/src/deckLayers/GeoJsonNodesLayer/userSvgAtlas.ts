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

  const entryCount = activeKeys.reduce((count, key) => count + (key.includes(':canvasTint:') ? 2 : 1), 1);
  const requiredDisplaySize = Math.max(1, ...maxSizesByVariant.values());
  const sourceTier = getNodeIconAtlasSourceSize(entryCount, {
    requiredDisplaySize,
    devicePixelRatio: options.devicePixelRatio,
    qualityMargin: options.qualityMargin,
  });
  const cellSize = sourceTier + 4;
  const width = 1024;
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
