import Lottie from "lottie-react";
import cricketAnimation from "../assets/cricket-loader.json";

export const Loading = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#08131f",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <Lottie
        animationData={cricketAnimation}
        loop={true}
        style={{
          width: 320,
          height: 320,
        }}
      />

      <h2
        style={{
          color: "#fff",
          marginTop: 20,
          letterSpacing: 3,
        }}
      >
        Loading Game...
      </h2>

      <div
        style={{
          width: 250,
          height: 8,
          background: "#1b2735",
          borderRadius: 20,
          overflow: "hidden",
          marginTop: 20,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#00d4ff",
            animation: "load 2s infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes load{
            0%{transform:translateX(-100%);}
            100%{transform:translateX(100%);}
        }
      `}</style>
    </div>
  );
};