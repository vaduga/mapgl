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
  const sizeMultiplier = hasDonutChartIcon ? 1 : 0.9;

  return getResolvedCircleDiameter(feature, selectedNodeId) * sizeMultiplier;
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
