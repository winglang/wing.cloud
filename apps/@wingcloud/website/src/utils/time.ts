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

export const getTime = (datetime: string) => {
  if (!datetime) {
    return "";
  }

  const date = new Date(datetime);
  return date.toLocaleTimeString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
};

const getTimeFromNow = (datetime: string, short: boolean = false) => {
  const date = new Date(datetime);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (hours > 24) {
    if (short) {
      return `${days}d ago`;
    }
    const label = days === 1 ? "day" : "days";
    return `${days} ${label}  ago`;
  }

  if (hours > 0) {
    if (short) {
      return `${hours}h ago`;
    }
    const label = hours === 1 ? "hour" : "hours";
    return `${hours} ${label} ago`;
  }

  if (minutes > 0) {
    if (short) {
      return `${minutes}m ago`;
    }
    const label = minutes === 1 ? "minute" : "minutes";
    return `${minutes} ${label} ago`;
  }

  return "just now";
};

export const useTimeAgo = (datetime: string, short: boolean = false) => {
  const [time, setTime] = useState(getTimeFromNow(datetime, short));

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
