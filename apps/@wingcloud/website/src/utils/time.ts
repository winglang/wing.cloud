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

const getTimeString = (datetime?: string, short: boolean = false) => {
  if (!datetime) {
    return;
  }
  const date = new Date(datetime);
  const now = new Date();
  const diff = Math.abs(now.getTime() - date.getTime());
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) {
    if (short) {
      return `${years}y`;
    }
    const label = years === 1 ? "year" : "years";
    return `${years} ${label}`;
  }

  if (months > 0) {
    if (short) {
      return `${months}mo`;
    }
    const label = months === 1 ? "month" : "months";
    return `${months} ${label}`;
  }

  if (hours > 24) {
    if (short) {
      return `${days}d`;
    }
    const label = days === 1 ? "day" : "days";
    return `${days} ${label} `;
  }

  if (hours > 0) {
    if (short) {
      return `${hours}h`;
    }
    const label = hours === 1 ? "hour" : "hours";
    return `${hours} ${label}`;
  }

  if (minutes > 0) {
    if (short) {
      return `${minutes}m`;
    }
    const label = minutes === 1 ? "minute" : "minutes";
    return `${minutes} ${label}`;
  }

  return "";
};

export const getTimeFromNow = (datetime?: string, short: boolean = false) => {
  const time = getTimeString(datetime, short);
  if (time === undefined) {
    return;
  }
  if (time === "") {
    return "just now";
  }

  return `${time} ago`;
};

export const getTimeUntil = (datetime?: string, short: boolean = false) => {
  const time = getTimeString(datetime, short);
  if (time === undefined) {
    return;
  }
  if (time === "") {
    return "just now";
  }
  return `in ${time}`;
};

export const useTimeAgo = (datetime?: string, short: boolean = false) => {
  const [time, setTime] = useState(getTimeFromNow(datetime, short));

  useEffect(() => {
    setTime(getTimeFromNow(datetime, short));
    const interval = setInterval(() => {
      setTime(getTimeFromNow(datetime, short));
    }, 1000 * 60);

    return () => {
      clearInterval(interval);
    };
  }, [datetime]);

  return time;
};
