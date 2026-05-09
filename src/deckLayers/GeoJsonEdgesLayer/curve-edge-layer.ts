import { Layer, project32, picking, UNIT, type Accessor, type Color, type DefaultProps, type LayerProps, type Unit } from '@deck.gl/core';
import { Geometry, Model } from '@luma.gl/engine';
import type { ShaderModule } from '@luma.gl/shadertools';

export enum CurveType {
  Line = 0,
  Bezier = 1,
  Arc = 2,
}

export type CurveEdgeSegment<DataT = any> = {
  feature: DataT;
  featureIndex: number;
  pickingIndex: number;
  type: CurveType;
  controlPoints: number[];
  segment: [number, number];
};

type CurveEdgeLayerProps<DataT> = {
  data: Array<CurveEdgeSegment<DataT>>;
  widthUnits?: Unit;
  widthScale?: number;
  widthMinPixels?: number;
  widthMaxPixels?: number;
  highlightOnly?: boolean;
  highlightMaxDepth?: number;
  highlightDimOpacity?: number;
  getControlPoints?: Accessor<CurveEdgeSegment<DataT>, number[]>;
  getCurveType?: Accessor<CurveEdgeSegment<DataT>, CurveType>;
  getSegment?: Accessor<CurveEdgeSegment<DataT>, [number, number]>;
  getWidth?: Accessor<CurveEdgeSegment<DataT>, number>;
  getColor?: Accessor<CurveEdgeSegment<DataT>, Color>;
  getHighlightDepth?: Accessor<CurveEdgeSegment<DataT>, number>;
} & LayerProps;

const DEFAULT_COLOR = [0, 0, 0, 255] as const;

const defaultProps: DefaultProps<CurveEdgeLayerProps<any>> = {
  widthUnits: 'pixels',
  widthScale: { type: 'number', min: 0, value: 1 },
  widthMinPixels: { type: 'number', min: 0, value: 0 },
  widthMaxPixels: { type: 'number', min: 0, value: Number.MAX_SAFE_INTEGER },
  highlightOnly: false,
  highlightMaxDepth: { type: 'number', min: 0, value: Number.MAX_SAFE_INTEGER },
  highlightDimOpacity: { type: 'number', min: 0, max: 1, value: 1 },
  getControlPoints: { type: 'accessor', value: (d: CurveEdgeSegment) => d.controlPoints },
  getCurveType: { type: 'accessor', value: (d: CurveEdgeSegment) => d.type },
  getSegment: { type: 'accessor', value: (d: CurveEdgeSegment) => d.segment },
  getWidth: { type: 'accessor', value: 1 },
  getColor: { type: 'accessor', value: DEFAULT_COLOR },
  getHighlightDepth: { type: 'accessor', value: 0 },
};

const curveUniforms = {
  name: 'curve',
  vs: `\
layout(std140) uniform curveUniforms {
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  float highlightMaxDepth;
  float highlightDimOpacity;
  highp int widthUnits;
  highp int highlightOnly;
} curve;
`,
  fs: `\
layout(std140) uniform curveUniforms {
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  float highlightMaxDepth;
  float highlightDimOpacity;
  highp int widthUnits;
  highp int highlightOnly;
} curve;
`,
  uniformTypes: {
    widthScale: 'f32',
    widthMinPixels: 'f32',
    widthMaxPixels: 'f32',
    highlightMaxDepth: 'f32',
    highlightDimOpacity: 'f32',
    widthUnits: 'i32',
    highlightOnly: 'i32',
  },
} as const satisfies ShaderModule<{
  widthScale: number;
  widthMinPixels: number;
  widthMaxPixels: number;
  highlightMaxDepth: number;
  highlightDimOpacity: number;
  widthUnits: number;
  highlightOnly: number;
}>;

