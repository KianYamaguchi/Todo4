import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function DetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [todo, setTodo] = useState(null);
  const [nextTodo, setNextTodo] = useState(null);
  const [content, setContent] = useState('');
  const [due, setDue] = useState('');


  useEffect(() => {
    if (!id) return;
    const fetchTodo = async () => {
      const res = await fetch(`http://localhost:8080/todos/${id}`);
      const data = await res.json();
      setTodo(data);
      setContent(data.content); // ← 追加
      setDue(data.due);  
    };
    fetchTodo();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchNextTodo = async () => {
      const res = await fetch(`http://localhost:8080/todos/${id}/next`);
      const data = await res.json();
      setNextTodo(data);
    };
    fetchNextTodo();
  }, [id]);


  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!todo) return;
    const res = await fetch(`http://localhost:8080/todos/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, due }),
    });
    if (res.ok) {
      const updatedTodo = await res.json();
      setTodo(updatedTodo);
    }
  };
  const handleDelete = async () => {
    if (!todo) return;
    const res = await fetch(`http://localhost:8080/todos/${todo.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setTodo(null);
      router.push('/home');
    }
  };



  if (!todo) return <div>Loading...</div>;

  return (
    <div>
      <h1>TODO詳細</h1>
      <h2>{content}</h2>
      <p>（期限: {due ? new Date(due).toLocaleDateString() : ""}）</p>
      <button onClick={() => router.push('/home')}>戻る</button>
      <button onClick={handleDelete}>削除</button>
      {nextTodo && (
        <button onClick={() => router.push(`/detail?id=${nextTodo.id}`)}>
          次のTODOへ
        </button>
      )}
      <form onSubmit={handleUpdate}>
        <h3>Todoの更新</h3>
        <input
          type="text"
          placeholder="やること"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <input
          type="date"
          value={due ? due.split("T")[0] : ""}
          onChange={(e) => setDue(e.target.value)}
          required
        />
        <button type="submit">更新</button>
      </form>

      
    </div>
  );
}
