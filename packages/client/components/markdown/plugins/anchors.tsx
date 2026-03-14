import { JSX, Match, Show, Switch, splitProps } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { cva } from "styled-system/css";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { paramsFromPathname } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Avatar, Embed, iconSize } from "@revolt/ui";
import { Invite } from "@revolt/ui/components/features/messaging/elements/Invite";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import MdChat from "@material-design-icons/svg/outlined/chat.svg?component-solid";
import MdChevronRight from "@material-design-icons/svg/outlined/chevron_right.svg?component-solid";
import MdPeople from "@material-design-icons/svg/outlined/people.svg?component-solid";
import { Message } from "stoat.js";
// import { determineLink } from "../../../lib/links";
// import { modalController } from "../../../controllers/modals/ModalController";

const link = cva({
  base: {
    cursor: "pointer",
    color: "var(--md-sys-color-primary) !important",
  },
});

const internalLink = cva({
  base: {
    verticalAlign: "bottom",

    gap: "4px",
    paddingLeft: "2px",
    paddingRight: "6px",
    alignItems: "center",
    display: "inline-flex",
    textDecoration: "none !important",

    cursor: "pointer",
    fontWeight: 600,
    borderRadius: "var(--borderRadius-lg)",
    fill: "var(--md-sys-color-on-primary)",
    color: "var(--md-sys-color-on-primary)",
    background: "var(--md-sys-color-primary)",
  },
});

export function RenderAnchor(
  props: {
    disabled?: boolean;
    message?: Message;
    node?: Element;
  } & JSX.AnchorHTMLAttributes<HTMLAnchorElement>,
) {
  /* eslint-disable solid/reactivity */
  /* eslint-disable solid/components-return-once */

  const text = Array.isArray(props.children) && props.children[0]?.toString(),
    plainLink = text === props.href && !props.disabled;

  // Handle empty link
  if (!props.href || (props.node && !text)) return <>{props.children}</>;

  // Handle links that navigate internally
  try {
    let url = new URL(props.href);

    // Remap discover links to native links
    if (url.origin === "https://rvlt.gg" || url.origin === "https://stt.gg") {
      if (/^\/[\w\d]+$/.test(url.pathname)) {
        url = new URL(`/invite${url.pathname}`, location.origin);
      } else if (url.pathname.startsWith("/discover")) {
        url = new URL(url.pathname, location.origin);
      }
    }

    // Determine whether it's in our scope
    if (
      [
        location.origin,
        // legacy
        "https://app.revolt.chat",
        "https://revolt.chat",
        // new
        "https://stoat.chat",
      ].includes(url.origin)
    ) {
      const client = useClient();
      const params = paramsFromPathname(url.pathname);

      if (params.exactChannel) {
        const channel = () => client().channels.get(params.channelId!);

        const internalUrl = () =>
          new URL(
            (channel()!.serverId
              ? `/server/${channel()!.serverId}/channel/${channel()!.id}`
              : `/channel/${channel()!.id}`) +
              (params.exactMessage && params.messageId
                ? `/${params.messageId}`
                : ""),
            location.origin,
          ).toString();

        return (
          <Switch
            fallback={
              <span class={internalLink()}>
                <Symbol>tag</Symbol>
                <Trans>Private Channel</Trans>
              </span>
            }
          >
            <Match when={channel()}>
              <LinkComponent
                class={internalLink()}
                disabled={props.disabled}
                href={internalUrl()}
              >
                <Symbol>tag</Symbol>
                {channel()!.name}
                {params.exactMessage && (
                  <>
                    <MdChevronRight {...iconSize("1em")} />
                    <MdChat {...iconSize("1em")} />
                  </>
                )}
              </LinkComponent>
            </Match>
          </Switch>
        );
      } else if (params.exactServer) {
        const server = () => client().servers.get(params.serverId!);
        const internalUrl = () =>
          new URL(`/server/${server()!.id}`, location.origin).toString();

        return (
          <Switch
            fallback={
              <span class={internalLink()}>
                <MdPeople {...iconSize("1em")} />
                <Trans>Unknown Server</Trans>
              </span>
            }
          >
            <Match when={server()}>
              <LinkComponent
                class={internalLink()}
                disabled={props.disabled}
                href={internalUrl()}
              >
                <Avatar size={16} src={server()?.iconURL} /> {server()?.name}
              </LinkComponent>
            </Match>
          </Switch>
        );
      } else if (params.inviteId && plainLink) {
        return <Invite code={params.inviteId} />;
      } else {
        const internalUrl = () =>
          new URL(url.pathname, location.origin).toString();

        return (
          <LinkComponent
            children={props.node ? text : props.children}
            class={link()}
            disabled={props.disabled}
            href={internalUrl()}
          />
        );
      }
    }

    // ... all other links:
    const state = useState();
    const { openModal } = useModals();

    function onHandleWarning(
      event: MouseEvent & { currentTarget: HTMLAnchorElement },
    ) {
      if (event.button === 0 || event.button === 1) {
        event.preventDefault();
        event.stopPropagation();

        openModal({
          type: "link_warning",
          url,
          display: text || url.href,
        });
      }
    }

    //Inline link embed
    if (plainLink && props.message?.embeds) {
      const href = url.origin + url.pathname + url.search;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const em of props.message.embeds as any[])
        if (em.originalUrl === href || em.url === href)
          return <Embed embed={em} />;
    }

    return (
      <Show
        when={state.linkSafety.isTrusted(url)}
        fallback={
          <LinkComponent
            children={props.node ? text : props.children}
            class={link()}
            disabled={props.disabled}
            onClick={onHandleWarning}
            onAuxClick={onHandleWarning}
          />
        }
      >
        <LinkComponent
          children={props.node ? text : props.children}
          class={link()}
          disabled={props.disabled}
          href={props.href}
          target={"_blank"}
          rel="noreferrer"
        />
      </Show>
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    // invalid URL
    return <>{props.children}</>;
  }
}

function LinkComponent(
  props: { disabled?: boolean } & JSX.AnchorHTMLAttributes<HTMLAnchorElement>,
) {
  const [localProps, remoteProps] = splitProps(props, ["disabled"]);
  if (localProps.disabled) {
    return <span class={remoteProps.class}>{remoteProps.children}</span>;
  }
  return <a {...remoteProps} />;
}
