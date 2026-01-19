import vs from './arc-layer-vertex.glsl';
import {ArcLayer} from "@deck.gl/layers";

export default class GradientArcLayer extends ArcLayer {
    static componentName = 'gradient-arcs';
    getShaders() {
        return Object.assign({}, super.getShaders(), {
             vs
        });
    }
}

