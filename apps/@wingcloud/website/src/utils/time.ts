import { useEffect, useState } from "react";

export const getDateTime = (datetime: string) => {
  const date = new Date(datetime);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};

const getTimeFromNow = (datetime: string) => {
  const date = new Date(datetime);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 24) {
    return getDateTime(datetime);
  }

  if (hours > 0) {
    const label = hours === 1 ? "hour" : "hours";
    return `${hours} ${label} ago`;
  }

  if (minutes > 0) {
    const label = minutes === 1 ? "minute" : "minutes";
    return `${minutes} ${label} ago`;
  }

  return "just now";
};

export const useTimeAgo = (datetime: string) => {
  const [time, setTime] = useState(getTimeFromNow(datetime));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeFromNow(datetime));
    }, 1000 * 60);

    return () => {
      clearInterval(interval);
    };
  }, [datetime]);

  return time;
};
