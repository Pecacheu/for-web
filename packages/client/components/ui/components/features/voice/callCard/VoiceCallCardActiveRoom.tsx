import {
  Accessor,
  createSignal,
  For,
  Match,
  Setter,
  Show,
  Switch,
} from "solid-js";
import {
  isTrackReference,
  TrackLoop,
  TrackReference,
  TrackReferenceOrPlaceholder,
  useEnsureParticipant,
  useIsMuted,
  useIsSpeaking,
  useMaybeTrackRefContext,
  useTrackRefContext,
  useTracks,
  VideoTrack,
} from "solid-livekit-components";

import { AutoSizer } from "@dschz/solid-auto-sizer";
import { t } from "@lingui/core/macro";
import { Track } from "livekit-client";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { UserContextMenu } from "@revolt/app";
import { useUser } from "@revolt/markdown/users";
import { InRoom, useVoice } from "@revolt/rtc";
import { Avatar, IconButton } from "@revolt/ui/components/design";
import { OverflowingText } from "@revolt/ui/components/utils";
import { Symbol } from "@revolt/ui/components/utils/Symbol";
import { scrollableStyles } from "@revolt/ui/directives";

import { Row } from "@revolt/ui/components/layout";
import { VoiceStatefulUserIcons } from "../VoiceStatefulUserIcons";
import { VoiceCallCardActions } from "./VoiceCallCardActions";
import { VoiceCallCardStatus } from "./VoiceCallCardStatus";

/**
 * Call card (active)
 */
export function VoiceCallCardActiveRoom() {
  return (
    <View>
      <Participants />
      <VoiceCallControls>
        <VoiceCallControlHolder right>
          <VoiceCallFullscreen />
        </VoiceCallControlHolder>
        <VoiceCallCardActions size="sm" />
        <VoiceCallControlHolder left>
          <VoiceCallCardStatus />
        </VoiceCallControlHolder>
      </VoiceCallControls>
    </View>
  );
}

const View = styled("div", {
  base: {
    minHeight: 0,
    height: "100%",
    width: "100%",

    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-md)",
    padding: "var(--gap-md)",
  },
});

const VoiceCallControls = styled("div", {
  base: {
    display: "flex",
    flexShrink: "0",
    overflow: "hidden",
    flexDirection: "row-reverse",
  },
});

const VoiceCallControlHolder = styled("div", {
  base: {
    display: "flex",
    flex: "1",
    alignSelf: "center",
    gap: "var(--gap-md)",
    padding: "var(--gap-md)",
  },
  variants: {
    right: {
      true: {
        justifyContent: "flex-end",
      },
    },
    empty: {
      true: {
        gap: "0px",
        padding: "0px",
      },
    },
    left: {
      true: {
        justifyContent: "flex-start",
      },
    },
  },
});

function VoiceCallFullscreen() {
  const voice = useVoice();
  return (
    <IconButton
      size="sm"
      variant={"standard"}
      onPress={() => voice.toggleFullscreen()}
    >
      <Show when={voice.fullscreen()} fallback={<Symbol>fullscreen</Symbol>}>
        <Symbol>fullscreen_exit</Symbol>
      </Show>
    </IconButton>
  );
}

const TILE_MIN_WIDTH = "250px",
  TILE_MIN_FOCUS_HEIGHT = "100px";

/**
 * Show a grid of participants
 */
