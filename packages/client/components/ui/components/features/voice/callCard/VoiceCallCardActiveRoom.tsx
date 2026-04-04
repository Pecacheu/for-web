import {
  Accessor,
  createEffect,
  createSignal,
  For,
  onMount,
  Setter,
  Show,
} from "solid-js";
import {
  TrackLoop,
  TrackReferenceOrPlaceholder,
  useTracks,
} from "solid-livekit-components";

import { t } from "@lingui/core/macro";
import { createResizeObserver } from "@solid-primitives/resize-observer";
import { Track } from "livekit-client";
import { styled } from "styled-system/jsx";

import { InRoom, useVoice } from "@revolt/rtc";
import { IconButton } from "@revolt/ui/components/design";
import { Symbol } from "@revolt/ui/components/utils/Symbol";
import { scrollableStyles } from "@revolt/ui/directives";

import { ParticipantTile, tile } from "./ParticipantTile";
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
        <VoiceCallControlHolder left overflow>
          <VoiceCallCardStatus />
        </VoiceCallControlHolder>
      </VoiceCallControls>
    </View>
  );
}

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
  const voice = useVoice();

  // Modify this value to get test tracks
  const testTrackCount = 0;

  const [focus, setFocus] = createSignal<string>();
  const [showBar, setShowBar] = createSignal(true);
  let callRef: HTMLDivElement | undefined;

  const tileWidth = () => {
    const trackPercentage = Math.round(
      100 / (tracks().length + testTrackCount),
    );
    return `max(${TILE_MIN_WIDTH}, ${trackPercentage}% - var(--gap-md))`;
  };

  const getFocusID = (t: TrackReferenceOrPlaceholder) =>
    `${t.source}_${t.participant.sid}`;

  const toggleFocus = (t?: TrackReferenceOrPlaceholder) => {
    const id = t ? getFocusID(t) : undefined;
    setFocus(focus() === id || tracks().length < 2 ? undefined : id);
    setShowBar(true);
  };

  const isFocus = (t?: TrackReferenceOrPlaceholder) =>
    t && focus() && getFocusID(t) === focus();

  // Clear out any focus when the track that was focused is no longer available.
  createEffect(() => {
    if (!tracks().find((t) => isFocus(t))) {
      toggleFocus();
    }
  });

  onMount(() => {
    createResizeObserver(callRef, ({ width, height }, el) => {
      if (el === callRef) {
        el.style.setProperty("--vc-w", `${width}px`);
        el.style.setProperty("--vc-h", `${height}px`);
      }
    });
  });

  return (
    <Call ref={callRef} class={focus() ? "" : scrollableStyles()}>
      <InRoom>
        <FocusedParticipant
          track={tracks().find((t) => isFocus(t))}
          toggleFocus={toggleFocus}
          showBar={showBar}
          setShowBar={setShowBar}
          fullscreen={voice.fullscreen()}
        />
        <Show when={focus()}>
          <ShowBarButtonHolder>
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
          </ShowBarButtonHolder>
        </Show>
        <Grid
          focus={!!focus()}
          show={showBar()}
          class={focus() ? scrollableStyles({ direction: "x" }) : ""}
          style={{ "--vc-tile-width": tileWidth() }}
        >
          <TrackLoop tracks={() => tracks().filter((track) => !isFocus(track))}>
            {() => (
              <ParticipantTile
                setFocus={toggleFocus}
                fullscreen={voice.fullscreen()}
              />
            )}
          </TrackLoop>
          <For each={Array(testTrackCount)}>
            {() => (
              <div
                class={tile({ fullscreen: voice.fullscreen() }) + " vc_tile"}
              />
            )}
          </For>
        </Grid>
      </InRoom>
    </Call>
  );
}

function FocusedParticipant(props: {
  track?: TrackReferenceOrPlaceholder;
  toggleFocus: (t?: TrackReferenceOrPlaceholder) => void;
  showBar: Accessor<boolean>;
  setShowBar: Setter<boolean>;
  fullscreen?: boolean;
}) {
  return (
    <Show when={props.track}>
      <TrackLoop tracks={() => [props.track!]}>
        {() => (
          <FocusBox>
            <ParticipantTile
              setFocus={props.toggleFocus}
              fullscreen={props.fullscreen}
              focus
            />
          </FocusBox>
        )}
      </TrackLoop>
    </Show>
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
    overflow: {
      true: {
        overflow: "hidden",
      },
    },
  },
});

const ShowBarButtonHolder = styled("div", {
  base: {
    height: "0px",
    alignSelf: "center",
    overflow: "visible",
    display: "flex",
    flexDirection: "column-reverse",
  },
});

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
