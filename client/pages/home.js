import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../styles/home.module.css"; // ← 修正

export default function Home() {
  const router = useRouter();
  const [todos, setTodos] = useState([]);
  const [content, setContent] = useState("");
  const [due, setDue] = useState("");

  // TODO一覧を取得
  useEffect(() => {
    const token = localStorage.getItem("token"); // ログイン時に保存したトークン
    if (!token) return;
    fetchTodos(token);
  }, []);

  const fetchTodos = async (token) => {
    const res = await fetch("http://localhost:8080/todos", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    setTodos(Array.isArray(data) ? data : []);
  };

  // TODO追加
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!content || !due) return;
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:8080/todos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, due }),
    });
    if (res.ok) {
      const newTodo = await res.json();
      setTodos([...todos, newTodo]);
      setContent("");
      setDue("");
      fetchTodos(token);
    }
  };

  return (
    <div className={styles.container}>
      <h1>TODOアプリ</h1>
      <form className={styles.form} onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="やること"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          required
        />
        <button className={styles.button} type="submit">
          追加
        </button>
      </form>
      <ul className={styles.list}>
        {todos.map((todo) => (
          <li className={styles.item} key={todo.id}>
            {todo.content}（期限: {new Date(todo.due).toLocaleDateString()}）
            <button
              className={styles.itemButton}
              onClick={() => router.push(`/detail?id=${todo.id}`)}
            >
              詳細
            </button>
          </li>
        ))}
      </ul>
      <button
        className={styles.button}
        style={{ marginBottom: "1rem" }}
        onClick={() => {
          localStorage.removeItem("token");
          router.push("/login");
        }}
      >
        ログアウト
      </button>
    </div>
  );
}
