import type { LayerExtension } from '@deck.gl/core';

/** Optional renderer contribution. The public renderer does not own its state or shaders. */
export interface PositionTransform {
  /** Declare positionTransform in extension defaultProps so composite layers forward the adapter. */
  readonly extensions: readonly LayerExtension[];
  layerProps(kind: string, context: any): Record<string, any>;
  shader(source: string, attributes: readonly string[]): string;
  point(position: readonly number[], source?: string, target?: string, weight?: number): number[];
}

export function positionTransformProps(transform: PositionTransform | undefined, kind: string, context: any) {
  return transform ? { positionTransform: transform, ...transform.layerProps(kind, context) } : {};
}

/** Preserve stock geometry and picking while allowing a contribution to adapt position reads. */
export function withPositionTransform<T extends new (...args: any[]) => any>(
  Base: T,
  attributes = ['instancePositions']
): T {
  class PositionLayer extends Base {
    static layerName = `Position${(Base as any).layerName}`;
    getShaders(...args: any[]) {
      const shaders = super.getShaders(...args);
      const transform = this.props.positionTransform as PositionTransform | undefined;
      return transform ? { ...shaders, vs: transform.shader(shaders.vs, attributes) } : shaders;
    }
  }
  return PositionLayer;
}
