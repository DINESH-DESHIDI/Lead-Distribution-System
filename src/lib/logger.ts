export const systemLogs: string[] = [];

export function addLog(message: string) {
  const timestamp = new Date().toISOString().split("T")[1].slice(0, 8); // e.g. "16:25:30"
  const formatted = `[${timestamp}] ${message}`;
  console.log(formatted);
  systemLogs.unshift(formatted); // Add to the front so latest logs are shown first

  // Prevent memory leaks
  if (systemLogs.length > 200) {
    systemLogs.pop();
  }
}

export function getLogs() {
  return systemLogs;
}

export function clearLogs() {
  systemLogs.length = 0;
  addLog("Logs cleared.");
}
