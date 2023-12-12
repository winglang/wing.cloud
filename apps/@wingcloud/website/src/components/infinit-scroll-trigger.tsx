import { useEffect, useRef } from "react";

export const InfiniteScrollTrigger = ({
  onTriggered,
}: {
  onTriggered: () => void;
}) => {
  const triggerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onTriggered();
          }
        }
      },
      {
        rootMargin: "0px",
        threshold: 1,
      },
    );

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }

    return () => {
      if (triggerRef.current) {
        observer.unobserve(triggerRef.current);
      }
    };
  }, [onTriggered]);

  return <div ref={triggerRef} />;
};
