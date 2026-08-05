import type { Page } from '@playwright/test';

export interface WebglTextureSnapshot {
  contextLosses: number;
  contextRestores: number;
  totalBytes: number;
  textureCount: number;
  textures: Array<{
    bytes: number;
    height: number;
    internalFormat: number;
    levels: number;
    width: number;
  }>;
}

declare global {
  interface Window {
    __mapglTextureDiagnostics?: {
      snapshot: () => WebglTextureSnapshot;
    };
  }
}

const INSTALL_TEXTURE_DIAGNOSTICS = () => {
  if (window.__mapglTextureDiagnostics) {
    return;
  }

  const textures = new Map<WebGLTexture, WebglTextureSnapshot['textures'][number]>();
  const bindings = new WeakMap<object, Map<number, WebGLTexture | null>>();
  let contextLosses = 0;
  let contextRestores = 0;

  window.addEventListener('webglcontextlost', () => {
    contextLosses += 1;
  });
  window.addEventListener('webglcontextrestored', () => {
    contextRestores += 1;
  });

  const bytesPerPixel = (internalFormat: number, format: number, type: number): number => {
    const gl = WebGL2RenderingContext.prototype;
    if (internalFormat === gl.RGBA32F || internalFormat === gl.RGBA32I || internalFormat === gl.RGBA32UI) {
      return 16;
    }
    if (internalFormat === gl.RGBA16F || internalFormat === gl.RGBA16I || internalFormat === gl.RGBA16UI) {
      return 8;
    }
    if (internalFormat === gl.RGBA8 || internalFormat === gl.RGBA8I || internalFormat === gl.RGBA8UI) {
      return 4;
    }
    if (format === gl.RGBA) {
      return type === gl.FLOAT || type === gl.HALF_FLOAT ? 16 : 4;
    }
    if (format === gl.RGB) {
      return 3;
    }
    if (format === gl.RG) {
      return 2;
    }
    return 1;
  };

  const mipmappedPixels = (width: number, height: number, levels: number, bytes: number): number => {
    let total = 0;
    let mipWidth = width;
    let mipHeight = height;
    for (let level = 0; level < levels; level += 1) {
      total += mipWidth * mipHeight * bytes;
      mipWidth = Math.max(1, Math.floor(mipWidth / 2));
      mipHeight = Math.max(1, Math.floor(mipHeight / 2));
    }
    return total;
  };

  const stateFor = (gl: object): Map<number, WebGLTexture | null> => {
    let state = bindings.get(gl);
    if (!state) {
      state = new Map();
      bindings.set(gl, state);
    }
    return state;
  };

  const patch = (
    prototype: object,
    name: string,
    handler: (original: (...args: any[]) => any, gl: any, args: any[]) => any
  ) => {
    const original = (prototype as any)[name];
    if (typeof original !== 'function' || original.__mapglTexturePatched) {
      return;
    }
    const wrapped = function (this: any, ...args: any[]) {
      return handler(original, this, args);
    };
    wrapped.__mapglTexturePatched = true;
    (prototype as any)[name] = wrapped;
  };

  const install = (prototype: object) => {
    patch(prototype, 'bindTexture', (original, gl, args) => {
      const result = original.apply(gl, args);
      stateFor(gl).set(args[0], args[1] ?? null);
      return result;
    });
    patch(prototype, 'texStorage2D', (original, gl, args) => {
      const result = original.apply(gl, args);
      const texture = stateFor(gl).get(args[0]);
      if (texture) {
        const [, levels, internalFormat, width, height] = args;
        textures.set(texture, {
          bytes: mipmappedPixels(width, height, levels, bytesPerPixel(internalFormat, internalFormat, 0)),
          height,
          internalFormat,
          levels,
          width,
        });
      }
      return result;
    });
    patch(prototype, 'texImage2D', (original, gl, args) => {
      const result = original.apply(gl, args);
      const texture = stateFor(gl).get(args[0]);
      if (texture && typeof args[3] === 'number' && typeof args[4] === 'number') {
        const [, , internalFormat, width, height, , format, type] = args;
        textures.set(texture, {
          bytes: width * height * bytesPerPixel(internalFormat, format, type),
          height,
          internalFormat,
          levels: 1,
          width,
        });
      }
      return result;
    });
    patch(prototype, 'deleteTexture', (original, gl, args) => {
      const result = original.apply(gl, args);
      if (args[0]) {
        textures.delete(args[0]);
      }
      return result;
    });
  };

  install(WebGLRenderingContext.prototype);
  install(WebGL2RenderingContext.prototype);

  window.__mapglTextureDiagnostics = {
    snapshot: () => {
      const values = [...textures.values()];
      return {
        contextLosses,
        contextRestores,
        totalBytes: values.reduce((sum, texture) => sum + texture.bytes, 0),
        textureCount: values.length,
        textures: values,
      };
    },
  };
};

export async function installWebglTextureDiagnostics(page: Page): Promise<void> {
  await page.addInitScript(INSTALL_TEXTURE_DIAGNOSTICS);
}

export async function readWebglTextureSnapshot(page: Page): Promise<WebglTextureSnapshot> {
  return page.evaluate(
    () =>
      window.__mapglTextureDiagnostics?.snapshot() ?? {
        contextLosses: 0,
        contextRestores: 0,
        totalBytes: 0,
        textureCount: 0,
        textures: [],
      }
  );
}
