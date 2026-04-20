import { RunRecord } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export async function getRuns(): Promise<RunRecord[]> {
  const response = await fetch(`${API_BASE_URL}/runs`, { cache: "no-store" });
  const data = await response.json();
  return data.runs ?? [];
}

export async function getRun(runId: string): Promise<RunRecord> {
  const response = await fetch(`${API_BASE_URL}/runs/${runId}`, { cache: "no-store" });
  return response.json();
}

export async function streamRun(
  prompt: string,
  onEvent: (eventName: string, payload: Record<string, unknown>) => void,
) {
  const response = await fetch(`${API_BASE_URL}/runs/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.body) {
    throw new Error("Streaming is not available.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const lines = chunk.split("\n");
      const eventLine = lines.find((line) => line.startsWith("event: "));
      const dataLine = lines.find((line) => line.startsWith("data: "));
      if (!eventLine || !dataLine) continue;
      const eventName = eventLine.replace("event: ", "").trim();
      const payload = JSON.parse(dataLine.replace("data: ", "").trim() || "{}");
      onEvent(eventName, payload);
    }
  }
}
