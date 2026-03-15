import HCaptcha, { HCaptchaFunctions } from "solid-hcaptcha";
import { For, JSX, Show, createSignal } from "solid-js";

import { useLingui } from "@lingui-solid/solid/macro";

import { useError } from "@revolt/i18n";
import { Checkbox2, Column, Text, TextField } from "@revolt/ui";

/**
 * Available field types
 */
export type Field =
  | "email"
  | "password"
  | "new-password"
  | "log-out"
  | "username"
  | "invite"
  | "host"
  | "api";

/**
 * Properties to apply to fields
 */
export const useFieldConfig = () => {
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
    invite: {
      minLength: 1,
      type: "text" as const,
      autocomplete: "none",
      name: () => t`Invite Code`,
      placeholder: () => t`Enter your invite code.`,
    },
    host: {
      required: false,
      type: "text" as const,
      autocomplete: "none",
      name: () => t`Instance`,
      placeholder: () => t`Defaults to stoat.chat`,
    },
    api: {
      minLength: 10,
    },
  };
};

interface FieldProps {
  /**
   * Fields to gather
   */
  fields: (Field | FieldPreset)[];
}

interface FieldPreset {
  field: Field;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  disabled?: boolean;
}

/**
 * Render a bunch of fields with preset values
 */
export function Fields(props: FieldProps) {
  const fieldConfig = useFieldConfig();

  return (
    <For each={props.fields}>
      {(field) => {
        // If field is just a Field value, convert it to a FieldPreset
        if (typeof field === "string") field = { field };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const conf = fieldConfig[field.field] as any;
        if (!("required" in conf)) conf.required = true;

        return (
          <label>
            {field.field === "log-out" ? (
              <Checkbox2 name={field.field}>{conf.name()}</Checkbox2>
            ) : (
              <TextField
                {...conf}
                name={field.field}
                label={conf.name()}
                placeholder={conf.placeholder()}
                disabled={field.disabled}
                value={field.value}
              />
            )}
          </label>
        );
      }}
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
