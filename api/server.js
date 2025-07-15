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
  if (!authHeader) return res.status(401).json({ error: "認証が必要です" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "トークンが不正です" });
  }
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// TODO一覧を取得
app.get("/todos", authMiddleware, async (req, res) => {
  const userId = req.user.userId; // トークンから取得
  try {
    const todos = await prisma.todo.findMany({
      where: { userId }, // 自分のTodoだけ
      orderBy: { due: "asc" },
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
  const current = await prisma.todo.findUnique({ where: { id } });
  if (!current || current.userId !== userId) {
    return res.status(404).json({ error: "見つかりませんでした" });
  }

  const next = await prisma.todo.findFirst({
    where: {
      userId, // 認証ユーザーのみ
      due: { gt: current.due },
    },
    orderBy: { due: "asc" },
  });
  res.json(next);
});

// TODO追加
app.post("/todos", authMiddleware, async (req, res) => {
  const { content, due } = req.body;
  const userId = req.user.userId; // トークンから取得
  console.log("userId:", userId); // デバッグ用
  if (!content || !due) {
    return res.status(400).json({ error: "contentとdueは必須です" });
  }
  try {
    const todo = await prisma.todo.create({
      data: {
        content,
        due: new Date(due),
        userId, // ここで保存
      },
    });
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ error: "作成に失敗しました" });
  }
});

app.put("/todos/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { content, due } = req.body;
  const userId = req.user.userId; // トークンから取得
  if (!content || !due) {
    return res.status(400).json({ error: "contentとdueは必須です" });
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
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "更新に失敗しました" });
  }
});

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "emailとpasswordは必須です" });
  }
  try {
    // 既存ユーザー確認
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
