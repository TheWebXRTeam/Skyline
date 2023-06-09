import { BskyAgent } from "@atproto/api";
import { useEffect, useState, useRef } from "react";
import { XRButton, useXR } from "@react-three/xr";
import { useLocalStorage } from "../lib/useLocalStorage";

import {
  Button,
  Container,
  Paper,
  PasswordInput,
  TextInput,
  Title,
} from "@mantine/core";

function LoginForm() {
  const [username, setUsername] = useLocalStorage("userName", null);
  const [sessionData, setSessionData] = useLocalStorage("sessionData", null);
  const [feedData, setFeedData] = useLocalStorage("feedData", null);
  const [password, setPassword] = useState("");

  const buttonRef = useRef();

  const agent = new BskyAgent({
    service: "https://bsky.social/",
    persistSession: (evt, sess) => {
      setSessionData(sess);
    },
  });

  useEffect(() => {
    console.log("some feed data", feedData);
    if (!sessionData) {
      console.warn("No session data found. Please log in first.");
    } else if (!feedData) {
      handleTimeline();
    }
  }, [feedData, sessionData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Attempting login with username:", username);
      const sessionData = await agent.login({ identifier: username, password });
      console.log("Login successful. Session data:", sessionData);
      setSessionData(sessionData); // Save the session data to local storage
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleTimeline = async () => {
    console.log("sessionData is", sessionData);
    try {
      const sd = sessionData.data;
      if (!sd) {
        console.error("No session data found. Please log in first.");
        return;
      }
      await agent.resumeSession(sd);

      const res = await agent.getTimeline();
      console.log("Timeline here. Response:", res);
      setFeedData(res.data.feed);
    } catch (error) {
      console.error("Pull error:", error);
    }
  };

  return (
    <>
      <Container size={420} my={40} style={{ marginTop: "5em" }}>
        <Title
          align="center"
          sx={(theme) => ({
            fontFamily: `Greycliff CF, ${theme.fontFamily}`,
            fontWeight: 900,
          })}
        >
          <img src={"skyline.png"} alt="Skyline" style={{ width: "100%" }} />
        </Title>
        {!username || !sessionData || !feedData ? (
          <Paper withBorder shadow="md" p={30} mt={30} radius="md">
            <TextInput
              label="Username"
              placeholder="<handle>.bsky.social"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              mt="md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button fullWidth onClick={handleSubmit} mt="xl">
              Sign in
            </Button>
          </Paper>
        ) : (
          <>
            <XRButton
              /* The type of `XRSession` to create */
              mode={"AR"}
              ref={buttonRef}
              style={{
                // remove default button styles
                background: "#228be6",
                border: "none",
                padding: ".5em 18px",
                width: "100%",
                font: "inherit",
                outline: "inherit",
                color: "white",
                // add rounded corners
                borderRadius: "4px",
                // indicate this is a button
                cursor: "pointer",
              }}
              /**
               * `XRSession` configuration options
               * @see https://immersive-web.github.io/webxr/#feature-dependencies
               */
              sessionInit={{
                optionalFeatures: [
                  "local-floor",
                  "bounded-floor",
                  "hand-tracking",
                  "layers",
                  "anchors",
                  "plane-detection",
                  "hit-test",
                ],
              }}
              children={(status) => {
                if (status === "unsupported") {
                  return "AR not supported";
                }
                if (status === "exited") {
                  return `Join as ${username}`;
                }
                if (status === "entered") {
                  return `Return to Browser`;
                }
              }}
            >
              {/* Can accept regular DOM children and has an optional callback with the XR button status (unsupported, exited, entered) */}
            </XRButton>
            {/* add logout button */}
            <Button
              fullWidth
              onClick={() => {
                setUsername(null);
                setSessionData(null);
                setFeedData(null);
              }}
              mt="xl"
              // make this button have a border but no background
              variant="outline"
            >
              Sign out
            </Button>
          </>
        )}
      </Container>
    </>
  );
}

export default LoginForm;
