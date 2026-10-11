export function Pill({ source = 'stripe.com', code = '482193', searching = false, pressed = false }: { source?: string; code?: string; searching?: boolean; pressed?: boolean }) {
  return (
    <div
      className="flex min-w-[96px] flex-col items-center justify-center rounded-[12px] bg-white"
      style={{
        padding: '7px 16px',
        minHeight: 44,
        border: '.5px solid rgba(27,28,29,.14)',
        boxShadow: '0 8px 24px -8px rgba(27,28,29,.2), 0 2px 6px rgba(27,28,29,.06)',
        transform: `scale(${pressed ? 0.97 : 1})`,
        transition: 'transform .18s cubic-bezier(.2,.8,.2,1)',
      }}
      data-testid="pill"
    >
      {searching ? (
        <div className="flex gap-[5px]" aria-label="Searching">
          {[0, 1, 2].map((i) => (
            <span key={i} className="pulse-dot h-[5px] w-[5px] rounded-full bg-[#AEAEB2]" style={{ animationDelay: `${i * 160}ms` }} />
          ))}
        </div>
      ) : (
        <>
          <span className="text-[11px] font-medium leading-[14px] text-[#6E6E73]">From {source}</span>
          <span className="text-[17px] font-semibold leading-[21px] tabular-nums tracking-[0.04em] text-[#1B1C1D]">{code}</span>
        </>
      )}
    </div>
  );
}
