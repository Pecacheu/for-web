import { createContext, JSXElement, useContext } from "solid-js";
import { DefaultInstance, InstanceManager } from "./Instance";

const instanceContext = createContext<InstanceManager>();

export function InstanceContext(props: { children: JSXElement }) {
  return (
    <instanceContext.Provider value={new InstanceManager(DefaultInstance)}>
      {props.children}
    </instanceContext.Provider>
  );
}

export function useInstance() {
  const instance = useContext(instanceContext);

  if (!instance) {
    throw new Error("useInstance must be called inside InstanceProvider");
  }

  return instance;
}
