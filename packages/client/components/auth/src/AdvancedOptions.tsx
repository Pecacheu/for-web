import { Trans } from "@lingui-solid/solid/macro";
import { Column, iconSize, typography } from "@revolt/ui";
import { createSignal, onMount, Ref, Show } from "solid-js";
import { styled } from "styled-system/jsx";
import { Field, Fields, useFieldConfig } from "./flows/Form";

import MdChevronRight from "@material-design-icons/svg/filled/chevron_right.svg?component-solid";
import { useInstance } from "@revolt/instance";
import { DefaultInstance } from "@revolt/instance/Instance";

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

const URL_FIELDS: Field[] = ["api", "ws", "media", "proxy", "gifbox"];

export type AdvOpts = { setOpts: (data: FormData) => void };

export function AdvancedOptions(props: { ref: Ref<AdvOpts> }) {
  const [isOpen, setOpen] = createSignal(false);
  const instance = useInstance(),
    fieldConfig = useFieldConfig();

  function applyUrl(type: Field, data: FormData) {
    try {
      //Check URL
      const val = (data.get(type) as string).replace(/\/+$/, "");
      new URL(val);
      //Check HTTPS
      if (!val.startsWith(type === "ws" ? "wss://" : "https://")) {
        //Check HTTP
        if (val.startsWith(type === "ws" ? "ws://" : "http://")) {
          if (location.protocol === "https:") throw 2;
        } else throw 1;
      }
      return val;
    } catch (e) {
      if (e === 2) throw "Unencrypted endpoint not allowed on HTTPS client.";
      throw `Invalid URL for ${fieldConfig[type].name()}.`;
    }
  }

  function setOpts(data: FormData) {
    const vals = { ...DefaultInstance };
    if (isOpen()) {
      // @ts-expect-error naughty code >:3
      for (const f of URL_FIELDS) vals[f + "Url"] = applyUrl(f, data);
    }
    instance.set(vals);
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
          <Fields fields={URL_FIELDS} />
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
