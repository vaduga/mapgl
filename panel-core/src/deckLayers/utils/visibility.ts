export function isVisible(
  getVisLayers,
  args: { index: number | null; name: string | null; group: string | null }
) {
  const { index, name, group } = args;
  const [visible, indeterminate] = getVisLayers.getVisState(index, name, group) ?? [true, false];
  return visible && !indeterminate;
}
