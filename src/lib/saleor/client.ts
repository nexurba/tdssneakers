import { saleorConfig } from "./config";

export interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

export class SaleorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaleorError";
  }
}

/**
 * Lightweight fetch-based GraphQL client for the Saleor API.
 * No heavy dependencies — works in both server and client components.
 */
export async function saleorFetch<T>({
  query,
  variables = {},
  signal,
}: {
  query: string;
  variables?: Record<string, unknown>;
  signal?: AbortSignal;
}): Promise<T> {
  if (!saleorConfig.apiUrl) {
    throw new SaleorError("NEXT_PUBLIC_SALEOR_API_URL is not configured.");
  }

  let response: Response;
  try {
    response = await fetch(saleorConfig.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      signal,
      // Cache product data for a short window on the server.
      next: { revalidate: 60 },
    } as RequestInit);
  } catch (err) {
    throw new SaleorError(
      `Impossible de joindre l'API Saleor: ${(err as Error).message}`
    );
  }

  if (!response.ok) {
    throw new SaleorError(
      `Saleor a répondu avec le statut ${response.status}`
    );
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors && json.errors.length > 0) {
    throw new SaleorError(json.errors.map((e) => e.message).join("; "));
  }

  if (!json.data) {
    throw new SaleorError("Réponse Saleor vide.");
  }

  return json.data;
}
