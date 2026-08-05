export const getResolvedCircleDiameter = (feature: any, selectedNodeId?: string) => {
  const { style, locName } = feature?.properties || {};
  const isSelected = selectedNodeId === locName;
  const diameter = style?.size ?? 0;

  return isSelected ? diameter * 1.3 : diameter;
};

export const getResolvedPointRadius = (feature: any, selectedNodeId?: string) => {
  return getResolvedCircleDiameter(feature, selectedNodeId) / 2;
};

export const getResolvedIconSize = (feature: any, selectedNodeId?: string) => {
  return getResolvedCircleDiameter(feature, selectedNodeId);
};

export const getMaxResolvedIconSize = (feature: any) => {
  return feature?.properties?.style?.size ?? 0;
};

// The previous SVG donut used a radius of 50 and fitted the user icon into
// the square inscribed by its rounded 0.73 inner radius, with a 1.1 margin.
export const DONUT_USER_ICON_BOX_RATIO = ((Math.round(50 * 0.73) / 50) * 1.1) / Math.SQRT2;

export const getResolvedUserIconBoxSize = (feature: any, selectedNodeId?: string) => {
  const size = getResolvedIconSize(feature, selectedNodeId);
  return feature?.properties?.style?.arcs?.length ? size * DONUT_USER_ICON_BOX_RATIO : size;
};

export const getMaxNodeIconSizesByVariant = (
  properties: any[] | Record<string, any> | undefined,
  getVariantKey: (properties: any) => string | undefined
) => {
  const maxSizes = new Map<string, number>();

  for (const featureProperties of Object.values(properties ?? {})) {
    const variantKey = getVariantKey(featureProperties);
    const size = Number(featureProperties?.style?.size);

    if (!variantKey) {
      continue;
    }

    const normalizedSize = Number.isFinite(size) && size > 0 ? size : 0;
    maxSizes.set(variantKey, Math.max(maxSizes.get(variantKey) ?? 0, normalizedSize));
  }

  return maxSizes;
};

export const getResolvedNodeArcColors = (
  feature: any,
  properties: any[] | Record<string, any> | undefined,
  featureIds: ArrayLike<number> | undefined,
  index: number | undefined
) => {
  const featureProperties =
    feature?.properties ?? (Number.isInteger(index) && featureIds ? properties?.[featureIds[index!]] : undefined);
  return featureProperties?.style?.arcs;
};

export const getFittedIconSize = (targetBoxSize: number, width?: number, height?: number) => {
  if (!width || !height || width <= 0 || height <= 0) {
    return targetBoxSize;
  }

  const aspectRatio = width / height;
  return aspectRatio > 1 ? targetBoxSize / aspectRatio : targetBoxSize;
};

export const getFittedDimensions = (targetBoxSize: number, width?: number, height?: number) => {
  if (!width || !height || width <= 0 || height <= 0) {
    return { width: targetBoxSize, height: targetBoxSize };
  }

  const aspectRatio = width / height;
  return aspectRatio > 1
    ? { width: targetBoxSize, height: targetBoxSize / aspectRatio }
    : { width: targetBoxSize * aspectRatio, height: targetBoxSize };
};

export const getResolvedTextPixelOffset = (
  feature: any,
  selectedNodeId?: string,
  options?: { gap?: number; scale?: number }
) => {
  const gap = options?.gap ?? 0;
  const scale = options?.scale ?? 1;
  const circleDiameter = getResolvedCircleDiameter(feature, selectedNodeId) * scale;

  return [0, circleDiameter * 0.5 + gap];
};
