import { LayerExtension, project32, type DefaultProps, type Layer } from '@deck.gl/core';
import type { ShaderModule } from '@luma.gl/shadertools';
import { arcGeometryGLSL } from '../ArcLayer/arc-geometry.glsl';

const arcLabelModule = {
  name: 'arcLabelPosition',
  dependencies: [project32],
  vs: `${arcGeometryGLSL}
in vec3 instanceArcLabelTarget;
in vec2 instanceArcLabelShape;
vec4 arcLabelAnchorDelta;
`,
  inject: {
    'vs:#main-start': `
      vec3 source = instancePositions;
      vec3 target = instanceArcLabelTarget;
      float height = instanceArcLabelShape.x;
      vec4 midpoint;
      if (project.projectionMode == PROJECTION_MODE_GLOBE && project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
        vec3 sourceGlobe = project_globe_(vec3(source.xy, 0.0));
        vec3 targetGlobe = project_globe_(vec3(target.xy, 0.0));
        vec3 worldMidpoint = interpolateGreatCircle(
          source, target, sourceGlobe, targetGlobe, getAngularDist(source.xy, target.xy), 0.5, height
        );
        midpoint = project_position_to_clipspace(worldMidpoint, vec3(0.0), vec3(0.0));
      } else {
        vec3 commonMidpoint = interpolateFlat(
          project_position(source, vec3(0.0)), project_position(target, vec3(0.0)),
          0.5, height, instanceArcLabelShape.y
        );
        midpoint = project_common_position_to_clipspace(vec4(commonMidpoint, 1.0));
      }
      arcLabelAnchorDelta = midpoint - project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0));
    `,
    // Native glyph/background shaders apply their offsets around this anchor.
    'vs:DECKGL_FILTER_GL_POSITION': 'position += arcLabelAnchorDelta;',
  },
} as const satisfies ShaderModule;

/** Position native text glyphs and backgrounds with the same interpolation as arc strokes. */
export class ArcLabelExtension extends LayerExtension {
  static extensionName = 'ArcLabelExtension';
  static defaultProps: DefaultProps = {
    getArcLabelTarget: { type: 'accessor', value: (d: any) => d.targetPosition },
    getArcLabelShape: {
      type: 'accessor',
      value: (d: any) => [d.properties.arcStyle?.arcConfig?.height ?? 0.5, d.properties.tilt ?? 0],
    },
  };

  getShaders() {
    return { modules: [arcLabelModule] };
  }

  initializeState(this: Layer) {
    this.getAttributeManager()?.addInstanced({
      instanceArcLabelTarget: { size: 3, type: 'float32', accessor: 'getArcLabelTarget' },
      instanceArcLabelShape: { size: 2, accessor: 'getArcLabelShape' },
    });
  }
}
