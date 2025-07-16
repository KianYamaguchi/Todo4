import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:8080/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("token", data.token);
      setMessage("ログインに成功しました。まもなく遷移します");
      setEmail("");
      setPassword("");
      console.log("ログイン成功:", data);
      setTimeout(() => router.push("/home"), 1500);
    } else {
      const data = await res.json();
      setMessage(data.error || "ログインに失敗しました");
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "2rem auto",
        padding: "2rem",
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <h2>ユーザーログイン</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", marginBottom: "1rem", padding: "0.5rem" }}
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", marginBottom: "1rem", padding: "0.5rem" }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "0.5rem",
            background: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: 4,
          }}
        >
          ログイン
        </button>
      </form>
      <button
        type="button"
        style={{
          width: "100%",
          padding: "0.5rem",
          marginTop: "1rem",
          background: "#f0f0f0",
          color: "#333", // ← 文字色も見やすく
          border: "none",
          borderRadius: 4,
        }}
        onClick={() => router.push("/register")}
      >
        新規登録はこちら
      </button>
      {message && (
        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          {/* ログイン成功時だけスピナー＋チェックマーク */}
          {message.includes("成功") ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* スピナー */}
              <div
                style={{
                  width: "2.5em",
                  height: "2.5em",
                  border: "0.4em solid #0070f3",
                  borderTop: "0.4em solid #eaf6ff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  marginBottom: "0.7em",
                }}
              />
              {/* チェックマークをアニメーションで表示 */}
              <span
                style={{
                  display: "inline-block",
                  fontSize: "2em",
                  color: "#38a169",
                  opacity: message.includes("成功") ? 1 : 0,
                  transition: "opacity 0.5s 1s",
                  fontWeight: "bold",
                }}
              >
                ✔
              </span>
              <p
                style={{
                  marginTop: "0.5em",
                  color: "#0070f3",
                  fontWeight: "bold",
                }}
              >
                {message}
              </p>
              {/* スピナー用アニメーション */}
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : (
            <p style={{ color: "#e53e3e" }}>{message}</p>
          )}
        </div>
      )}
    </div>
  );
}
