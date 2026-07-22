import { Graph } from '@mapgl/panel-core/graph';
import { DataFrame } from '@grafana/data';

export function parseRoute(dsTarget: unknown) {
  if (typeof dsTarget === 'string' && (dsTarget.startsWith('[') || !parseInt(dsTarget, 10))) {
    try {
      return JSON.parse(dsTarget) ?? dsTarget;
    } catch (error) {
      return dsTarget ?? null;
    }
  }

  return dsTarget ?? null;
}

export function getParPath(target, id, idx, locName) {
  const isArray = Array.isArray(target);

  if (!isArray) {
    if (typeof target === 'string') {
      return [locName, target];
    }
    //console.log('Wrong format: ' + toJS(target));
    return [];
  }

  const parPath: any = target;

  const isInitString =
    (Array.isArray(parPath) && typeof parPath[0] === 'string') ||
    (!Array.isArray(parPath[0]) && typeof parPath === 'string'); // #TODO : better handling for single names like [["U1"],"M1"]
  if (!isInitString) {
    // console.log(
    //   'Wrong path format: No coords, numbers, nulls allowed as 0 element), no deeper nesting arrays, or empty arrays. Info: id: ' +
    //     id +
    //     ' locName: ' +
    //     locName +
    //     ' target: ' +
    //     target
    // );
    return [];
  }

  const isSingle = Array.isArray(parPath) ? parPath.length === 1 : false;
  return isSingle ? [locName, parPath[0]] : parPath[0] !== locName ? [locName, ...parPath] : (parPath as []);
}

export function indexFields(frame: DataFrame) {
  const map: Record<string, any[]> = {};

  for (const field of frame.fields) {
    map[field.name] = field.values as any[];
  }

  return map;
}


export function findSubgraphById(graph: Graph, id: string): Graph | undefined {
  if (graph.id === id) {
    return graph;
  }

  for (const sub of graph.graphs()) {
    const found = findSubgraphById(sub, id);
    if (found) {
      return found;
    }
  }

  return undefined;
}
