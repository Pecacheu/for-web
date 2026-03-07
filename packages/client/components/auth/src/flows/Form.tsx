import HCaptcha, { HCaptchaFunctions } from "solid-hcaptcha";
import { For, JSX, Show, createSignal } from "solid-js";

import { useLingui } from "@lingui-solid/solid/macro";

import { CONFIGURATION } from "@revolt/common";
import { useError } from "@revolt/i18n";
import { Checkbox2, Column, Text, TextField } from "@revolt/ui";

/**
 * Available field types
 */
type Field =
  | "email"
  | "password"
  | "new-password"
  | "log-out"
  | "username"
  | "api"
  | "ws"
  | "media"
  | "proxy"
  | "gifbox";

/**
 * Properties to apply to fields
 */
const useFieldConfiguration = () => {
  const { t } = useLingui();

  return {
    email: {
      type: "email" as const,
      name: () => t`Email`,
      placeholder: () => t`Please enter your email.`,
      autocomplete: "email",
    },
    password: {
      minLength: 8,
      type: "password" as const,
      name: () => t`Password`,
      placeholder: () => t`Enter your current password.`,
    },
    "new-password": {
      minLength: 8,
      type: "password" as const,
      autocomplete: "new-password",
      name: () => t`New Password`,
      placeholder: () => t`Enter a new password.`,
    },
    "log-out": {
      name: () => t`Log out of all other sessions`,
    },
    username: {
      minLength: 2,
      type: "text" as const,
      autocomplete: "none",
      name: () => t`Username`,
      placeholder: () => t`Enter your preferred username.`,
    },
    api: {
      minLength: 10,
      type: "text" as const,
      autocomplete: "none",
      name: () => t`API Endpoint`,
      placeholder: () => t`URL of the API server.`,
      value: CONFIGURATION.DEFAULT_API_URL,
    },
    ws: {
      minLength: 8,
      type: "text" as const,
      autocomplete: "none",
      name: () => t`WS Endpoint`,
      placeholder: () => t`URL of the WebSocket server.`,
      value: CONFIGURATION.DEFAULT_WS_URL,
    },
    media: {
      minLength: 10,
      type: "text" as const,
      autocomplete: "none",
      name: () => t`Media Endpoint`,
      placeholder: () => t`URL of the Media server.`,
      value: CONFIGURATION.DEFAULT_MEDIA_URL,
    },
    proxy: {
      minLength: 10,
      type: "text" as const,
      autocomplete: "none",
      name: () => t`Proxy Endpoint`,
      placeholder: () => t`URL of the Proxy server.`,
      value: CONFIGURATION.DEFAULT_PROXY_URL,
    },
    gifbox: {
      minLength: 10,
      type: "text" as const,
      autocomplete: "none",
      name: () => t`Gifbox Endpoint`,
      placeholder: () => t`URL of the Gifbox server.`,
      value: CONFIGURATION.DEFAULT_GIFBOX_URL,
    },
  };
};

interface FieldProps {
  /**
   * Fields to gather
   */
  fields: Field[];
}

/**
 * Render a bunch of fields with preset values
 */
export function Fields(props: FieldProps) {
  const fieldConfiguration = useFieldConfiguration();

  return (
    <For each={props.fields}>
      {(field) => (
        <label>
          {field === "log-out" ? (
            <Checkbox2 name="log-out">
              {fieldConfiguration["log-out"].name()}
            </Checkbox2>
          ) : (
            <TextField
              required
              {...fieldConfiguration[field]}
              name={field}
              label={fieldConfiguration[field].name()}
              placeholder={fieldConfiguration[field].placeholder()}
            />
          )}
        </label>
      )}
    </For>
  );
}

interface Props {
  /**
   * Form children
   */
  children: JSX.Element;

  /**
   * Whether to include captcha token
   */
  captcha?: string;

  /**
   * Submission handler
   */
  onSubmit: (data: FormData) => Promise<void> | void;
}

/**
 * Small wrapper for HTML form
 */
export function Form(props: Props) {
  const [error, setError] = createSignal();
  const err = useError();
  let hcaptcha: HCaptchaFunctions | undefined;

  /**
   * Handle submission
   * @param event Form Event
   */
  async function onSubmit(event: Event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget as HTMLFormElement);

    if (props.captcha) {
      if (!hcaptcha) return alert("hCaptcha not loaded!");
      const response = await hcaptcha.execute();
      formData.set("captcha", response!.response);
    }

    try {
      await props.onSubmit(formData);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Column gap="lg">
        {props.children}
        <Show when={error()}>
          <Text class="label" size="small">
            {err(error())}
          </Text>
        </Show>
      </Column>
      <Show when={props.captcha}>
        <HCaptcha
          sitekey={props.captcha!}
          onLoad={(instance) => (hcaptcha = instance)}
          size="invisible"
        />
      </Show>
    </form>
  );
}
