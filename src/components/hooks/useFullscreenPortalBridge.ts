import { RefObject, useEffect, useRef, useState } from 'react';

const FLOATING_BOUNDARY_ELEMENT_ID = 'floating-boundary';
const GRAFANA_PORTAL_CONTAINER_ID = 'grafana-portal-container';

type RestorableNode = {
  nextSibling: Node | null;
  originalParent: HTMLElement | null;
};

const moveNode = (node: HTMLElement, target: HTMLElement, restoreRef: { current: RestorableNode | null }) => {
  if (node.parentElement === target) {
    return;
  }

  if (!restoreRef.current) {
    restoreRef.current = {
      originalParent: node.parentElement,
      nextSibling: node.nextSibling,
    };
  }

  target.appendChild(node);
};

const restoreNode = (node: HTMLElement | null, restoreRef: { current: RestorableNode | null }) => {
  if (!node || !restoreRef.current?.originalParent || node.parentElement === restoreRef.current.originalParent) {
    return;
  }

  restoreRef.current.originalParent.insertBefore(node, restoreRef.current.nextSibling);
};

export const useFullscreenPortalBridge = (fullscreenRef: RefObject<HTMLDivElement | null>) => {
  const [fullscreenContainer, setFullscreenContainer] = useState<HTMLElement | undefined>(undefined);
  const portalRestoreRef = useRef<RestorableNode | null>(null);
  const boundaryRestoreRef = useRef<RestorableNode | null>(null);

  useEffect(() => {
    if (fullscreenRef.current && fullscreenContainer !== fullscreenRef.current) {
      setFullscreenContainer(fullscreenRef.current);
    }
  });

  useEffect(() => {
    if (!fullscreenContainer) {
      return;
    }

    const doc = fullscreenContainer.ownerDocument;

    const syncFullscreenPortals = () => {
      const isMapFullscreen =
        doc.fullscreenElement === fullscreenContainer ||
        fullscreenContainer.classList.contains('deck-pseudo-fullscreen');
      const globalPortal = doc.getElementById(GRAFANA_PORTAL_CONTAINER_ID);
      const floatingBoundary = doc.getElementById(FLOATING_BOUNDARY_ELEMENT_ID);

      if (isMapFullscreen) {
        if (globalPortal) {
          moveNode(globalPortal, fullscreenContainer, portalRestoreRef);
        }

        if (floatingBoundary) {
          moveNode(floatingBoundary, fullscreenContainer, boundaryRestoreRef);
        }

        return;
      }

      restoreNode(globalPortal, portalRestoreRef);
      restoreNode(floatingBoundary, boundaryRestoreRef);
    };

    const observer = new MutationObserver(syncFullscreenPortals);
    observer.observe(fullscreenContainer, { attributeFilter: ['class'], attributes: true });

    syncFullscreenPortals();
    // Fullscreen API changes are emitted at the document level.
    const abortController = new AbortController();
    doc.addEventListener('fullscreenchange', syncFullscreenPortals, { signal: abortController.signal });

    return () => {
      observer.disconnect();
      abortController.abort();
      restoreNode(doc.getElementById(GRAFANA_PORTAL_CONTAINER_ID), portalRestoreRef);
      restoreNode(doc.getElementById(FLOATING_BOUNDARY_ELEMENT_ID), boundaryRestoreRef);
    };
  }, [fullscreenContainer]);

  return { fullscreenContainer };
};
