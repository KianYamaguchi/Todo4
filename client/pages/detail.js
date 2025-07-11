import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function DetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [todo, setTodo] = useState(null);
  const [nextTodo, setNextTodo] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchTodo = async () => {
      const res = await fetch(`http://localhost:8080/todos/${id}`);
      const data = await res.json();
      setTodo(data);
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
  if (!todo) return <div>Loading...</div>;

  return (
    <div>
      <h1>TODO詳細</h1>
      <h2>{todo.content}</h2>
      <p>期限: {new Date(todo.due).toLocaleDateString()}</p>
      <button onClick={() => router.push('/home')}>戻る</button>
      {nextTodo && (
        <button onClick={() => router.push(`/detail?id=${nextTodo.id}`)}>
          次のTODOへ
        </button>
      )}
    </div>
  );
}
