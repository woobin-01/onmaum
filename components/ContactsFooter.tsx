export default function ContactsFooter() {
  return (
    <footer className="mt-8 border-t border-[var(--border)] pb-2 pt-4 text-center text-[11px] font-light uppercase tracking-[0.12em] text-[var(--fg-muted)]">
      <p>
        <span className="opacity-60">정신건강 위기상담</span>{' '}
        <a
          href="tel:1577-0199"
          aria-label="정신건강 위기상담 전화 1577-0199"
          className="font-normal text-[var(--fg)] transition-colors hover:text-[var(--accent)]"
        >
          1577-0199
        </a>
        {' · '}
        <span className="opacity-60">자살예방</span>{' '}
        <a
          href="tel:1393"
          aria-label="자살예방 상담전화 1393"
          className="font-normal text-[var(--fg)] transition-colors hover:text-[var(--accent)]"
        >
          1393
        </a>
      </p>
    </footer>
  )
}
