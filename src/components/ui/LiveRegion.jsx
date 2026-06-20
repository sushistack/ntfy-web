import { useEffect, useRef, useState } from "react";

const LiveRegion = ({ message, politeness = "polite", announcementKey = message }) => {
  const [content, setContent] = useState("");
  const queueRef = useRef([]);
  const timerRef = useRef(null);
  const processingRef = useRef(false);
  const pumpRef = useRef(() => {});

  pumpRef.current = () => {
    if (processingRef.current || queueRef.current.length === 0) return;

    processingRef.current = true;
    const nextMessage = queueRef.current.shift();
    setContent("");
    timerRef.current = setTimeout(() => {
      setContent(nextMessage);
      timerRef.current = setTimeout(() => {
        processingRef.current = false;
        pumpRef.current();
      }, 150);
    }, 100);
  };

  useEffect(() => {
    if (!message) return;
    queueRef.current.push(message);
    pumpRef.current();
  }, [announcementKey, message]);

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      queueRef.current = [];
      processingRef.current = false;
    },
    []
  );

  return (
    <div role="status" aria-live={politeness} aria-atomic="true" className="sr-only">
      {content}
    </div>
  );
};

export default LiveRegion;
