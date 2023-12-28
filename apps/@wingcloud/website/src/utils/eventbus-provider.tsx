import { createContext, type PropsWithChildren } from "react";
export interface EventBus {
  addEventListener: typeof document.addEventListener;
  removeEventListener: typeof document.removeEventListener;
  dispatchEvent: typeof document.dispatchEvent;
}

export interface EventBusContext {
  addEventListener: typeof document.addEventListener;
  removeEventListener: typeof document.removeEventListener;
  dispatchEvent: typeof document.dispatchEvent;
}

export const EventBusContext = createContext<EventBusContext>({
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});

export const EventBusProvider = ({ children }: PropsWithChildren) => {
  const eventBus = document;
  return (
    <EventBusContext.Provider
      value={{
        addEventListener: eventBus.addEventListener,
        removeEventListener: eventBus.removeEventListener,
        dispatchEvent: eventBus.dispatchEvent,
      }}
    >
      {children}
    </EventBusContext.Provider>
  );
};
