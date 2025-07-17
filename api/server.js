const express = require("express");
const { PrismaClient } = require("@prisma/client"); // 追加
const cors = require("cors"); // 追加
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config(); // 環境変数の読み込み

const app = express();
const port = 8080;

const prisma = new PrismaClient(); // 追加
const JWT_SECRET = process.env.JWT_SECRET;

app.use(express.json()); // 追加
app.use(cors()); // 追加

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "認証が必要です" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "トークンの有効期限が切れています。再度ログインしてください。",
      });
    }
    res.status(401).json({ error: "トークンが不正です" });
  }
}

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/me", authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (!user) {
    return res.status(404).json({ error: "ユーザーが見つかりません" });
  }
  res.json({ email: user.email });
});

// TODO一覧を取得
app.get("/todos", authMiddleware, async (req, res) => {
  const userId = req.user.userId; // トークンから取得
  try {
    const todos = await prisma.todo.findMany({
      where: { userId, completed: false }, // 自分のTodoだけ
      orderBy: { order: "asc" },
    });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: "取得に失敗しました" });
  }
});

app.delete("/todos/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId; // トークンから取得
  try {
    // 自分のTodoだけ削除できるようにする
    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo || todo.userId !== userId) {
      return res.status(403).json({ error: "権限がありません" });
    }
    await prisma.todo.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: "削除に失敗しました" });
  }
});
app.delete("/completed/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId; // トークンから取得
  try {
    // 自分のTodoだけ削除できるようにする
    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo || todo.userId !== userId) {
      return res.status(403).json({ error: "権限がありません" });
    }
    await prisma.todo.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: "削除に失敗しました" });
  }
});

app.put("/todos/order", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { orders } = req.body; // [{ id, order }, ...]
  if (!Array.isArray(orders)) {
    return res.status(400).json({ error: "orders配列が必要です" });
  }
  try {
    // すべてのTODOのorderを一括更新
    const updatePromises = orders.map(({ id, order }) =>
      prisma.todo.update({
        where: { id },
        data: { order },
      })
    );
    await Promise.all(updatePromises);
    res.json({ message: "並び順を更新しました" });
  } catch (error) {
    res.status(500).json({ error: "並び順の更新に失敗しました" });
  }
});

app.get("/todos/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId; // トークンから取得
  try {
    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo || todo.userId !== userId) {
      return res.status(404).json({ error: "見つかりませんでした" });
    }
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: "取得に失敗しました" });
  }
});

app.get("/todos/:id/next", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const current = await prisma.todo.findUnique({
    where: { id, completed: false },
  });
  if (!current || current.userId !== userId) {
    return res.status(404).json({ error: "見つかりませんでした" });
  }

  let next = await prisma.todo.findFirst({
    where: {
      userId,
      completed: false,
      order: { gt: current.order },
    },
    orderBy: { order: "asc" },
  });

  // 次がなければ一番早いTODOを返す
  if (!next) {
    next = await prisma.todo.findFirst({
      where: { userId, completed: false },
      orderBy: { order: "asc" },
    });
  }

  res.json(next);
});

// TODO追加
app.post("/todos", authMiddleware, async (req, res) => {
  const { content, due, priority } = req.body;
  const userId = req.user.userId;
  if (!content || !due || !priority) {
    return res.status(400).json({ error: "contentとdueとpriorityは必須です" });
  }
  try {
    // 既存TODOの最大orderを取得
    const maxOrderTodo = await prisma.todo.findFirst({
      where: { userId },
      orderBy: { order: "desc" },
    });
    const nextOrder = maxOrderTodo ? maxOrderTodo.order + 1 : 0;

    const todo = await prisma.todo.create({
      data: {
        content,
        due: new Date(due),
        userId,
        order: nextOrder, // ← ここで番号を振る
        priority,
      },
    });
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ error: "作成に失敗しました" });
  }
});

app.put("/todos/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { content, due, priority } = req.body;
  const userId = req.user.userId; // トークンから取得
  if (!content || !due || !priority) {
    return res.status(400).json({ error: "contentとdueとpriorityは必須です" });
  }
  try {
    // まず自分のTodoか確認
    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo || todo.userId !== userId) {
      return res.status(403).json({ error: "権限がありません" });
    }
    // 更新
    const updated = await prisma.todo.update({
      where: { id },
      data: {
        content,
        due: new Date(due),
        priority,
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "更新に失敗しました" });
  }
});

app.post("/todos/sort", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  try {
    // 1. 日付順で取得
    const todos = await prisma.todo.findMany({
      where: { userId, completed: false },
      orderBy: { due: "asc" },
    });

    // 2. 日付順でorderを振り直す
    const updatePromises = todos.map((todo, idx) =>
      prisma.todo.update({
        where: { id: todo.id, completed: false },
        data: { order: idx },
      })
    );
    await Promise.all(updatePromises);

    // 3. 更新後の一覧を返す（order順で取得）
    const sortedTodos = await prisma.todo.findMany({
      where: { userId, completed: false },
      orderBy: { order: "asc" },
    });
    res.json(sortedTodos);
  } catch (error) {
    res.status(500).json({ error: "並び替えに失敗しました" });
  }
});

app.post("/todos/priority-sort", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  try {
    // 1. 優先度順で取得
    const todos = await prisma.todo.findMany({
      where: { userId, completed: false },
      orderBy: { priority: "desc" },
    });

    // 2. 優先度順でorderを振り直す
    const updatePromises = todos.map((todo, idx) =>
      prisma.todo.update({
        where: { id: todo.id, completed: false },
        data: { order: idx },
      })
    );
    await Promise.all(updatePromises);

    // 3. 更新後の一覧を返す（order順で取得）
    const sortedTodos = await prisma.todo.findMany({
      where: { userId, completed: false },
      orderBy: { order: "asc" },
    });
    res.json(sortedTodos);
  } catch (error) {
    res.status(500).json({ error: "並び替えに失敗しました" });
  }
});

app.post("/todos/bulk-delete", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { ids } = req.body;
  try {
    await prisma.todo.updateMany({
      where: {
        id: { in: ids },
        userId,
      },
      data: {
        completed: true, // completedをtrueに変更
      },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "完了処理に失敗しました" });
  }
});

app.get("/completed", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  console.log("User ID:", userId); // デバッグ用
  try {
    const todos = await prisma.todo.findMany({
      where: { userId, completed: true }, // 完了したTODOのみ
      orderBy: { order: "asc" },
    });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: "取得に失敗しました" });
  }
});

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "emailとpasswordは必須です" });
  }
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "このメールアドレスは既に登録されています" });
    }
    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);
    // ユーザー作成
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
    res
      .status(201)
      .json({ message: "登録が完了しました。まもなく遷移します。" });
  } catch (error) {
    res.status(500).json({ error: "登録に失敗しました" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "emailとpasswordは必須です" });
  }
  try {
    // ユーザー検索
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ error: "メールアドレスまたはパスワードが違います" });
    }
    // パスワード照合
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res
        .status(401)
        .json({ error: "メールアドレスまたはパスワードが違います" });
    }
    // JWTトークン発行
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ message: "ログイン成功。まもなく遷移します", token });
  } catch (error) {
    res.status(500).json({ error: "ログインに失敗しました" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