const vs = `\
#version 300 es
#define SHADER_NAME curve-edge-layer-vertex-shader
#define LINE    0.0
#define BEZIER  1.0
#define ARC     2.0

in vec2 positions;
in vec2 instanceSegments;
in vec4 instancePositions1;
in vec4 instancePositions2;
in float instanceTypes;
in float instanceWidths;
in vec4 instanceColors;
in vec3 instancePickingColors;
in float instanceHighlightDepth;

out vec4 vColor;
out vec2 uv;
out float vHighlightDepth;

void interpolateLine(float t, vec2 start, vec2 end, out vec2 point) {
  point = mix(start, end, t);
}

void interpolateBezierCurve(float t, vec2 start, vec2 c1, vec2 c2, vec2 end, out vec2 point) {
  vec2 c = (c1 - start) * 3.0;
  vec2 e = (c2 - c1) * 3.0 - c;
  vec2 l = end - start - c - e;
  float t2 = t * t;
  float t3 = t2 * t;
  point = l * t3 + e * t2 + c * t + start;
}

void interpolateArc(float t, vec2 center, vec2 aAxis, vec2 bAxis, out vec2 point) {
  point = center + cos(t) * aAxis + sin(t) * bAxis;
}

vec2 getExtrusionOffset(vec2 lineClipspace, float offsetDirection, float width) {
  vec2 dirScreenspace = normalize(lineClipspace * project.viewportSize);
  dirScreenspace = vec2(-dirScreenspace.y, dirScreenspace.x);
  return dirScreenspace * offsetDirection * width / 2.0;
}

void main(void) {
  float r = instanceSegments.x + positions.x * instanceSegments.y;
  float rNext = r + instanceSegments.y;
  vec2 pointOnCurve;
  vec2 nextPointOnCurve;

  if (instanceTypes == BEZIER) {
    interpolateBezierCurve(r, instancePositions1.xy, instancePositions1.zw, instancePositions2.xy, instancePositions2.zw, pointOnCurve);
    interpolateBezierCurve(rNext, instancePositions1.xy, instancePositions1.zw, instancePositions2.xy, instancePositions2.zw, nextPointOnCurve);
  } else if (instanceTypes == ARC) {
    interpolateArc(r, instancePositions1.xy, instancePositions1.zw, instancePositions2.xy, pointOnCurve);
    interpolateArc(rNext, instancePositions1.xy, instancePositions1.zw, instancePositions2.xy, nextPointOnCurve);
  } else {
    interpolateLine(r, instancePositions1.xy, instancePositions1.zw, pointOnCurve);
    interpolateLine(rNext, instancePositions1.xy, instancePositions1.zw, nextPointOnCurve);
  }

  geometry.worldPosition = vec3(pointOnCurve, 0.0);
  geometry.worldPositionAlt = vec3(nextPointOnCurve, 0.0);
  geometry.uv = positions.xy;
  geometry.pickingColor = instancePickingColors;

  vec4 curr = project_position_to_clipspace(vec3(pointOnCurve, 0.0), vec3(0.0), vec3(0.0), geometry.position);
  vec4 next = project_position_to_clipspace(vec3(nextPointOnCurve, 0.0), vec3(0.0), vec3(0.0));

  float widthPixels = clamp(
    project_size_to_pixel(instanceWidths * curve.widthScale, curve.widthUnits),
    curve.widthMinPixels,
    curve.widthMaxPixels
  );
  vec3 offset = vec3(getExtrusionOffset(next.xy - curr.xy, positions.y, widthPixels), 0.0);

  DECKGL_FILTER_SIZE(offset, geometry);
  DECKGL_FILTER_GL_POSITION(curr, geometry);
  gl_Position = curr + vec4(project_pixel_size_to_clipspace(offset.xy), 0.0, 0.0);

  vColor = vec4(instanceColors.rgb, instanceColors.a * layer.opacity);
  uv = positions.xy;
  vHighlightDepth = instanceHighlightDepth;
  DECKGL_FILTER_COLOR(vColor, geometry);
}
`;