function Participants() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  // Modify this value to get test tracks
  const testTrackCount = 0;

  const [focus, setFocus] = createSignal<string>();
  const [showBar, setShowBar] = createSignal(true);
  let callRef: HTMLDivElement | undefined;

  const tileWidth = () =>
    `min(var(--vc-h) * 16 / 9, max(${TILE_MIN_WIDTH}, var(--vc-h) / 2, ${Math.round(100 / (tracks().length + testTrackCount))}% - var(--gap-md)))`;

  const tglFocus = (t?: TrackReferenceOrPlaceholder) => {
    const id = t ? `${t.source}_${t.participant.sid}` : undefined;
    setFocus(focus() === id || tracks().length < 2 ? undefined : id);
    setShowBar(true);
  };

  return (
    <Call ref={callRef} class={focus() ? "" : scrollableStyles()}>
      <InRoom>
        <AutoSizer style={{ position: "absolute", "pointer-events": "none" }}>
          {({ width, height }) => {
            callRef?.style.setProperty("--vc-w", `${width}px`);
            callRef?.style.setProperty("--vc-h", `${height}px`);
            return null;
          }}
        </AutoSizer>
        <FocusedParticipant
          id={focus()}
          tracks={tracks}
          tglFocus={tglFocus}
          showBar={showBar}
          setShowBar={setShowBar}
        />
        <Show when={focus()}>
          <div
            style={{
              height: "0px",
              "align-self": "center",
              overflow: "visible",
              display: "flex",
              "flex-direction": "column-reverse",
            }}
          >
            <div style={{ "margin-bottom": "10px" }}>
              <IconButton
                size="xs"
                variant={"tonal"}
                onPress={() => setShowBar(!showBar())}
                use:floating={{
                  tooltip: {
                    placement: "top",
                    content: showBar() ? t`Hide Others` : t`Show Others`,
                  },
                }}
              >
                <Show
                  when={showBar()}
                  fallback={<Symbol>keyboard_arrow_up</Symbol>}
                >
                  <Symbol>keyboard_arrow_down</Symbol>
                </Show>
              </IconButton>
            </div>
          </div>
        </Show>
        <Grid
          focus={!!focus()}
          show={showBar()}
          class={focus() ? scrollableStyles({ direction: "x" }) : ""}
          style={{ "--vc-tile-width": tileWidth() }}
        >
          <TrackLoop tracks={tracks}>
            {() => <ParticipantTile setFocus={tglFocus} getFocus={focus} />}
          </TrackLoop>
          <For each={Array(testTrackCount)}>
            {() => <div class={tile() + " vc_tile"} />}
          </For>
        </Grid>
      </InRoom>
    </Call>
  );
}

function FocusedParticipant(props: {
  id?: string;
  tracks: Accessor<TrackReferenceOrPlaceholder[]>;
  tglFocus: (t?: TrackReferenceOrPlaceholder) => void;
  showBar: Accessor<boolean>;
  setShowBar: Setter<boolean>;
}) {
  const track = () =>
    props.id
      ? props
          .tracks()
          .find((t) => `${t.source}_${t.participant.sid}` === props.id)
      : undefined;

  return (
    <Show when={props.id && track()}>
      <TrackLoop tracks={() => [track()!]}>
        {() => (
          <FocusBox>
            <ParticipantTile setFocus={props.tglFocus} focus />
          </FocusBox>
        )}
      </TrackLoop>
    </Show>
  );
}

const Call = styled("div", {
  base: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-sm)",
    flexGrow: 1,
    minHeight: 0,
  },
});

const Grid = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "safe center",
    alignContent: "safe center",
    minHeight: "100%",
    gap: "var(--gap-md)",
  },

  variants: {
    focus: {
      true: {
        flexDirection: "column",
        height: `max(20%, ${TILE_MIN_FOCUS_HEIGHT})`,
        minHeight: 0,
        transition: "height .3s ease",

        "& .vc_tile": {
          width: "auto",
          height: "100%",
        },
      },
    },
    show: {
      false: {
        height: 0,
      },
    },
  },
});

const FocusBox = styled("div", {
  base: {
    height: 0,
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    margin: "0 auto",
  },
});

type TileProps = {
  setFocus: (t: TrackReferenceOrPlaceholder | undefined) => void;
  getFocus?: () => string | undefined;
  focus?: boolean;
};

/**
 * Individual participant tile
 */
function ParticipantTile(props: TileProps) {
  const track = useTrackRefContext();

  return (
    <Show
      when={props?.getFocus?.() !== `${track.source}_${track.participant.sid}`}
    >
      <Show
        when={track.source === Track.Source.ScreenShare}
        fallback={<UserTile {...props} />}
      >
        <ScreenshareTile {...props} />
      </Show>
    </Show>
  );
}

/**
 * Shown when the track source is a camera or placeholder
 */
