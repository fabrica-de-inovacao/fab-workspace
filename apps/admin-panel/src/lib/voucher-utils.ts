export function cleanVoucherCode(code: string): string {
  return code.replace(/[^A-Z0-9]/gi, '').toUpperCase()
}

export function formatVoucherCode(code: string): string {
  const clean = cleanVoucherCode(code)
  if (!clean) return ''
  if (clean.startsWith('FAB')) {
    const prefix = clean.slice(0, 3)
    const part1 = clean.slice(3, 7)
    const part2 = clean.slice(7, 11)
    const rest = clean.slice(11)
    const parts = [prefix, part1, part2, rest].filter(Boolean)
    return parts.join('-')
  }
  const chunks = clean.match(/.{1,4}/g)
  return chunks ? chunks.join('-') : clean
}