const fs = `\
#version 300 es
#define SHADER_NAME curve-edge-layer-fragment-shader
precision highp float;

in vec4 vColor;
in vec2 uv;
in float vHighlightDepth;
out vec4 fragColor;

void main(void) {
  if (curve.highlightOnly != 0 && vHighlightDepth > curve.highlightMaxDepth) {
    discard;
  }

  geometry.uv = uv;
  fragColor = vColor;
  if (curve.highlightOnly == 0 && vHighlightDepth > curve.highlightMaxDepth) {
    fragColor.a *= curve.highlightDimOpacity;
  }
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;

export class CurveEdgeLayer<DataT = any> extends Layer<Required<CurveEdgeLayerProps<DataT>>> {
  static layerName = 'CurveEdgeLayer';
  static defaultProps = defaultProps;

  state!: {
    model?: Model;
  };

  getShaders() {
    return super.getShaders({ vs, fs, modules: [project32, picking, curveUniforms] });
  }

  getBounds(): [number[], number[]] | null {
    return this.getAttributeManager()?.getBounds(['instancePositions']);
  }

  initializeState() {
    this.getAttributeManager()!.addInstanced({
      instancePositions: {
        size: 8,
        transition: true,
        accessor: 'getControlPoints',
        shaderAttributes: {
          instancePositions1: {
            size: 4,
          },
          instancePositions2: {
            size: 4,
            elementOffset: 4,
          },
        },
      },
      instanceSegments: {
        size: 2,
        accessor: 'getSegment',
      },
      instanceTypes: {
        size: 1,
        type: 'uint8',
        accessor: 'getCurveType',
      },
      instanceWidths: {
        size: 1,
        transition: true,
        accessor: 'getWidth',
        defaultValue: 1,
      },
      instanceColors: {
        size: this.props.colorFormat.length,
        type: 'unorm8',
        transition: true,
        accessor: 'getColor',
        defaultValue: DEFAULT_COLOR,
      },
      instancePickingColors: {
        size: 3,
        type: 'uint8',
        accessor: (object, { target: value }) => this.encodePickingColor(object.pickingIndex, value),
      },
      instanceHighlightDepth: {
        size: 1,
        accessor: 'getHighlightDepth',
        defaultValue: Number.MAX_SAFE_INTEGER,
      },
    });
  }

  updateState(params) {
    super.updateState(params);

    if (params.changeFlags.extensionsChanged) {
      this.state.model?.destroy();
      this.state.model = this._getModel();
      this.getAttributeManager()!.invalidateAll();
    }
  }

  getPickingInfo(params) {
    const info = super.getPickingInfo(params);
    const segment =
      (info.object as CurveEdgeSegment<DataT> | undefined)?.pickingIndex === info.index
        ? (info.object as CurveEdgeSegment<DataT>)
        : this.props.data.find((item) => item.pickingIndex === info.index);

    if (segment?.feature) {
      info.object = segment.feature;
      info.index = segment.featureIndex;
    }

    return info;
  }

  draw() {
    const {
      widthUnits,
      widthScale,
      widthMinPixels,
      widthMaxPixels,
      highlightOnly,
      highlightMaxDepth,
      highlightDimOpacity,
    } = this.props;
    const model = this.state.model!;

    model.shaderInputs.setProps({
      curve: {
        widthUnits: UNIT[widthUnits],
        widthScale,
        widthMinPixels,
        widthMaxPixels,
        highlightOnly: highlightOnly ? 1 : 0,
        highlightMaxDepth,
        highlightDimOpacity,
      },
    });
    model.draw(this.context.renderPass);
  }

  protected _getModel(): Model {
    return new Model(this.context.device, {
      ...this.getShaders(),
      id: this.props.id,
      bufferLayout: this.getAttributeManager()!.getBufferLayouts(),
      geometry: new Geometry({
        topology: 'triangle-strip',
        attributes: {
          positions: { size: 2, value: new Float32Array([0, -1, 1, -1, 0, 1, 1, 1]) },
        },
      }),
      isInstanced: true,
    });
  }
}
