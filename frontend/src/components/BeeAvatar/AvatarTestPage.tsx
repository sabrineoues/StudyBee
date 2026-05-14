import { useState } from "react";
import { BeeAvatar } from "./BeeAvatar";
import { useAvatarChat } from "../../services/useAvatarChat";

export function AvatarTestPage() {
  const [inputText, setInputText] = useState("");
  const {
    avatarState,
    history,
    toggleListening,
    sendText,
    clearHistory,
  } = useAvatarChat();

  return (
    <div style={{
      minHeight:      "100vh",
      background:     "linear-gradient(135deg, #fef3c7, #fde68a)",
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      gap:            "24px",
      padding:        "32px",
      fontFamily:     "sans-serif",
    }}>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#92400e" }}>
        Buzzy — Avatar IA 🐝
      </h1>

      {/* Avatar */}
      <BeeAvatar
        emotion={avatarState.emotion}
        isTalking={avatarState.isTalking}
        isListening={avatarState.isListening}
        speechBubble={avatarState.speechBubble}
      />

      {/* Bouton micro */}
      <button
        onClick={toggleListening}
        style={{
          padding:      "12px 28px",
          borderRadius: "30px",
          border:       "none",
          cursor:       "pointer",
          fontSize:     "15px",
          fontWeight:   700,
          background:   avatarState.isListening
            ? "#ef4444"
            : avatarState.isThinking
            ? "#d1d5db"
            : "#f59e0b",
          color:        "white",
          transition:   "all 0.2s",
          animation:    avatarState.isListening ? "pulse 1s infinite" : "none",
        }}
        disabled={avatarState.isThinking || avatarState.isTalking}
      >
        {avatarState.isListening  ? "⏹ Arrêter"     :
         avatarState.isThinking   ? "🤔 Réflexion..." :
         avatarState.isTalking    ? "💬 Parle..."     :
                                    "🎤 Parler à Buzzy"}
      </button>

      {/* Input texte */}
      <div style={{ display: "flex", gap: "8px", width: "100%", maxWidth: "360px" }}>
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && inputText.trim()) {
              sendText(inputText);
              setInputText("");
            }
          }}
          placeholder="Ou écris un message..."
          style={{
            flex:         1,
            padding:      "10px 14px",
            borderRadius: "12px",
            border:       "1px solid #e5e7eb",
            fontSize:     "13px",
            outline:      "none",
          }}
        />
        <button
          onClick={() => { sendText(inputText); setInputText(""); }}
          disabled={!inputText.trim() || avatarState.isThinking}
          style={{
            padding:      "10px 18px",
            borderRadius: "12px",
            border:       "none",
            background:   "#f59e0b",
            color:        "white",
            fontWeight:   700,
            cursor:       "pointer",
            fontSize:     "13px",
          }}
        >
          Envoyer
        </button>
      </div>

      {/* Historique */}
      {history.length > 0 && (
        <div style={{
          width:        "100%",
          maxWidth:     "360px",
          background:   "white",
          borderRadius: "16px",
          padding:      "16px",
          maxHeight:    "200px",
          overflowY:    "auto",
          boxShadow:    "0 2px 12px rgba(0,0,0,0.08)",
        }}>
          {history.map((msg, i) => (
            <div key={i} style={{
              marginBottom: "8px",
              textAlign:    msg.role === "user" ? "right" : "left",
            }}>
              <span style={{
                display:      "inline-block",
                padding:      "6px 12px",
                borderRadius: "12px",
                fontSize:     "12px",
                background:   msg.role === "user" ? "#f59e0b" : "#f3f4f6",
                color:        msg.role === "user" ? "white" : "#374151",
                maxWidth:     "80%",
              }}>
                {msg.content}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Clear */}
      {history.length > 0 && (
        <button onClick={clearHistory} style={{
          padding:      "6px 16px",
          borderRadius: "20px",
          border:       "1px solid #e5e7eb",
          background:   "white",
          color:        "#6b7280",
          fontSize:     "12px",
          cursor:       "pointer",
        }}>
          Effacer conversation
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50%       { box-shadow: 0 0 0 12px rgba(239,68,68,0); }
        }
      `}</style>
    </div>
  );
}