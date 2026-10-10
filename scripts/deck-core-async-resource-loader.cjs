// deck.gl 9.4.0 post-processes stale async props before rejecting them. For
// image props, that deletes the active texture and allocates an orphaned one.
const originalGuard =
  /(\.then\(data => \{\s*)if \(!this\.component\) \{(\s*)\/\/ This component state has been finalized/;

function patchAsyncResourceLoads(source) {
  const patched = source.replace(
    originalGuard,
    '$1if (!this.component || loadCount !== asyncProp.pendingLoadCount) {$2// Ignore finalized components and superseded loads before releasing resources.'
  );
  if (patched === source) {
    throw new Error('The deck.gl async-resource patch no longer matches ComponentState; review the dependency.');
  }
  return patched;
}

module.exports = patchAsyncResourceLoads;
module.exports.modulePattern =
  /[\\/]@deck\.gl[\\/]core[\\/](?:dist|dist\.webgl-only)[\\/]lifecycle[\\/]component-state\.js$/;
