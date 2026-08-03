/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS?: Fetcher;
  DB: D1Database;
  IMAGES?: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        // ASSETS and IMAGES are available in deployed Workers, but Vinext's
        // local Vite worker has neither binding. Fetching the local asset URL
        // lets Vite serve the original image; without IMAGES Vinext then
        // returns that source as its safe optimization fallback.
        fetchAsset: (path) => {
          const assetRequest = new Request(new URL(path, request.url));
          return env.ASSETS ? env.ASSETS.fetch(assetRequest) : fetch(assetRequest);
        },
        ...(env.IMAGES
          ? {
              transformImage: async (body: ReadableStream, { width, format, quality }: { width: number; format: string; quality: number }) => {
                const result = await env.IMAGES!.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
                return result.response();
              },
            }
          : {}),
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
