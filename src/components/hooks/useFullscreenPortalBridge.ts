import { RefObject, useEffect, useRef, useState } from 'react';

const FLOATING_BOUNDARY_ELEMENT_ID = 'floating-boundary';
const GRAFANA_PORTAL_CONTAINER_ID = 'grafana-portal-container';

type RestorableNode = {
  nextSibling: Node | null;
  originalParent: HTMLElement | null;
};

type PortalNodes = {
  floatingBoundary: HTMLElement | null;
  globalPortal: HTMLElement | null;
};

const findElementById = (root: HTMLElement, id: string) => {
  if (root.id === id) {
    return root;
  }

  return root.querySelector<HTMLElement>(`#${id}`);
};

const getPortalSearchRoot = (container: HTMLElement) => {
  for (let element = container.parentElement; element; element = element.parentElement) {
    if (findElementById(element, GRAFANA_PORTAL_CONTAINER_ID) || findElementById(element, FLOATING_BOUNDARY_ELEMENT_ID)) {
      return element;
    }
  }

  return container.ownerDocument.body;
};

const getPortalNodes = (root: HTMLElement): PortalNodes => ({
  floatingBoundary: findElementById(root, FLOATING_BOUNDARY_ELEMENT_ID),
  globalPortal: findElementById(root, GRAFANA_PORTAL_CONTAINER_ID),
});

const moveNode = (node: HTMLElement | null, target: HTMLElement, restoreRef: { current: RestorableNode | null }) => {
  if (!node || node === target || node.contains(target)) {
    return;
  }

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
  if (!node || !restoreRef.current?.originalParent) {
    return;
  }

  const { nextSibling, originalParent } = restoreRef.current;

  if (node.parentElement !== originalParent) {
    originalParent.insertBefore(node, nextSibling?.parentElement === originalParent ? nextSibling : null);
  }

  restoreRef.current = null;
};

export const useFullscreenPortalBridge = (fullscreenRef: RefObject<HTMLDivElement | null>) => {
  const [fullscreenContainer, setFullscreenContainer] = useState<HTMLElement | undefined>(undefined);
  const portalNodesRef = useRef<PortalNodes>({ floatingBoundary: null, globalPortal: null });
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
    const portalSearchRoot = getPortalSearchRoot(fullscreenContainer);

    const syncFullscreenPortals = () => {
      portalNodesRef.current = getPortalNodes(portalSearchRoot);

      const isMapFullscreen =
        doc.fullscreenElement === fullscreenContainer ||
        fullscreenContainer.classList.contains('deck-pseudo-fullscreen');
      const { globalPortal, floatingBoundary } = portalNodesRef.current;

      if (isMapFullscreen) {
        moveNode(globalPortal, fullscreenContainer, portalRestoreRef);
        moveNode(floatingBoundary, fullscreenContainer, boundaryRestoreRef);

        return;
      }

      restoreNode(globalPortal, portalRestoreRef);
      restoreNode(floatingBoundary, boundaryRestoreRef);
    };

    const observer = new MutationObserver(syncFullscreenPortals);
    observer.observe(fullscreenContainer, { attributeFilter: ['class'], attributes: true });
    observer.observe(portalSearchRoot, { childList: true, subtree: true });

    syncFullscreenPortals();
    // Fullscreen API changes are emitted at the document level.
    const abortController = new AbortController();
    doc.addEventListener('fullscreenchange', syncFullscreenPortals, { signal: abortController.signal });

    return () => {
      observer.disconnect();
      abortController.abort();
      restoreNode(portalNodesRef.current.globalPortal, portalRestoreRef);
      restoreNode(portalNodesRef.current.floatingBoundary, boundaryRestoreRef);
    };
  }, [fullscreenContainer]);

  return { fullscreenContainer };
};
