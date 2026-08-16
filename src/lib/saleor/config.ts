export const saleorConfig = {
  apiUrl:
    process.env.NEXT_PUBLIC_SALEOR_API_URL ??
    "https://master.staging.saleor.cloud/graphql/",
  channel: process.env.NEXT_PUBLIC_SALEOR_CHANNEL ?? "default-channel",
  enabled: process.env.NEXT_PUBLIC_USE_SALEOR === "true",
};

export function isSaleorEnabled(): boolean {
  return saleorConfig.enabled && Boolean(saleorConfig.apiUrl);
}
