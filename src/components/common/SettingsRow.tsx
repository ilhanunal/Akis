import type { ReactNode } from 'react'

export function SettingsRow({ id, title, description, children }: { id?: string; title: string; description: ReactNode; children?: ReactNode }) {
  return (
    <div id={id} className="flex scroll-mt-20 flex-wrap items-center justify-between gap-4 border-b border-line py-5 last:border-0">
      <div className="max-w-md">
        <h2 className="font-medium">{title}</h2>
        <div className="text-sm text-muted">{description}</div>
      </div>
      {children}
    </div>
  )
}
