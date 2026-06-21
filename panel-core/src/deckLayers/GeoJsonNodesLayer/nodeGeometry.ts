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
  const { style } = feature?.properties || {};
  const hasDonutChartIcon = Boolean(style?.arcs?.length);
  const sizeMultiplier = 1;

  return getResolvedCircleDiameter(feature, selectedNodeId) * sizeMultiplier;
};

export const getMaxResolvedIconSize = (feature: any) => {
  const { style } = feature?.properties || {};
  const hasDonutChartIcon = Boolean(style?.arcs?.length);
  const sizeMultiplier = 1;
  const diameter = feature?.properties?.style?.size ?? 0;

  return diameter * sizeMultiplier;
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
