import { forwardRef, useCallback, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import CoverPage from './pages/CoverPage';
import IconsPage from './pages/IconsPage';
import ClosingPage from './pages/ClosingPage';
import SoundToggle from '../sound-toggle/SoundToggle';
import './flip-page.css';
import './flipbook.css';

const PAGES = [CoverPage, IconsPage, ClosingPage];
const PAGE_COUNT = PAGES.length;

const Page = forwardRef(function Page({ children }, ref) {
  return (
    <div className="flip-page" ref={ref}>
      {children}
    </div>
  );
});

// react-pageflip (built on the `page-flip` engine) renders actual DOM pages
// with a real curved-corner curl, not a flattened image — our pages stay
// interactive (buttons, links) and the curl looks like the realistic
// reference the couple asked to match, which our from-scratch clip-path
// version couldn't get close to. We tried this library before and pulled it
// for a real asymmetry (in portrait mode, "next" peels the current page's
// own element while "prev" flies the *previous* page's element in instead —
// see page-flip's PageCollection.getFlippingPage), but a correct-looking
// curl now matters more than that asymmetry, so it's back.
export default function FlipBook() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const bookRef = useRef(null);

  const handleFlip = useCallback((e) => {
    setCurrentIndex(e.data);
  }, []);

  return (
    <div className="flipbook-stage">
      <div className="flipbook-backdrop" />
      <div className="flipbook-frame-wrap">
        <SoundToggle src="/audio/still-the-one.mp3" />
        <div className="flipbook-frame" data-lenis-prevent>
        <HTMLFlipBook
          ref={bookRef}
          className="flipbook-html"
          style={{}}
          width={340}
          height={604}
          size="stretch"
          minWidth={260}
          maxWidth={380}
          minHeight={462}
          maxHeight={676}
          startPage={0}
          usePortrait
          showCover={false}
          drawShadow
          maxShadowOpacity={0.5}
          flippingTime={550}
          startZIndex={1}
          autoSize
          mobileScrollSupport={false}
          clickEventForward
          useMouseEvents
          swipeDistance={20}
          showPageCorners
          disableFlipByClick={false}
          onFlip={handleFlip}
        >
          {PAGES.map((PageComponent, i) => (
            <Page key={i}>
              <PageComponent />
            </Page>
          ))}
        </HTMLFlipBook>

        {currentIndex < PAGE_COUNT - 1 && (
          <span className="flipbook-fold-label flipbook-fold-label--right" aria-hidden="true">
            puxe aqui
          </span>
        )}
        {currentIndex > 0 && (
          <span className="flipbook-fold-label flipbook-fold-label--left" aria-hidden="true">
            puxe aqui
          </span>
        )}
        </div>
      </div>
      <div className="flipbook-dots">
        {Array.from({ length: PAGE_COUNT }).map((_, i) => (
          <span key={i} className={`flipbook-dot${i === currentIndex ? ' is-active' : ''}`} />
        ))}
      </div>
      <div className="flipbook-scroll-cue" aria-hidden="true">
        <span className="flipbook-scroll-cue-label">role para baixo</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4v15" />
          <path d="M6 13l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}
