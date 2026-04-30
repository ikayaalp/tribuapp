// Türkiye saat dilimi yardımcıları (UTC+3)
// PC saati yanlış olsa bile doğru Türkiye saatini hesaplar

const TURKEY_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3

/**
 * Türkiye saatine göre Date nesnesi döndürür.
 * Dikkat: Dönen Date'in getFullYear/getMonth/getDate/getHours
 * gibi UTC metodlarını kullanarak Türkiye zamanını alırsınız:
 *   getTurkeyNow().getUTCHours() → Türkiye saati
 */
export const getTurkeyNow = (): Date => {
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + TURKEY_OFFSET_MS);
};

const pad = (n: number) => n.toString().padStart(2, '0');

/** Türkiye tarihini YYYY-MM-DD formatında döndürür */
export const getTurkeyDateStr = (): string => {
  const tr = getTurkeyNow();
  return `${tr.getFullYear()}-${pad(tr.getMonth() + 1)}-${pad(tr.getDate())}`;
};

/** Bir Date nesnesini Türkiye tarihine çevirir (YYYY-MM-DD) */
export const toTurkeyDateStr = (d: Date): string => {
  const tr = new Date(d.getTime() + d.getTimezoneOffset() * 60000 + TURKEY_OFFSET_MS);
  return `${tr.getFullYear()}-${pad(tr.getMonth() + 1)}-${pad(tr.getDate())}`;
};

export const formatTurkeyTime = (dateString: string): string => {
  if (!dateString) return '';
  // Eğer API "2026-03-22 19:00:00" formatında ise, doğrudan saati al kopar:
  const parts = dateString.split(' ');
  if (parts.length > 1) {
    const timeParts = parts[1].split(':');
    if (timeParts.length >= 2) {
      return `${timeParts[0]}:${timeParts[1]}`;
    }
  }

  // Eğer gerçek ISO string (T ve Z içeriyorsa) geri dönüş hesaplaması yap:
  const d = new Date(dateString);
  const tr = new Date(d.getTime() + d.getTimezoneOffset() * 60000 + TURKEY_OFFSET_MS);
  return `${pad(tr.getHours())}:${pad(tr.getMinutes())}`;
};
