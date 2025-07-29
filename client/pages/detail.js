import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "../styles/detail.module.css"; // 追加

const token =
  typeof window !== "undefined" ? localStorage.getItem("token") : "";

export default function DetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [todo, setTodo] = useState(null);
  const [nextTodo, setNextTodo] = useState(null);
  const [content, setContent] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchTodo = async () => {
      const res = await fetch(`http://localhost:8080/todos/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setTodo(data);
      setContent(data.content);
      setDue(data.due);
      setPriority(data.priority);
    };
    fetchTodo();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchNextTodo = async () => {
      const res = await fetch(`http://localhost:8080/todos/${id}/next`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setNextTodo(data);
    };
    fetchNextTodo();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    console.log(token);
    if (!todo) return;
    const res = await fetch(`http://localhost:8080/todos/${todo.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, due, priority }),
    });
    if (res.ok) {
      const updatedTodo = await res.json();
      setTodo(updatedTodo);
      setMessage("TODOが更新されました。");
      setTimeout(() => {
        setMessage("");
      }, 1500);
    }
  };
  const handleDelete = async () => {
    if (!todo) return;
    const ok = window.confirm("本当に削除してよろしいですか？");
    if (!ok) return;

    const res = await fetch(`http://localhost:8080/todos/${todo.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      setTodo(null);
      router.push("/home");
    }
  };

  if (!todo) return <div>Loading...</div>;

  return (
    <div className={styles.detailContainer}>
      <h1 className={styles.detailTitle}>TODO詳細</h1>
      <h2>{content}</h2>
      <p>（期限: {due ? new Date(due).toLocaleDateString() : ""}）</p>
      <p>（優先度: {priority}）</p>
      <p>（ {todo.completed ? "完了" : "未完了"}）</p>
      <button
        className={styles.detailButton}
        onClick={() => router.push("/home")}
      >
        戻る
      </button>
      <button
        className={`${styles.detailButton} ${styles.deleteButton}`}
        onClick={handleDelete}
      >
        削除
      </button>
      {nextTodo && (
        <button
          className={`${styles.detailButton} ${styles.nextButton}`}
          onClick={() => router.push(`/detail?id=${nextTodo.id}`)}
        >
          次のTODOへ
        </button>
      )}
      <form className={styles.updateForm} onSubmit={handleUpdate}>
        <h3>Todoの更新</h3>
        <input
          className={styles.updateInput}
          type="text"
          placeholder="やること"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <input
          className={styles.updateInput}
          type="date"
          value={due ? due.split("T")[0] : ""}
          onChange={(e) => setDue(e.target.value)}
          required
        />
        <select
          className={styles.updateSelect}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          required
        >
          <option value="LOW">低</option>
          <option value="MEDIUM">中</option>
          <option value="HIGH">高</option>
        </select>
        {message && <p className={styles.message}>{message}</p>}
        <button className={styles.detailButton} type="submit">
          更新
        </button>
      </form>
    </div>
  );
}
