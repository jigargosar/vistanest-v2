export function Topbar() {
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
        <span className="cursor-not-allowed">Due</span>
        <span className="cursor-not-allowed">Tags</span>
        <span className="cursor-not-allowed">Lists</span>
      </nav>

      <div className="flex-1" />

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
