import styles from "../styles/home.module.css";

export default function TodoHomeView(props) {
  const {
    userEmail,
    content,
    setContent,
    due,
    setDue,
    priority,
    setPriority,
    handleAdd,
    handleSort,
    handlePrioritySort,
    todos,
    checkedIds,
    setCheckedIds,
    loading,
    draggedIdx,
    handleDragStart,
    handleDragOver,
    handleDrop,
    router,
    deleteTodos,
  } = props;

  return (
    <div className={styles.container}>
      <h1>TODOアプリ</h1>
      <div>ログイン中: {userEmail}</div>
      <form className={styles.form} onSubmit={handleAdd}>
        <input
          id="content"
          name="content"
          type="text"
          placeholder="やること"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <input
          id="due"
          name="due"
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          required
        />
        <select
          id="priority"
          name="priority"
          className={styles.prioritySelect}
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
      <div>
        ソート：
        <form onSubmit={handleSort} className={styles.sortForm}>
          <button>期限順</button>
        </form>
        <form onSubmit={handlePrioritySort} className={styles.sortForm}>
          <button>優先度順</button>
        </form>
      </div>
      {loading ? (
        <div className={styles.spinner}>Loading...</div>
      ) : (
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
              <div>
                <div>
                  <input
                    type="checkbox"
                    style={{ fontWeight: "bold" }}
                    checked={checkedIds.includes(todo.id)}
                    onChange={() => {
                      setCheckedIds((prev) =>
                        prev.includes(todo.id)
                          ? prev.filter((id) => id !== todo.id)
                          : [...prev, todo.id]
                      );
                    }}
                  />
                  {todo.content}
                </div>
                <div style={{ fontSize: "0.95em", color: "#666" }}>
                  期限: {new Date(todo.due).toLocaleDateString()}
                  <span
                    style={{
                      color:
                        todo.priority === "HIGH"
                          ? "#e74c3c"
                          : todo.priority === "MEDIUM"
                          ? "#e67e22"
                          : "#3498db",
                      fontWeight: "bold",
                    }}
                  >
                    優先度:{" "}
                    {todo.priority === "HIGH"
                      ? "高"
                      : todo.priority === "MEDIUM"
                      ? "中"
                      : "低"}
                  </span>
                </div>
              </div>
              <button
                className={styles.itemButton}
                onClick={() => router.push(`/detail?id=${todo.id}`)}
              >
                詳細
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        className={styles.button}
        style={{ marginBottom: "1rem", marginRight: "1rem" }}
        onClick={() => {
          localStorage.removeItem("token");
          router.push("/login");
        }}
      >
        ログアウト
      </button>
      <button
        className={styles.button}
        style={{ marginBottom: "1rem" }}
        onClick={async () => {
          deleteTodos(checkedIds);
        }}
        disabled={checkedIds.length === 0}
      >
        チェックして完了
      </button>
    </div>
  );
}
