import { useAppState } from './context'
import { downloadExportJson } from '../core/persistence'

export function Topbar() {
  const { state } = useAppState()

  return (
    <header className="fixed top-0 left-0 right-0 z-20 h-12 bg-surface border-b border-border flex items-center px-4 gap-4">
      {/* Logo */}
      <span className="font-heading text-lg font-bold text-amber tracking-tight select-none">
        VistaNest
      </span>

      {/* Search placeholder */}
      <div className="relative flex-1 max-w-xs">
        <input
          type="text"
          placeholder="Search…"
          disabled
          className="w-full h-7 bg-bg border border-border rounded px-2.5 pr-8 text-sm text-text-secondary placeholder:text-text-secondary/50 font-body cursor-not-allowed"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-secondary/60 font-mono border border-border rounded px-1 py-px leading-none">
          /
        </kbd>
      </div>

      {/* Nav links (disabled placeholders) */}
      <nav className="hidden sm:flex items-center gap-3 text-sm text-text-secondary/50 font-body select-none">
        <span className="cursor-not-allowed" title="Coming soon">Due</span>
        <span className="cursor-not-allowed" title="Coming soon">Tags</span>
        <span className="cursor-not-allowed" title="Coming soon">Lists</span>
      </nav>

      <div className="flex-1" />

      {/* Export button */}
      <button
        type="button"
        onClick={() => downloadExportJson(state)}
        className="h-7 flex items-center gap-1.5 rounded border border-border px-2 text-sm text-text-secondary font-body hover:bg-bg hover:text-text transition-colors"
        aria-label="Export as JSON"
        title="Export as JSON"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
          aria-hidden="true"
        >
          <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
          <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
        </svg>
        Export
      </button>

      {/* Help button */}
      <button
        type="button"
        disabled
        className="w-7 h-7 flex items-center justify-center rounded border border-border text-text-secondary/60 text-sm font-mono cursor-not-allowed hover:border-border"
        aria-label="Help"
      >
        ?
      </button>

      {/* Avatar placeholder */}
      <div
        className="w-7 h-7 rounded-full bg-border flex items-center justify-center text-[10px] text-text-secondary/60 font-body select-none"
        aria-label="User avatar"
      >
        U
      </div>
    </header>
  )
}
