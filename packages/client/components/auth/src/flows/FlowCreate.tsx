import { Trans } from "@lingui-solid/solid/macro";

import { useApi, useClient } from "@revolt/client";
import { useInstance } from "@revolt/instance";
import { useModals } from "@revolt/modal";
import { useNavigate, useParams } from "@revolt/routing";
import { Button, iconSize, Row } from "@revolt/ui";
import { Show } from "solid-js";

import MdArrowBack from "@material-design-icons/svg/filled/arrow_back.svg?component-solid";

import { AdvancedOptions, AdvOpts } from "../AdvancedOptions";
import { FlowTitle } from "./Flow";
import { setFlowCheckEmail } from "./FlowCheck";
import { Fields, Form } from "./Form";

/**
 * Flow for creating a new account
 */
export default function FlowCreate() {
  const api = useApi(),
    navigate = useNavigate(),
    modals = useModals(),
    instance = useInstance(),
    getClient = useClient();
  const { code } = useParams();
  let advOpt: AdvOpts;

  /**
   * Create an account
   * @param data Form Data
   */
  async function create(data: FormData) {
    try {
      const email = data.get("email") as string,
        password = data.get("password") as string,
        captcha = data.get("captcha") as string,
        invite = data.get("invite") as string;

      advOpt!.setOpts(data);

      await api.post("/auth/account/create", {
        email,
        password,
        captcha,
        ...(invite ? { invite } : {}),
      });

      // FIXME: should tell client if email was sent
      //        or if email even needs to be confirmed

      // TODO: log straight in if no email confirmation?

      setFlowCheckEmail(email);
      navigate("/login/check", { replace: true });
    } catch (e) {
      modals.openModal({ type: "error2", error: e });
    }
  }

  const isInviteOnly = () => {
    const client = getClient();
    if (client.configured()) {
      return client.configuration?.features.invite_only;
    }
    return false;
  };

  return (
    <>
      <FlowTitle subtitle={<Trans>Create an account</Trans>} emoji="wave">
        <Trans>Hello!</Trans>
      </FlowTitle>
      <Form onSubmit={create} captcha={instance.captchaKey}>
        <Fields fields={["email", "password"]} />
        <Show when={isInviteOnly()}>
          <Fields
            fields={[
              { field: "invite", value: code, disabled: code?.length > 0 },
            ]}
          />
        </Show>
        <AdvancedOptions ref={advOpt!} />
        <Row justify>
          <a href="..">
            <Button variant="text">
              <MdArrowBack {...iconSize("1.2em")} /> <Trans>Back</Trans>
            </Button>
          </a>
          <Button type="submit">
            <Trans>Register</Trans>
          </Button>
        </Row>
      </Form>
      {import.meta.env.DEV && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            background: "white",
            color: "black",
            cursor: "pointer",
          }}
          onClick={() => {
            setFlowCheckEmail("insert@stoat.chat");
            navigate("/login/check", { replace: true });
          }}
        >
          Mock Submission
        </div>
      )}
    </>
  );
}
