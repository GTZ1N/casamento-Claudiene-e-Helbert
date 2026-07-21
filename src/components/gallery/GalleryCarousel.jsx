import { useCallback, useEffect, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import './gallery-carousel.css';

const photoCount = 25;

// The couple asked these four to stand out — they open the carousel instead
// of blending in wherever their number happened to fall.
const FEATURED_NUMBERS = [4, 6, 14, 1];

// gallery-09's subjects sit right-of-center in a wide landscape frame; the
// default center object-position crops the groom when `cover`d into the
// carousel's portrait frame. Keyed by photo number (matches the filename).
const FOCAL_POINTS = {
  9: '78% 45%',
};

const allNumbers = Array.from({ length: photoCount }, (_, i) => i + 1);
const orderedNumbers = [
  ...FEATURED_NUMBERS,
  ...allNumbers.filter((n) => !FEATURED_NUMBERS.includes(n)),
];

const slides = orderedNumbers.map((n) => ({
  number: n,
  src: `/gallery/gallery-${String(n).padStart(2, '0')}.jpg`,
  featured: FEATURED_NUMBERS.includes(n),
  focalPoint: FOCAL_POINTS[n],
}));

const AUTOPLAY_DELAY = 5500;

function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function GalleryCarousel() {
  const autoplayRef = useRef(
    Autoplay({ delay: AUTOPLAY_DELAY, stopOnInteraction: false, stopOnMouseEnter: true }),
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'center', skipSnaps: false },
    [autoplayRef.current],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback((api) => {
    setSelectedIndex(api.selectedScrollSnap());
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return undefined;
    onSelect(emblaApi);
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return undefined;
    const autoplay = autoplayRef.current;
    // Autoplay only pauses fully on hover by default (stopOnMouseEnter);
    // dragging/tapping the carousel should pause it too, then resume the
    // full delay once the user lets go instead of staying stopped forever.
    const pause = () => autoplay.stop();
    const resume = () => autoplay.reset();
    emblaApi.on('pointerDown', pause);
    emblaApi.on('pointerUp', resume);
    return () => {
      emblaApi.off('pointerDown', pause);
      emblaApi.off('pointerUp', resume);
    };
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
    autoplayRef.current.reset();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
    autoplayRef.current.reset();
  }, [emblaApi]);

  const progress = ((selectedIndex + 1) / slides.length) * 100;

  return (
    <div className="carousel-wrap">
      <div className="carousel-viewport" ref={emblaRef}>
        <div className="carousel-track">
          {slides.map((slide, i) => (
            <div className={`carousel-slide${slide.featured ? ' carousel-slide--featured' : ''}`} key={slide.src}>
              <figure className="carousel-frame">
                <img
                  src={slide.src}
                  alt={`Momento ${slide.number} de Claudiene e Helbert`}
                  loading={i < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                  style={slide.focalPoint ? { objectPosition: slide.focalPoint } : undefined}
                />
              </figure>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="carousel-arrow carousel-arrow--prev"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        aria-label="Foto anterior"
      >
        <PrevIcon />
      </button>
      <button
        type="button"
        className="carousel-arrow carousel-arrow--next"
        onClick={scrollNext}
        disabled={!canScrollNext}
        aria-label="Próxima foto"
      >
        <NextIcon />
      </button>

      <div className="carousel-indicator">
        <span className="carousel-indicator-count">
          {String(selectedIndex + 1).padStart(2, '0')} — {String(slides.length).padStart(2, '0')}
        </span>
        <span className="carousel-indicator-track">
          <span className="carousel-indicator-fill" style={{ width: `${progress}%` }} />
        </span>
      </div>
    </div>
  );
}
