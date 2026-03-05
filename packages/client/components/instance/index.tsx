import { CONFIGURATION } from "@revolt/common";
import { createContext, JSXElement, useContext } from "solid-js";
import Instance from "./Instance";

const instanceContext = createContext<Instance>();

export function InstanceContext(props: { children: JSXElement }) {
  return (
    <instanceContext.Provider
      value={new Instance(CONFIGURATION.DEFAULT_API_URL)}
    >
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
