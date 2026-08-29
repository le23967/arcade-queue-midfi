import { Bars, User, Users, Play } from './Icons.jsx'

/* Device shell. The sketch draws a signal glyph in the corner of every screen,
   so the status bar is reproduced - flat, not chrome. */
export function Frame({ children, caption }) {
  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-gray-100 px-4 py-8">
      <header className="w-full max-w-[390px]">
        <h1 className="text-sm font-semibold text-gray-900">
          Arcade Comparison &mdash; mid-fi prototype
        </h1>
      </header>

      <div data-frame className="relative h-[calc(100vh-180px)] max-h-[720px] min-h-[560px] w-full max-w-[390px] overflow-hidden rounded-md border border-gray-400 bg-white">
        <StatusBar />
        <div className="absolute inset-x-0 bottom-0 top-7">{children}</div>
      </div>

      <footer className="w-full max-w-[390px]">
        <p className="text-xs text-gray-600">{caption}</p>
      </footer>
    </div>
  )
}

function StatusBar() {
  return (
    <div className="flex h-7 items-center justify-between border-b border-gray-300 bg-white px-4">
      <span className="text-[11px] font-semibold tabular-nums text-gray-900">
        12:38
      </span>
      <span className="flex items-end gap-[2px]" aria-hidden="true">
        <i className="block h-1.5 w-[3px] bg-gray-900" />
        <i className="block h-2 w-[3px] bg-gray-900" />
        <i className="block h-2.5 w-[3px] bg-gray-900" />
        <i className="ml-1 block h-2.5 w-4 border border-gray-900" />
      </span>
    </div>
  )
}

const TABS = [
  { id: 'arcades', label: 'Arcades', Icon: Bars },
  { id: 'watch', label: 'Watch', Icon: Play },
  { id: 'friends', label: 'Friends', Icon: Users },
  { id: 'me', label: 'Me', Icon: User },
]

export function TabBar({ active, onSelect, banner }) {
  return (
    <div className="border-t border-gray-300 bg-white">
      {banner}
      <nav className="grid grid-cols-4">
        {TABS.map(({ id, label, Icon }) => {
          const on = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-current={on ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
                on ? 'font-semibold text-gray-900' : 'text-gray-500'
              }`}
            >
              <Icon size={20} />
              {label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

/* Persistent way back into an active session from anywhere in the app. */
export function SessionBanner({ arcadeName, position, total, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between border-b border-gray-300 bg-gray-100 px-4 py-2 text-left"
    >
      <span className="text-xs text-gray-900">
        Checked in at <span className="font-semibold">{arcadeName}</span>
        {' · '}
        <span className="tabular-nums">
          #{position} of {total}
        </span>
      </span>
      <span className="text-xs font-semibold text-gray-900">View</span>
    </button>
  )
}
