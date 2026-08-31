import { Users, Play, Bars, User } from './Icons.jsx'

/* Device shell. */
export function Frame({ children, caption }) {
  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-page px-4 py-8">
      <header className="w-full max-w-[390px]">
        <h1 className="font-display text-base font-bold tracking-tight text-ink">
          Arcade Circle
        </h1>
      </header>

      <div
        data-frame
        className="relative h-[calc(100vh-172px)] max-h-[720px] min-h-[560px] w-full max-w-[390px] overflow-hidden rounded-[28px] border border-line-strong bg-surface shadow-2xl"
      >
        <StatusBar />
        <div className="absolute inset-x-0 bottom-0 top-7">{children}</div>
      </div>

      <footer className="w-full max-w-[390px]">
        <p className="text-xs text-ink-muted">{caption}</p>
      </footer>
    </div>
  )
}

function StatusBar() {
  return (
    <div className="flex h-7 items-center justify-between bg-surface px-5">
      <span className="font-display text-[11px] font-semibold tabular-nums text-ink">
        12:38
      </span>
      <span className="flex items-end gap-[2px]" aria-hidden="true">
        <i className="block h-1.5 w-[3px] rounded-sm bg-ink" />
        <i className="block h-2 w-[3px] rounded-sm bg-ink" />
        <i className="block h-2.5 w-[3px] rounded-sm bg-ink" />
        <i className="ml-1 block h-2.5 w-4 rounded-[3px] border border-ink" />
      </span>
    </div>
  )
}

/* The project is about connecting the community rather than reading a queue,
   so people come first and the venue list sits behind them. */
export const TABS = [
  { id: 'friends', label: 'Circle', Icon: Users },
  { id: 'watch', label: 'Watch', Icon: Play },
  { id: 'arcades', label: 'Arcades', Icon: Bars },
  { id: 'me', label: 'Me', Icon: User },
]

export const TAB_IDS = TABS.map((t) => t.id)

export function TabBar({ active, onSelect, banner }) {
  return (
    <div className="border-t border-line bg-surface/95 backdrop-blur">
      {banner}
      <nav className="grid grid-cols-4 px-1 pb-1 pt-1">
        {TABS.map(({ id, label, Icon }) => {
          const on = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-current={on ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] transition-all duration-150 ease-soft active:scale-95 ${
                on ? 'font-semibold text-brand-600' : 'text-ink-subtle hover:text-ink-muted'
              }`}
            >
              <Icon size={21} />
              {label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export function SessionBanner({ arcadeName, position, total, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between border-b border-line bg-brand-50 px-4 py-2 text-left transition-colors duration-150 hover:bg-brand-100"
    >
      <span className="flex items-center gap-2 text-xs text-ink">
        <span className="relative flex h-2 w-2">
          <span className="anim-ring absolute inline-flex h-full w-full rounded-full bg-brand-500" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
        </span>
        In the queue at <span className="font-semibold">{arcadeName}</span>
        <span className="tabular-nums text-ink-muted">
          #{position}/{total}
        </span>
      </span>
      <span className="text-xs font-semibold text-brand-600">View</span>
    </button>
  )
}
