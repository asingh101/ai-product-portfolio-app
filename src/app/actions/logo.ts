const LOGO_SEARCH_URL =
  "https://logosearch-2v5b5jzesq-uc.a.run.app";

export async function searchCompanyDomain(
  companyName: string
): Promise<{ domain: string | null; error?: string }> {
  const trimmed = companyName.trim();
  if (!trimmed) return { domain: null, error: "Empty company name" };

  try {
    const res = await fetch(LOGO_SEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName: trimmed }),
    });

    if (!res.ok) {
      return { domain: null, error: `Logo search returned ${res.status}` };
    }

    const data = await res.json();
    return { domain: data.domain || null, error: data.error };
  } catch (err: any) {
    return { domain: null, error: err.message ?? "Unknown error" };
  }
}
