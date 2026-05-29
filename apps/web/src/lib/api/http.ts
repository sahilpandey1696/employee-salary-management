export async function readApiError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;

  return body?.error ?? "Request failed";
}

export async function assertOk(response: Response): Promise<void> {
  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}
