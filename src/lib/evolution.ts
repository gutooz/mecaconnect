// Cliente para integração com Evolution API (WhatsApp não-oficial).
// Docs: https://doc.evolution-api.com

interface EvolutionConfig {
  baseUrl: string;
  apiKey: string;
  instance: string;
}

function config(instance?: string): EvolutionConfig {
  return {
    baseUrl: process.env.EVOLUTION_API_URL ?? "",
    apiKey: process.env.EVOLUTION_API_KEY ?? "",
    instance: instance ?? process.env.EVOLUTION_INSTANCE_NAME ?? "mecaconnect",
  };
}

async function call<T>(path: string, init?: RequestInit, instance?: string): Promise<T> {
  const c = config(instance);
  if (!c.baseUrl || !c.apiKey) throw new Error("Evolution API não configurada (verifique .env)");
  const res = await fetch(`${c.baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: c.apiKey,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Evolution API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function createInstance(instance: string) {
  return call(`/instance/create`, {
    method: "POST",
    body: JSON.stringify({
      instanceName: instance,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
  });
}

export async function getInstanceStatus(instance: string) {
  return call<{ state: string }>(`/instance/connectionState/${instance}`);
}

export async function getQrCode(instance: string) {
  return call<{ base64?: string; code?: string }>(`/instance/connect/${instance}`);
}

export async function deleteInstance(instance: string) {
  return call(`/instance/delete/${instance}`, { method: "DELETE" });
}

export async function sendText(input: { instance: string; phone: string; text: string }) {
  const number = input.phone.replace(/\D/g, "");
  return call<{ key: { id: string } }>(`/message/sendText/${input.instance}`, {
    method: "POST",
    body: JSON.stringify({
      number,
      text: input.text,
    }),
  });
}

export async function sendMedia(input: {
  instance: string;
  phone: string;
  mediaUrl: string;
  caption?: string;
  mediaType: "image" | "video" | "document";
}) {
  const number = input.phone.replace(/\D/g, "");
  return call(`/message/sendMedia/${input.instance}`, {
    method: "POST",
    body: JSON.stringify({
      number,
      mediatype: input.mediaType,
      media: input.mediaUrl,
      caption: input.caption,
    }),
  });
}
