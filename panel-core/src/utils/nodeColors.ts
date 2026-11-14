/** Select the shared canonical fill-color channel without copying it. */
export function selectGraphNodeFillColors(
  arrays: { readonly muted: Uint8Array; readonly annotations: Uint8Array },
  annotationsVisible: boolean
): Uint8Array {
  return annotationsVisible ? arrays.annotations : arrays.muted;
}
