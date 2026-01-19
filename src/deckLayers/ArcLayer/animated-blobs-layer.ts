import {ArcLayer} from "@deck.gl/layers";
import GradientArcLayer from "./gradient-arc-layer";
import {arcUniforms} from "./arc-layer-uniforms";

const defaultProps = {
    ...ArcLayer.defaultProps,
    coef: { type: "number", value: 1.0, min: 0.0, max: 1.0 },
    getSourceArrow: {type: 'accessor', value: 0},
    getTargetArrow: {type: 'accessor', value: 0},
};

export default class AnimatedBlobsLayer extends GradientArcLayer {
    static componentName = 'light-blobs'

    getShaders() {
        const shaders = super.getShaders();
        shaders.inject ={
            "vs:#decl": `

    in float arrowDir;
    in float arrow2Dir;
    out float vArrowDir;
    out float vArrow2Dir;
    `,
            "vs:#main-end": `
     float adjustedCoef = arc.coef;
    // if (vArrowDir == -1.0) {
    //     adjustedCoef = 1.0 - arc.coef;  // Reverse the direction of the animation
    // }
    // if (adjustedCoef == 0.0 || geometry.uv.x > adjustedCoef) {
    //     isValid = 0.0;
    // }


    vArrowDir = arrowDir;
    vArrow2Dir = arrow2Dir;
    `,
                "fs:#decl": `

     in float vArrowDir;
     in float vArrow2Dir;
    `,

                "fs:DECKGL_FILTER_COLOR": `
    // Check if both directions are zero, skip processing entirely if true
    if (vArrowDir == 0.0 && vArrow2Dir == 0.0) {
        discard;
    }

    float positionAlongArc1 = geometry.uv.x;
    float midpoint = 0.5;

    // Adjust coef for Blob 1 based on direction, or skip if direction is zero
    float adjustedCoef1 = arc.coef;
    float blob1Alpha = 0.0;
    if (vArrowDir != 0.0) {
        if (vArrowDir == 1.0) {
            adjustedCoef1 = arc.coef * 0.5;
        } else if (vArrowDir == -1.0) {
            adjustedCoef1 = 0.5 - (arc.coef * 0.5);
        }

        // Tail and head fade logic for Blob 1
        float tailLength1 = 0.05;
        float tailFadeDistance1 = 0.05;
        float tailEnd1 = adjustedCoef1 - tailLength1;
        float tailAlpha1 = smoothstep(tailEnd1 - tailFadeDistance1, tailEnd1, positionAlongArc1);

        float headFadeDistance1 = 0.05;
        float lowerBound1 = max(0.0, adjustedCoef1 - 0.05);
        float headAlpha1 = 1.0 - smoothstep(lowerBound1, adjustedCoef1, positionAlongArc1);

        blob1Alpha = headAlpha1 * tailAlpha1;
    }

    // Adjust coef for Blob 2 based on direction, or skip if direction is zero
    float adjustedCoef2 = arc.coef;
    float blob2Alpha = 0.0;
    if (vArrow2Dir != 0.0) {
        float positionAlongArc2 = geometry.uv.x;
        if (vArrow2Dir == 1.0) {
            adjustedCoef2 = 1.0 - (arc.coef * 0.5);
        } else if (vArrow2Dir == -1.0) {
            adjustedCoef2 = 0.5 + (arc.coef * 0.5);
        }

        // Tail and head fade logic for Blob 2
        float tailLength2 = 0.05;
        float tailFadeDistance2 = 0.05;
        float tailEnd2 = adjustedCoef2 - tailLength2;
        float tailAlpha2 = smoothstep(tailEnd2 - tailFadeDistance2, tailEnd2, positionAlongArc2);

        float headFadeDistance2 = 0.05;
        float lowerBound2 = max(0.0, adjustedCoef2 - 0.05);
        float headAlpha2 = 1.0 - smoothstep(lowerBound2, adjustedCoef2, positionAlongArc2);

        blob2Alpha = headAlpha2 * tailAlpha2;
    }

    // Combine both blobs' alpha effects and apply to color
    color.a *= (blob1Alpha + blob2Alpha);

    // Discard fully transparent fragments
    if (color.a == 0.0) {
        discard;
    }
`,
        }
        return {...shaders, modules: [...(shaders.modules.filter(m=>m.name !== 'arc')), arcUniforms]};
    }
    initializeState() {

        super.initializeState();

        this.getAttributeManager()?.addInstanced({
            arrowDir: {
                size: 1,
                accessor: 'getSourceArrow',
                defaultValue: 0
            },
            arrow2Dir: {
                size: 1,
                accessor: 'getTargetArrow',
                defaultValue: 0
            },
        });
    }

    defaultProps = defaultProps;

    draw({uniforms}) {
        // Get the current timestamp in seconds
        const timestamp = (performance.now() / 1000);  // Time in seconds
        const stepSize = 0.005;  // Smaller step size (e.g., increase by 0.02 each interval)
        const cycleDuration = 2;  // Speed up the full cycle to 2.5 seconds

        const bcoef = (timestamp % cycleDuration) / cycleDuration;
        const coef = Math.floor(bcoef / stepSize) * stepSize;

        // const bcoef2 = ((timestamp + cycleDuration / 2) % cycleDuration) / cycleDuration;  // Start at the midpoint of the arc
        // const coef2 = Math.floor(bcoef2 / stepSize) * stepSize;  // Step through 0.5, 0.505, 0.51, etc.


        // this.state.model?.setUniforms({
             // @ts-ignore
             //tailLength: this.props.tailLength,
             // @ts-ignore
             //animationSpeed: this.props.animationSpeed,
             //timestamp: (performance.now() / 1000) % 86400
         // });
        //super.draw(opts);

        this.state.model?.shaderInputs.setProps({
            arc: {coef}, // Map `coef` to the uniform block
        });

        super.draw({uniforms})

        // By default, the needsRedraw flag is cleared at each render. We want the layer to continue
        // refreshing.
        this.setNeedsRedraw();
    }
}


