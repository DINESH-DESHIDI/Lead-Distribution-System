import { NextRequest } from "next/server";
import { addSseClient, removeSseClient } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const clientId = crypto.randomUUID();

  const stream = new ReadableStream({
    start(controller) {
      addSseClient(clientId, controller);

      // 15-second keep-alive heartbeat to prevent gateway timeouts (e.g. on Render/Vercel)
      const interval = setInterval(() => {
        try {
          controller.enqueue(
            new TextEncoder().encode("data: " + JSON.stringify({ type: "ping" }) + "\n\n")
          );
        } catch (e) {
          clearInterval(interval);
          removeSseClient(clientId);
        }
      }, 15000);

      // Handle connection closures
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        removeSseClient(clientId);
      });
    },
    cancel() {
      removeSseClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
