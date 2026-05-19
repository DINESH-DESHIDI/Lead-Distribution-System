type Client = {
  id: string;
  controller: ReadableStreamDefaultController;
};

// Global clients array persisted in-memory on persistent servers
let clients: Client[] = [];

export function addSseClient(id: string, controller: ReadableStreamDefaultController) {
  clients.push({ id, controller });
  console.log(`[SSE] Client connected. Total: ${clients.length}`);
}

export function removeSseClient(id: string) {
  clients = clients.filter((c) => c.id !== id);
  console.log(`[SSE] Client disconnected. Total: ${clients.length}`);
}

export function notifyClients(event: { type: string; data?: any }) {
  const encoder = new TextEncoder();
  let deadIds: string[] = [];

  clients.forEach((client) => {
    try {
      client.controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
      );
    } catch (e) {
      deadIds.push(client.id);
    }
  });

  if (deadIds.length > 0) {
    clients = clients.filter((c) => !deadIds.includes(c.id));
    console.log(`[SSE] Cleaned up ${deadIds.length} dead connections. Total active: ${clients.length}`);
  }
}
