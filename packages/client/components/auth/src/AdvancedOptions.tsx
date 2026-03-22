import { createSignal, onMount, Ref, Show } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useInstance } from "@revolt/instance";
import { useNavigate } from "@revolt/routing";
import { Column, iconSize, typography } from "@revolt/ui";

import MdChevronRight from "@material-design-icons/svg/filled/chevron_right.svg?component-solid";

import { Fields } from "./flows/Form";

const Base = styled("div", {
  base: {
    "& h1:not(:first-of-type)": { marginTop: ".8em" },
    "& h1": { fontSize: "19pt" },
    "& h1 + *": { marginTop: "var(--gap-sm)" },
    "& p": { fontSize: "11pt" },
  },
});

const Spoiler = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-md)",

    cursor: "pointer",
    userSelect: "none",
    transition: "var(--transitions-fast) all",

    "--color": "var(--md-sys-color-on-surface)",
    color: "var(--color)",
    fill: "var(--color)",

    ...typography.raw({ class: "label", size: "small" }),
    fontSize: "13px",

    "&:hover": {
      "--color": "var(--md-sys-color-on-surface-variant)",
    },

    "& svg": {
      transition: "var(--transitions-fast) transform",
    },
  },
  variants: {
    open: {
      true: {
        "& svg": {
          transform: "rotateZ(90deg)",
        },
      },
    },
  },
});

export type AdvOpts = { setOpts: (data: FormData) => void };

export function AdvancedOptions(props: { ref: Ref<AdvOpts> }) {
  const [isOpen, setOpen] = createSignal(false);
  const instance = useInstance(),
    navigate = useNavigate();

  function setOpts(data: FormData) {
    const host = data.get("host") as string,
      oldApi = new URL(instance.apiUrl);
    let api = oldApi;

    if (host) {
      if (host.length > 32) throw "Invalid Instance URL";
      try {
        api = new URL(host);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        api = new URL(`https://${host}`);
      }
    }

    //Switch instance
    if (api.host !== oldApi.host) instance.switchTo(api, navigate);
  }

  onMount(() => (props.ref as (ref: AdvOpts) => void)({ setOpts }));

  return (
    <Base class="login_adv">
      <Spoiler open={isOpen()} onClick={() => setOpen(!isOpen())}>
        Advanced
        <MdChevronRight {...iconSize(12)} />
      </Spoiler>
      <Show when={isOpen()}>
        <h1>
          <Trans>Instance Settings</Trans>
        </h1>
        <Column gap="lg">
          <p>
            <Trans>
              Use this option to connect to a <b>self-hosted</b> or{" "}
              <b>on-premise</b> instance.
            </Trans>
          </p>
          <p>
            <i>
              <Trans>
                <b>Warning:</b> Stoat is not responsible for content you access
                or upload through 3rd party instances, and does not guarantee
                moderation or user safety. For more info, please contact your
                3rd party instance's team.
              </Trans>
            </i>
          </p>
          <Fields fields={[{ field: "host", value: instance.host }]} />
        </Column>
        <h1>
          <Trans>Proxy Settings</Trans>
        </h1>
        <p>
          <Trans>
            Stoat uses your browser or operating system's HTTP proxy
            configuration. To review, open system settings.
          </Trans>
        </p>
      </Show>
    </Base>
  );
}
