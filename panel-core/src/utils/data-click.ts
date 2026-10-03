export function clearTooltipInteraction({
  setTooltipObject,
  setHoverInfo,
}: {
  setTooltipObject(info: any): void;
  setHoverInfo?(info: any): void;
}): void {
  setTooltipObject({});
  setHoverInfo?.({});
}