function UserTile(props: TileProps) {
  const participant = useEnsureParticipant();
  const track = useMaybeTrackRefContext();

  const voice = useVoice();

  const isMuted = useIsMuted({
    participant,
    source: Track.Source.Microphone,
  });

  const isVideoMuted = useIsMuted({
    participant,
    source: Track.Source.Camera,
  });

  const isSpeaking = useIsSpeaking(participant);

  const user = useUser(participant.identity);

  const isVideo = () => isTrackReference(track) && !isVideoMuted();

  return (
    <div
      class={
        tile({
          speaking: isSpeaking(),
          video: isVideo(),
          fullscreen: voice.fullscreen(),
          ...props,
        }) + " vc_tile"
      }
      onClick={() => props.setFocus(track)}
      use:floating={{
        // TODO: Conflicts with focusing, maybe only show if clicking name itself
        //   userCard: {
        //     user: user().user!,
        //     member: user().member,
        //   },
        contextMenu: () => (
          <UserContextMenu user={user().user!} member={user().member} inVoice />
        ),
      }}
    >
      <Switch
        fallback={
          <AvatarOnly>
            <Avatar
              src={user().avatar}
              fallback={user().username}
              size={48}
              interactive={false}
            />
          </AvatarOnly>
        }
      >
        <Match when={isVideo()}>
          <VideoTrack
            style={{
              "grid-area": "1/1",
              "object-fit": "contain",
              width: "100%",
              height: "100%",
              overflow: "hidden",
            }}
            trackRef={track as TrackReference}
            manageSubscription={true}
          />
        </Match>
      </Switch>

      <Overlay>
        <OverlayInner>
          <OverflowingText>{user().username}</OverflowingText>
          <Row gap="md">
            <VoiceStatefulUserIcons
              userId={participant.identity}
              muted={isMuted()}
              camera={isVideo()}
            />
          </Row>
        </OverlayInner>
      </Overlay>
    </div>
  );
}

const AvatarOnly = styled("div", {
  base: {
    gridArea: "1/1",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",

    // TODO: Refactor the avatar component to be reactive later.
    "& > *": {
      width: "auto !important",
      height: "30% !important",
      minHeight: "48px",
    },
  },
});

/**
 * Shown when the track source is a screenshare
 */
function ScreenshareTile(props: TileProps) {
  const participant = useEnsureParticipant();
  const track = useMaybeTrackRefContext();
  const user = useUser(participant.identity);
  const voice = useVoice();

  const isMuted = useIsMuted({
    participant,
    source: Track.Source.ScreenShareAudio,
  });

  return (
    <div
      class={
        tile({ video: true, fullscreen: voice.fullscreen(), ...props }) +
        " vc_tile group"
      }
      onClick={() => props.setFocus(track)}
    >
      <VideoTrack
        style={{
          "grid-area": "1/1",
          "object-fit": "contain",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
        trackRef={track as TrackReference}
        manageSubscription={true}
      />

      <Overlay showOnHover>
        <OverlayInner>
          <OverflowingText>{user().username}</OverflowingText>
          <Show when={isMuted()}>
            <Symbol size={18}>no_sound</Symbol>
          </Show>
        </OverlayInner>
      </Overlay>
    </div>
  );
}

const tile = cva({
  base: {
    display: "grid",
    aspectRatio: "16/9",
    transition: ".3s ease all",
    borderRadius: "var(--borderRadius-lg)",
    width: "var(--vc-tile-width)",
    cursor: "pointer",

    color: "var(--md-sys-color-on-surface)",
    background: "#0002",

    overflow: "hidden",
    outlineWidth: "3px",
    outlineStyle: "solid",
    outlineOffset: "-3px",
    outlineColor: "transparent",
  },
  variants: {
    speaking: {
      true: {
        outlineColor: "var(--md-sys-color-primary)",
      },
    },
    focus: {
      true: {
        height: "100%",
        width: "auto",
        // Does this do anything?
        maxHeight: "calc(var(--vc-w) * 9/ 16)",
      },
    },
    video: {
      true: {},
    },
    fullscreen: {
      true: {},
    },
  },
  compoundVariants: [
    {
      fullscreen: [true],
      video: [true],
      focus: [true],
      css: {
        aspectRatio: "auto",
      },
    },
    {
      focus: [true],
      fullscreen: [true],
      css: {
        maxHeight: "none",
      },
    },
  ],
});

const Overlay = styled("div", {
  base: {
    minWidth: 0,
    gridArea: "1/1",

    padding: "var(--gap-md) var(--gap-lg)",

    opacity: 1,
    display: "flex",
    alignItems: "end",
    flexDirection: "row",

    transition: "var(--transitions-fast) all",
    transitionTimingFunction: "ease",
  },
  variants: {
    showOnHover: {
      true: {
        opacity: 0,

        _groupHover: {
          opacity: 1,
        },
      },
      false: {
        opacity: 1,
      },
    },
  },
  defaultVariants: {
    showOnHover: false,
  },
});

const OverlayInner = styled("div", {
  base: {
    minWidth: 0,

    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",

    _first: {
      flexGrow: 1,
    },
  },
});
