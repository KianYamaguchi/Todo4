import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../styles/home.module.css"; // ← 修正

export default function Home() {
  const router = useRouter();
  const [todos, setTodos] = useState([]);
  const [content, setContent] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [draggedIdx, setDraggedIdx] = useState(null);

  // TODO一覧を取得
  useEffect(() => {
    const token = localStorage.getItem("token"); // ログイン時に保存したトークン
    if (!token) {
      router.replace("/login"); // トークンがない場合は/loginへリダイレクト
      return;
    }
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
      body: JSON.stringify({ content, due, priority }),
    });
    if (res.ok) {
      const newTodo = await res.json();
      setTodos([...todos, newTodo]);
      setContent("");
      setDue("");
      setPriority("MEDIUM");
      fetchTodos(token);
    }
  };

  const handleDragStart = (idx) => setDraggedIdx(idx);

  const handleDragOver = (e) => e.preventDefault(); //ドロップ禁止を防ぐために必要

  const handleDrop = async (idx) => {
    if (draggedIdx === null || draggedIdx === idx) return; // ドラッグ元とドロップ先が同じ場合は何もしない
    const updated = [...todos];
    const [moved] = updated.splice(draggedIdx, 1); // ドラッグした要素を削除してmovedに保存
    updated.splice(idx, 0, moved); // ドロップ先にmovedを追加
    setTodos(updated);
    setDraggedIdx(null);

    // 並び替え後の順番をAPIで送信
    const token = localStorage.getItem("token");
    await fetch("http://localhost:8080/todos/order", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        orders: updated.map((todo, idx) => ({ id: todo.id, order: idx })),
      }),
    });
  };

  const handleSort = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:8080/todos/sort", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const sortedTodos = await res.json();
      setTodos(sortedTodos);
    }
  };

  const handlePrioritySort = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:8080/todos/priority-sort", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const sortedTodos = await res.json();
      setTodos(sortedTodos);
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
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          required
        >
          <option value="LOW">低</option>
          <option value="MEDIUM">中</option>
          <option value="HIGH">高</option>
        </select>
        <button className={styles.button} type="submit">
          追加
        </button>
      </form>
      <form onSubmit={handleSort}>
        <button>期限順</button>
      </form>
      <form onSubmit={handlePrioritySort}>
        <button>優先度順</button>
      </form>
      <ul className={styles.list}>
        {todos.map((todo, idx) => (
          <li
            className={styles.item}
            key={todo.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(idx)}
            style={{
              opacity: draggedIdx === idx ? 0.5 : 1,
              cursor: "move",
            }}
          >
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
