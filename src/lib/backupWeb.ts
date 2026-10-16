// Browser-specific backup I/O: downloading and reading .json files.
import { restoreData, serializeData } from './backup'
import { dayKey } from './dates'

export function downloadBackup() {
  const blob = new Blob([JSON.stringify(serializeData(), null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `akis-yedek-${dayKey()}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

export async function restoreFromFile(file: File) {
  let data: unknown
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error("Dosya okunamadı. Akış'tan indirilmiş bir .json yedeği seçin.")
  }
  restoreData(data)
}
