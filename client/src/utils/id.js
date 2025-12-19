export function nanoid() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID()
  }
  return `id-${Math.random().toString(16).slice(2)}-${Date.now()}`
}
