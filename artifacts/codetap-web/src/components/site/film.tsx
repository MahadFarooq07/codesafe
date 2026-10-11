import { Reveal } from './reveal';

const base = import.meta.env.BASE_URL;

export function Film() {
  return (
    <section id="film" className="mx-auto max-w-[1080px] scroll-mt-16 px-5 py-24 sm:py-32" style={{ borderTop: '.5px solid var(--hair)' }}>
      <Reveal className="text-center">
        <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#0A84FF]">Watch</p>
        <h2 className="text-[36px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[52px]">See it in 30 seconds.</h2>
      </Reveal>
      <Reveal delay={100}>
        <div className="mt-14 overflow-hidden rounded-[24px] bg-white" style={{ boxShadow: '0 0 0 .5px rgba(27,28,29,.1), 0 40px 90px -40px rgba(27,28,29,.28)' }}>
          <video
            className="block aspect-video w-full"
            src={`${base}codesafe-film.mp4`}
            poster={`${base}codesafe-film-poster.jpg`}
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="metadata"
            data-testid="video-film"
          />
        </div>
      </Reveal>
    </section>
  );
}
