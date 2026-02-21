/**
 * SMS client using SMSAPI.pl REST API
 * https://api.smsapi.pl/sms.do
 */

const SMSAPI_BASE = "https://api.smsapi.pl";

export async function sendSms(phone: string, message: string): Promise<boolean> {
  const token = process.env.SMSAPI_TOKEN;
  const sender = process.env.SMSAPI_SENDER ?? "Karczma";

  if (!token) {
    console.warn(
      "[SMS] SMSAPI_TOKEN nie jest ustawiony — tryb demo, SMS nie zostanie wysłany"
    );
    return true;
  }

  try {
    const params = new URLSearchParams({
      to: normalizePhone(phone),
      message,
      from: sender,
      format: "json",
    });

    const res = await fetch(`${SMSAPI_BASE}/sms.do`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[SMS] Błąd SMSAPI:", res.status, text);
      return false;
    }

    const data = (await res.json()) as { count?: number; error?: number };
    if (data.error && data.error !== 0) {
      console.error("[SMS] SMSAPI zwróciło błąd:", data);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[SMS] Wyjątek podczas wysyłania SMS:", err);
    return false;
  }
}

function normalizePhone(phone: string): string {
  let p = phone.replace(/\s+/g, "").replace(/-/g, "");
  if (p.startsWith("00")) {
    p = p.slice(2);
  } else if (p.startsWith("0") && p.length === 9) {
    p = "48" + p;
  } else if (p.length === 9 && !p.startsWith("48")) {
    p = "48" + p;
  }
  return p;
}
