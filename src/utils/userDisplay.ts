export function getUserFullName(
  user: { fullName?: string; name?: string; email?: string } | null | undefined,
  fallback = 'TicketRemaster Guest',
): string {
  const explicitName = user?.fullName || user?.name
  if (explicitName) return explicitName

  const emailHandle = user?.email?.split('@')[0]
  if (!emailHandle) return fallback

  const derivedName = emailHandle
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  return derivedName || fallback
}
