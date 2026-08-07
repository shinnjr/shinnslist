'use client';

const VERTICALS = [
  { id: 'all', label: 'All Deals', icon: '🏷️' },
  { id: 'free-stuff', label: 'Free Stuff', icon: '🆓' },
  { id: 'trading-cards', label: 'Cards', icon: '🃏' },
  { id: 'sneakers', label: 'Sneakers', icon: '👟' },
  { id: 'watches', label: 'Watches', icon: '⌚' },
  { id: 'legos', label: 'Legos', icon: '🧱' },
  { id: 'handbags', label: 'Handbags', icon: '👜' },
  { id: 'electronics', label: 'Electronics', icon: '💻' },
  { id: 'cars', label: 'Cars', icon: '🚗' },
  { id: 'real-estate', label: 'Homes', icon: '🏠' },
  { id: 'rentals', label: 'Rentals', icon: '🏢' },
  { id: 'instruments', label: 'Instruments', icon: '🎸' },
  { id: 'art', label: 'Art', icon: '🎨' },
  { id: 'sports-outdoor', label: 'Outdoor', icon: '🏔️' },
  { id: 'baby-kids', label: 'Baby', icon: '👶' },
];

interface Props {
  active: string;
  onChange: (vertical: string) => void;
}

export default function VerticalFilter({ active, onChange }: Props) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
      {VERTICALS.map(v => {
        const isActive = active === v.id;
        return (
          <button
            key={v.id}
            onClick={() => onChange(v.id)}
            className={`flex min-h-[48px] items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-[0.97] border ${
              isActive
                ? 'bg-[var(--shinnslist-pink)]/15 border-[var(--shinnslist-pink)]/40 text-[var(--shinnslist-pink)]'
                : 'border-[var(--shinnslist-border)] text-[var(--shinnslist-muted)] hover:border-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="text-sm">{v.icon}</span>
            {v.label}
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-[var(--shinnslist-pink)] ml-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}
