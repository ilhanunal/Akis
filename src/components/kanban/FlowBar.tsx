import { STATUSES, STATUS_LABEL, type Status } from '../../types'

const SEG: Record<Status, string> = {
  todo: 'bg-todo/45',
  doing: 'bg-doing',
  done: 'bg-accent',
}

/** The board's progress band: one segment per column, flowing toward "done" as cards move. */
export function FlowBar({ counts, labels = STATUS_LABEL }: { counts: Record<Status, number>; labels?: Record<Status, string> }) {
  const total = counts.todo + counts.doing + counts.done
  const pct = total ? Math.round((counts.done / total) * 100) : 0
  return (
    <div className="mb-6">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted">
          {total === 0 ? (
            'Henüz görev yok. İlk görevini aşağıdan ekle.'
          ) : (
            <>
              <span className="font-medium text-ink">{counts.done}</span> / {total} görev tamamlandı
            </>
          )}
        </p>
        <span className="font-display text-2xl font-semibold tabular-nums text-accent">%{pct}</span>
      </div>
      <div
        className="flex h-3 gap-[3px] overflow-hidden rounded-full bg-sunken"
        role="img"
        aria-label={STATUSES.map((s) => `${labels[s]}: ${counts[s]}`).join(', ')}
      >
        {total > 0 &&
          STATUSES.map((s) => (
            <div
              key={s}
              data-status={s}
              className={`flow-seg h-full first:rounded-l-full last:rounded-r-full ${SEG[s]}`}
              style={{ flexGrow: counts[s], flexBasis: 0 }}
            />
          ))}
      </div>
    </div>
  )
}
