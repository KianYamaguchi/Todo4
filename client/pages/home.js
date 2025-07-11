import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const [todos, setTodos] = useState([]);
  const [content, setContent] = useState("");
  const [due, setDue] = useState("");

  // TODO一覧を取得
  useEffect(() => {
   fetchTodos();
  }, []);

  const fetchTodos = async () => {
    const res = await fetch("http://localhost:8080/todos");
    const data = await res.json();
    setTodos(data);
  };

  // TODO追加
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!content || !due) return;
    const res = await fetch("http://localhost:8080/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, due }),
    });
    if (res.ok) {
      const newTodo = await res.json();
      setTodos([...todos, newTodo]);
      setContent("");
      setDue("");
      fetchTodos();
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "2rem auto" }}>
      <h1>TODOアプリ</h1>
      <form onSubmit={handleAdd} style={{ marginBottom: "1rem" }}>
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
        <button type="submit">追加</button>
      </form>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
              {todo.content}（期限: {new Date(todo.due).toLocaleDateString()}）
              <button onClick={() => router.push(`/detail?id=${todo.id}`)}>詳細</button>
          </li>
        ))}
      </ul>
    </div>
  );
}