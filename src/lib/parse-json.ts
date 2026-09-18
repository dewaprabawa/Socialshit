export async function parseJson<T = unknown>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error(
      res.status === 401
        ? "Sign in to continue."
        : `Empty response (${res.status})`
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Unexpected response (${res.status})`);
  }
}
