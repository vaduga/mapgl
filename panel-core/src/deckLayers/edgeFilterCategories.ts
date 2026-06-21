export type EdgeFilterCategories = {
  categories: unknown[];
  categorySize: 1 | 2 | 3 | 4;
};

type EdgeFilterCategoryOptions = {
  baseCategories: unknown[];
  filterIncludesSkip: boolean;
  usesRendererNamespaceFiltering: boolean;
};

type EdgeFilterFeatureLike = {
  skip?: boolean;
  properties?: {
    style?: {
      group?: {
        groupIdx?: number;
      };
    };
    layerName?: string;
    graph?: {
      id?: string;
    };
  };
};

export function getEdgeFilterCategories({
  baseCategories,
  filterIncludesSkip,
  usesRendererNamespaceFiltering,
}: EdgeFilterCategoryOptions): EdgeFilterCategories {
  if (filterIncludesSkip) {
    return {
      categories: baseCategories.concat([[false], baseCategories[1]]),
      categorySize: 4,
    };
  }

  if (usesRendererNamespaceFiltering) {
    return {
      categories: baseCategories.concat([baseCategories[1]]),
      categorySize: 3,
    };
  }

  return {
    categories: baseCategories,
    categorySize: 2,
  };
}

export function getEdgeFilterCategory({
  feature,
  baseCategories,
  filterIncludesSkip,
  usesRendererNamespaceFiltering,
}: {
  feature: EdgeFilterFeatureLike;
  baseCategories: unknown[];
  filterIncludesSkip: boolean;
  usesRendererNamespaceFiltering: boolean;
}): unknown[] {
  const { style, layerName, graph } = feature.properties || {};
  const groupIdx = style?.group?.groupIdx;
  const neutralName = getFirstCategoryValue(baseCategories[1]);
  const lName = layerName ?? neutralName;
  const namespace = usesRendererNamespaceFiltering ? graph?.id : neutralName;
  const skip = Boolean(feature.skip);

  if (filterIncludesSkip) {
    return [groupIdx, lName, skip, namespace];
  }

  if (usesRendererNamespaceFiltering) {
    return [groupIdx, lName, namespace];
  }

  return [groupIdx, lName];
}

function getFirstCategoryValue(category: unknown): unknown {
  return Array.isArray(category) ? category[0] : category;
}
