import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Fades + lifts a section's children into place as it enters the viewport.
 * Shared by every content section so each one enters with the same quiet,
 * consistent timing instead of hand-rolled one-off timelines.
 */
export function useScrollReveal({ targets = ':scope > *', y = 32, stagger = 0.12, start = 'top 78%' } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const ctx = gsap.context(() => {
      gsap.from(el.querySelectorAll(targets), {
        opacity: 0,
        y,
        duration: 1.1,
        ease: 'power3.out',
        stagger,
        scrollTrigger: {
          trigger: el,
          start,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [targets, y, stagger, start]);

  return ref;
}
