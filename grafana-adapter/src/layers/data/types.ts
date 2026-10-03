import type { ArcOptionsEditor } from '../../editor/ArcOptionsEditor';
import type { GroupsEditor } from '../../editor/Groups/GroupsEditor';
import type { CapacityDimensionEditor } from '../../editor/Other/CapacityEditor';
import type { StyleEditor } from '../../editor/StyleEditor';
import type { getQueryFields } from '../../editor/getQueryFields';

/**
 * Panel editions can provide compatible editors when extending the core with additional layers.
 */
export interface DataLayerEditorAdapters {
  ArcOptionsEditor: typeof ArcOptionsEditor;
  CapacityDimensionEditor: typeof CapacityDimensionEditor;
  GroupsEditor: typeof GroupsEditor;
  StyleEditor: typeof StyleEditor;
  getQueryFields: typeof getQueryFields;
}
