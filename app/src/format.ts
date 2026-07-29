/** « Membre depuis le 3 mars 2026 », avec repli si la date est inexploitable. */
export function formatJoinedDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** « 12 membres », « 1 membre », « Aucun membre ». */
export function pluralizeMembers(count: number): string {
  if (count === 0) return 'Aucun membre';
  return `${count} membre${count > 1 ? 's' : ''}`;
}
