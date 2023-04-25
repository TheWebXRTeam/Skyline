import { useEffect, useState } from "react";
import { startSession } from "@react-three/xr";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function CustomVRButton() {
  const [supported, setSupported] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if ("xr" in navigator) {
      navigator.xr.isSessionSupported("immersive-vr").then(setSupported);
    }
  }, []);

  const handleClick = async () => {
    if (currentSession) {
      await currentSession.end();
      setCurrentSession(null);
    } else {
      const sessionInit = {
        optionalFeatures: ["local-floor", "bounded-floor"],
      };
      const newSession = await startSession("immersive-vr", sessionInit);
      if (newSession) {
        newSession.addEventListener("end", () => {
          setCurrentSession(null);
        });
        setCurrentSession(newSession);
      }
    }
  };

  if (!supported) {
    return (
      <a
        href="https://immersiveweb.dev/"
        style={{
          position: "absolute",
          bottom: "0px",
          right: "0px",
          width: "100%",
          textDecoration: "none",
          fontSize: "13px",
          textAlign: "center",
          color: "white",
          background: "rgba(180,20,20,1)",
          zIndex: 999,
        }}
      >
        WEBXR NOT AVAILABLE
      </a>
    );
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "absolute",
        bottom: "20px",
        right: "20px",
        border: "1px solid #fff",
        borderRadius: "4px",
        background: currentSession ? "rgba(180,20,20,1)" : "rgba(20,150,80,1)",
        color: "#fff",
        font:
          hover || currentSession
            ? "normal 12px sans-serif"
            : "normal 30px sans-serif",
        textAlign: "center",
        zIndex: 999,
        opacity: hover || currentSession ? "1" : "0.5",
        outline: "none",
        height: "40px",
        width: "80px",
        cursor: "pointer",
      }}
    >
      {!currentSession && hover ? (
        "ENTER VR"
      ) : (
        <FontAwesomeIcon icon="vr-cardboard" />
      )}
    </button>
  );
}
