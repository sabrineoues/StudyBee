import { useState, useEffect, useRef } from "react";

import beeBody     from "../../assets/avatar/bee-body.png";
import beeHead     from "../../assets/avatar/bee-head.png";
import eyesOpen    from "../../assets/avatar/bee-eyes-open.png";
import eyesSemi    from "../../assets/avatar/bee-eyes-semi.png";
import mouthMid    from "../../assets/avatar/MothMid.png";
import mouthOpen   from "../../assets/avatar/bee-mouth-open.png";

export type AvatarEmotion = "neutral" | "happy" | "sad" | "thinking";

interface BeeAvatarProps {
  emotion?:      AvatarEmotion;
  isTalking?:    boolean;
  isListening?:  boolean;
  speechBubble?: string;
}

const POS = {
  body:  { top: "40%",   left: "15%",   width: "70%"   },
  head:  { top: "10%",   left: "18%",   width: "64%"   },
  eyes: {
    top:   "24.4%",
    left:  "29.1%",
    width: "40.7%",
  },
  mouth: {
    top:   "40.5%",
    left:  "39%",
    width: "22%",
  },
} as const;

const getMouthSrc = (
  isTalking:   boolean,
  mouthIndex:  number,
  emotion:     AvatarEmotion
): string => {
  if (emotion === "happy" && !isTalking) return mouthOpen;
  if (isTalking) return [mouthMid, mouthMid, mouthOpen, mouthMid][mouthIndex];
  return mouthMid;
};

export function BeeAvatar({
  emotion      = "neutral",
  isTalking    = false,
  isListening  = false,
  speechBubble,
}: BeeAvatarProps) {
  const [mouthIndex, setMouthIndex] = useState(0);
  const [bobY,       setBobY]       = useState(0);
  const lipRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const bobRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    if (lipRef.current) clearInterval(lipRef.current);
    if (isTalking) {
      lipRef.current = setInterval(
        () => setMouthIndex(p => (p + 1) % 4),
        120
      );
    } else {
      setMouthIndex(0);
    }
    return () => { if (lipRef.current) clearInterval(lipRef.current); };
  }, [isTalking]);

  useEffect(() => {
    if (bobRef.current) clearInterval(bobRef.current);
    bobRef.current = setInterval(() => {
      frameRef.current += 0.08;
      setBobY(Math.sin(frameRef.current) * (isTalking ? 5 : 3));
    }, 16);
    return () => { if (bobRef.current) clearInterval(bobRef.current); };
  }, [isTalking]);

  const eyesSrc  = (emotion === "thinking" || emotion === "sad") ? eyesSemi : eyesOpen;
  const mouthSrc = getMouthSrc(isTalking, mouthIndex, emotion);

  const glowColor = isListening
    ? "0 0 30px rgba(250,196,0,0.9)"
    : isTalking
    ? "0 0 24px rgba(99,102,241,0.6)"
    : "none";

  const W = 220;
  const H = Math.round(W * (2000 / 1416));

  const layer = (
    zIndex: number,
    pos: { top: string; left: string; width: string },
    extra?: React.CSSProperties
  ): React.CSSProperties => ({
    position:  "absolute",
    top:       pos.top,
    left:      pos.left,
    width:     pos.width,
    height:    "auto",
    zIndex,
    objectFit: "contain",
    ...extra,
  });

  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      alignItems:    "center",
      gap:           "12px",
      userSelect:    "none",
    }}>

      {speechBubble && (
        <div style={{
          position:     "relative",
          maxWidth:     "200px",
          background:   "white",
          border:       "1px solid #e5e7eb",
          borderRadius: "12px",
          padding:      "8px 14px",
          fontSize:     "13px",
          textAlign:    "center",
          color:        "#1f2937",
          boxShadow:    "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          {speechBubble}
          <div style={{
            position:    "absolute",
            bottom:      "-8px",
            left:        "50%",
            transform:   "translateX(-50%)",
            width:       0,
            height:      0,
            borderLeft:  "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop:   "8px solid white",
          }} />
        </div>
      )}

      <div style={{
        position:   "relative",
        width:      `${W}px`,
        height:     `${H}px`,
        transform:  `translateY(${bobY}px)`,
        filter:     `drop-shadow(${glowColor})`,
        transition: "filter 0.3s ease",
      }}>
        <img src={beeBody} alt="" style={layer(1, POS.body)} />
        <img src={beeHead} alt="" style={layer(2, POS.head)} />
        <img src={eyesSrc} alt="" style={layer(3, POS.eyes, { transition: "opacity 0.2s" })} />
        <img src={mouthSrc} alt="" style={layer(4, POS.mouth)} />

        {isListening && (
          <div style={{
            position:      "absolute",
            inset:         0,
            borderRadius:  "50%",
            background:    "rgba(250,196,0,0.15)",
            animation:     "ping 1s cubic-bezier(0,0,0.2,1) infinite",
            zIndex:        0,
            pointerEvents: "none",
          }} />
        )}

        {emotion === "thinking" && (
          <div style={{
            position:      "absolute",
            top:           "15%",
            right:         "-20px",
            display:       "flex",
            flexDirection: "column",
            gap:           "4px",
            zIndex:        10,
          }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                width:        "7px",
                height:       "7px",
                borderRadius: "50%",
                background:   "#6366f1",
                display:      "block",
                animation:    `bounce 0.8s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}
      </div>

      <span style={{
        padding:      "4px 14px",
        borderRadius: "20px",
        fontSize:     "12px",
        fontWeight:   600,
        transition:   "all 0.3s",
        background:
          isListening           ? "#fef3c7" :
          isTalking             ? "#ede9fe" :
          emotion === "happy"   ? "#d1fae5" :
          emotion === "sad"     ? "#dbeafe" :
          emotion === "thinking"? "#ffedd5" : "#f3f4f6",
        color:
          isListening           ? "#92400e" :
          isTalking             ? "#5b21b6" :
          emotion === "happy"   ? "#065f46" :
          emotion === "sad"     ? "#1e40af" :
          emotion === "thinking"? "#9a3412" : "#6b7280",
      }}>
        {isListening           ? "🎤 Écoute"    :
         isTalking             ? "💬 Parle"     :
         emotion === "happy"   ? "😊 Content"   :
         emotion === "sad"     ? "😢 Triste"    :
         emotion === "thinking"? "🤔 Réfléchit" : "😐 Neutre"}
      </span>

      <style>{`
        @keyframes ping { 75%,100%{transform:scale(2);opacity:0;} }
        @keyframes bounce { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-6px);} }
      `}</style>
    </div>
  );
}