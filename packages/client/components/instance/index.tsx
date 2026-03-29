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

export const DefaultURL = new URL(CONFIGURATION.DEFAULT_API_URL);
export const DefaultOrigin = DefaultURL.origin;
export const DefaultHost = DefaultURL.host;
const DefRoute = `/i/${DefaultHost}/`;

const instanceContext = createContext<Instance>();

export function InstanceContext(props: { children?: JSXElement }) {
  const params = useParams();
  const nav = useNavigate();
  const [inst, setInst] = createSignal<Instance>();

  createAsync(async () => {
    setInst(undefined);

    //Redirect default instance
    if (params.host === DefaultHost) {
      nav(Instance.relPath(location.pathname));
      delete params.host;
    }

    let apiUrl = CONFIGURATION.DEFAULT_API_URL as string,
      wsUrl = CONFIGURATION.DEFAULT_WS_URL as string,
      mediaUrl = CONFIGURATION.DEFAULT_MEDIA_URL as string,
      proxyUrl = CONFIGURATION.DEFAULT_PROXY_URL as string;

    try {
      if (params.host) {
        apiUrl = `https://${params.host}/api`;

        //TODO Link safety warning modal (might need a new
        // variant of it) if it's an instance they've
        // never connected to before?

        const api = new API.API({ baseURL: apiUrl });

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
          //TODO Detect the below options from API
          CONFIGURATION.DEFAULT_GIFBOX_URL,
          CONFIGURATION.HCAPTCHA_SITEKEY,
          CONFIGURATION.MAX_EMOJI,
          CONFIGURATION.ENABLE_VIDEO,
          params.host,
          nav,
        ),
      );
    } catch (e) {
      //TODO Find a better way to do this, can't use modals here
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

const DEF_MARK = "_defInst";

function Redirect() {
  const inst = useInstance(),
    nav = useNavigate();

  useBeforeLeave((e) => {
    if (typeof e.to !== "string") return;

    if ((e.to + "/").startsWith(DefRoute)) {
      //Redirect default instance
      e.preventDefault();
      nav(Instance.relPath(e.to), { state: DEF_MARK });
    } else if (
      inst.host &&
      !e.to.startsWith("/i/") &&
      e.options?.state !== DEF_MARK
    ) {
      //Redirect relative path to instance path
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
