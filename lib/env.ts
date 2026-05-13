import "server-only";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  footballDataToken: () => required("FOOTBALL_DATA_TOKEN"),
  youtubeApiKey: () => required("YOUTUBE_API_KEY"),
  youtubePrimaryChannelId: () => optional("YOUTUBE_PRIMARY_CHANNEL_ID"),
  youtubeFallbackChannelIds: () =>
    optional("YOUTUBE_FALLBACK_CHANNEL_IDS")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
};
