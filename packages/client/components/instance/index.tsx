import { CONFIGURATION } from "@revolt/common";
import { CircularProgress } from "@revolt/ui";
import {
  createAsync,
  useBeforeLeave,
  useNavigate,
  useParams,
} from "@solidjs/router";
import {
  createContext,
  createSignal,
  JSXElement,
  Show,
  useContext,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { API } from "stoat.js";
import Instance from "./Instance";

const instanceContext = createContext<Instance>();

export function InstanceContext(props: { children?: JSXElement }) {
  const params = useParams();
  const [inst, setInst] = createSignal<Instance>();

  createAsync(async () => {
    setInst(undefined);
    let apiUrl = CONFIGURATION.DEFAULT_API_URL as string,
      wsUrl = CONFIGURATION.DEFAULT_WS_URL as string,
      mediaUrl = CONFIGURATION.DEFAULT_MEDIA_URL as string,
      proxyUrl = CONFIGURATION.DEFAULT_PROXY_URL as string;

    try {
      if (params.host) {
        // TODO: Find a way to get this other than guessing
        apiUrl = `https://${params.host}/api`;

        //TODO Link safety warning modal (might need a new
        // variant of it) if it's an instance they've
        // never connected to before?

        const api = new API.API({
          baseURL: apiUrl,
        });

        const cfg = await api.get("/");
        wsUrl = cfg.ws;
        mediaUrl = cfg.features.autumn.url;
        proxyUrl = cfg.features.january.url;
      }

      setInst(
        new Instance(
          apiUrl,
          wsUrl,
          mediaUrl,
          proxyUrl,
          CONFIGURATION.DEFAULT_GIFBOX_URL,
          CONFIGURATION.HCAPTCHA_SITEKEY,
          CONFIGURATION.MAX_EMOJI,
          CONFIGURATION.ENABLE_VIDEO,
          params.host,
        ),
      );
    } catch (e) {
      console.error(e);
      alert("Something went wrong while connecting to the backend:\n" + e);
      history.back();
    }
  });

  return (
    <Show when={inst()} fallback={<CircularProgress />}>
      <Dynamic component={instanceContext.Provider} value={inst()}>
        <Redirect />
        {props.children}
      </Dynamic>
    </Show>
  );
}

function Redirect() {
  const inst = useInstance(),
    nav = useNavigate();

  useBeforeLeave((e) => {
    console.log("LEAVE", e.from.pathname, "->", e.to);

    //Redirect relative path to instance path
    if (inst.host && typeof e.to === "string" && !e.to.startsWith("/i/")) {
      e.preventDefault();
      nav(inst.href(e.to, true));
    }
  });

  return <></>;
}

export function useInstance() {
  const instance = useContext(instanceContext);

  if (!instance)
    throw new Error("useInstance must be called inside InstanceProvider");

  return instance;
}
