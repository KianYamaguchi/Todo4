import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../styles/home.module.css";

export default function Completed() {
  const [todos, setTodos] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    fetch("http://localhost:8080/completed", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) return console.error("Failed to fetch completed todos");
        return res.json();
      })
      .then((data) => setTodos(Array.isArray(data) ? data : []))
      .catch(() => setTodos([]));
  }, [router]);

  const deleteTodo = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:8080/completed/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete todo");
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    } catch (error) {
      console.error(error);
    }
  };
  const updateTodoStatus = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:8080/completed/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to update todo status");
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.container}>
      <h1>完了したTODO一覧</h1>
      <ul className={styles.list}>
        {todos.length === 0 ? (
          <li style={{ color: "#666" }}>完了したTODOはありません</li>
        ) : (
          todos.map((todo) => (
            <li key={todo.id} className={styles.item}>
              {todo.content}
              <span style={{ marginLeft: 12, fontSize: "0.9em" }}>
                優先度: {todo.priority}
              </span>
              <span style={{ marginLeft: 12, fontSize: "0.9em" }}>
                期限: {new Date(todo.due).toLocaleDateString()}
              </span>
              <button
                style={{
                  backgroundColor: "#faff60", // 明るい黄
                  color: "#222", // 文字色を濃いめに
                  marginLeft: 12,
                  border: "none",
                  padding: "6px 16px",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
                onClick={() => updateTodoStatus(todo.id)}
              >
                未完了に訂正
              </button>
              <button
                style={{ background: "#e74c3c", color: "#fff", marginLeft: 12 }}
                onClick={() => deleteTodo(todo.id)}
              >
                削除
              </button>
            </li>
          ))
        )}
      </ul>
      <button
        className={styles.button}
        style={{ marginTop: "2rem" }}
        onClick={() => router.push("/home")}
      >
        戻る
      </button>
    </div>
  );
}
