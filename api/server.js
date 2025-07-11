const express = require('express');
const { PrismaClient } = require('@prisma/client'); // 追加
const cors = require('cors'); // 追加

const app = express();
const port = 8080;

const prisma = new PrismaClient(); // 追加

app.use(express.json()); // 追加
app.use(cors()); // 追加

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// TODO一覧を取得
app.get('/todos', async (req, res) => {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { due: 'asc' }
    });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: '取得に失敗しました' });
  }
});

app.delete('/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.todo.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: '削除に失敗しました' });
  }
});

app.get('/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo) {
      return res.status(404).json({ error: '見つかりませんでした' });
    }
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: '取得に失敗しました' });
  }
});


app.get('/todos/:id/next', async (req, res) => {
  const { id } = req.params;
  const current = await prisma.todo.findUnique({ where: { id } });
  if (!current) return res.status(404).json({ error: '見つかりませんでした' });

  const next = await prisma.todo.findFirst({
    where: { due: { gt: current.due } },
    orderBy: { due: 'asc' }
  });
  res.json(next);
});



// TODO追加
app.post('/todos', async (req, res) => {
  const { content, due } = req.body;
  if (!content || !due) {
    return res.status(400).json({ error: 'contentとdueは必須です' });
  }
  try {
    const todo = await prisma.todo.create({
      data: {
        content,
        due: new Date(due),
      },
    });
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ error: '作成に失敗しました' });
  }
});

app.put('/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { content, due } = req.body;
  if (!content || !due) {
    return res.status(400).json({ error: 'contentとdueは必須です' });
  }
  try {
    const todo = await prisma.todo.update({
      where: { id },
      data: {
        content,
        due: new Date(due),
      },
    });
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: '更新に失敗しました' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
