'use client';

interface Props {
  totalDeals: number;
  sourceCount: number;
  verticalCount: number;
  lastScraped?: string;
}

export default function StatsBar({ totalDeals, sourceCount, verticalCount, lastScraped }: Props) {
  const stats = [
    { label: 'Live deals', value: totalDeals.toLocaleString(), icon: '🏷️' },
    { label: 'Sources', value: sourceCount.toString(), icon: '🔍' },
    { label: 'Verticals', value: verticalCount.toString(), icon: '📊' },
  ];

  return (
    <div className="flex items-center gap-4 text-xs text-[var(--shinnslist-muted)] flex-wrap">
      {stats.map(s => (
        <span key={s.label} className="flex items-center gap-1">
          <span>{s.icon}</span>
          <span className="text-white font-semibold">{s.value}</span>
          <span>{s.label}</span>
        </span>
      ))}

      {lastScraped && (
        <span className="flex items-center gap-1 border-l border-[var(--shinnslist-border)] pl-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--shinnslist-green)]" />
          Updated {lastScraped}
        </span>
      )}
    </div>
  );
}
