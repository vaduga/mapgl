import React, { useSyncExternalStore } from 'react';
import type { GraphScene } from '../runtime/GraphScene';

interface TagLegendProps {
  scene: GraphScene;
  className?: string;
}

export function TagLegend({ scene, className }: TagLegendProps) {
  useSyncExternalStore((listener) => scene.subscribe(listener), () => scene.revision);
  const { visibility, render } = scene;
  const tagsByGroup = visibility.getTagLegendRows(render.features, true);
  if (!tagsByGroup.size) return null;
  const groupOrder = [
    { group: 'shared' as const, rule: undefined },
    ...render.groups.map((rule, index) => ({ group: rule.groupIdx ?? index, rule })),
    { group: undefined, rule: undefined },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      {groupOrder.map(({ group, rule }) => {
        const axes = tagsByGroup.get(group);
        if (!axes) return null;

        const label = group === 'shared' ? 'Shared' : rule?.label || rule?.color || 'Ungrouped';
        const selected = visibility.selectedTags.get(group);
        return (
          <div
            key={group ?? 'ungrouped'}
            role="group"
            aria-label={`${label} tags`}
            style={{
              '--tag-icon-color': rule?.color,
              display: 'grid',
              gridTemplateColumns: 'max-content minmax(0, 1fr)',
              columnGap: 8,
              alignItems: 'start',
            } as React.CSSProperties}
          >
            <div className={className}>
              <button
                type="button"
                className="tag-legend-reset"
                aria-label={`Reset tag selection for ${label}`}
                title="Reset tag selection"
                disabled={!selected?.size}
                onClick={() => scene.resetTags(group)}
              >
                ↺
              </button>
              <span>{label}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              {[...axes].sort(([a], [b]) => a - b).map(([axis, tags]) => {
                const axisSelection = selected?.get(axis);
                const hasActiveSelection = [...tags].some((tag) => axisSelection?.has(tag));
                const axisLabel = axis < 26 ? String.fromCharCode(65 + axis) : String(axis + 1);
                return (
                  <div className={className} key={axis} role="group" aria-label={`Axis ${axisLabel}`}>
                    {axes.size > 1 && <span aria-hidden="true">{axisLabel} │</span>}
                    {[...tags].sort().map((tag) => {
                      const pressed = axisSelection?.has(tag) ?? false;
                      const dimmed = hasActiveSelection && !pressed;
                      return (
                        <button
                          key={tag}
                          type="button"
                          aria-pressed={pressed}
                          style={dimmed ? { opacity: 0.45 } : undefined}
                          onClick={() => scene.toggleTag(group, tag, axis)}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
