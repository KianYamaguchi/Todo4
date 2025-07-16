import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import TodoHomeView from "./Todohome";

export default function Home() {
  const router = useRouter();
  const [todos, setTodos] = useState([]);
  const [content, setContent] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [checkedIds, setCheckedIds] = useState([]);
  const [loading, setLoading] = useState(true); // ローディング状態を管理

  // TODO一覧を取得
  useEffect(() => {
    const token = localStorage.getItem("token"); // ログイン時に保存したトークン
    if (!token) {
      router.replace("/login"); // トークンがない場合は/loginへリダイレクト
      return;
    }
    // ユーザー情報取得
    fetch("http://localhost:8080/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          // 401ならログアウトしてログイン画面へ
          localStorage.removeItem("token");
          router.replace("/login");
          return Promise.reject("認証エラー");
        }
        return res.json();
      })
      .then((data) => setUserEmail(data.email))
      .catch((err) => {
        // 401以外のエラーもここでキャッチ
        if (err !== "認証エラー") {
          alert("ユーザー情報の取得に失敗しました");
        }
      });
    fetchTodos(token);
  }, []);

  const fetchTodos = async (token) => {
    setLoading(true); // フェッチ開始前にローディングをtrueに
    const res = await fetch("http://localhost:8080/todos", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    setTodos(Array.isArray(data) ? data : []);
    await new Promise((resolve) => setTimeout(resolve, 350));
    setLoading(false); // フェッチ完了後にローディングをfalseに
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
  const deleteTodos = async (ids) => {
    const token = localStorage.getItem("token");
    await fetch("http://localhost:8080/todos/bulk-delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ids }),
    });
    setTodos(todos.filter((todo) => !ids.includes(todo.id)));
    setCheckedIds([]);
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
    <TodoHomeView
      userEmail={userEmail}
      content={content}
      setContent={setContent}
      due={due}
      setDue={setDue}
      priority={priority}
      setPriority={setPriority}
      handleAdd={handleAdd}
      handleSort={handleSort}
      handlePrioritySort={handlePrioritySort}
      todos={todos}
      checkedIds={checkedIds}
      setCheckedIds={setCheckedIds}
      loading={loading}
      draggedIdx={draggedIdx}
      handleDragStart={handleDragStart}
      handleDragOver={handleDragOver}
      handleDrop={handleDrop}
      router={router}
      deleteTodos={deleteTodos}
    />
  );
}
