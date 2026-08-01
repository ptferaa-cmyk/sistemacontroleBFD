import express, { RequestHandler } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from './lib/prisma';
import { requireAuth } from './middleware/auth';
import authRouter from './routes/auth';
import usuarioRouter from './routes/usuarios';

const app = express();
const PORT = process.env.PORT || 8000;

const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Permite chamadas sem origin (Postman, curl, mesmo servidor)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

// Setup uploads directory
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Static files public (product images for future catalog)
app.use('/uploads', express.static(uploadDir));

// Public routes
app.use('/auth', authRouter);

// All routes below require authentication
app.use(requireAuth as RequestHandler);

// User management (admin only — enforced inside router)
app.use('/usuarios', usuarioRouter);

// Upload with file validation
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
    cb(null, ok);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.post('/upload', upload.single('imagem'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhuma imagem enviada ou tipo inválido.' });
  }
  res.json({ imagemUrl: `/uploads/${req.file.filename}` });
});

// --- INSUMOS ---

app.get('/insumos', async (_req, res) => {
  try {
    const insumos = await prisma.insumo.findMany();
    res.json(insumos);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar insumos' });
  }
});

app.post('/insumos', async (req, res) => {
  try {
    const { nome, unidade, custoUnit, qtdMinima, codigoCor, quantidade, fornecedor } = req.body;
    if (!nome || !unidade) {
      return res.status(400).json({ error: 'Nome e unidade são obrigatórios.' });
    }
    const insumo = await prisma.insumo.create({
      data: {
        nome: String(nome).trim(),
        unidade: String(unidade).trim(),
        custoUnit: parseFloat(custoUnit) || 0,
        qtdMinima: parseFloat(qtdMinima) || 0,
        quantidade: parseFloat(quantidade) || 0,
        codigoCor: codigoCor || null,
        fornecedor: fornecedor ? String(fornecedor).trim() : null,
      },
    });
    res.status(201).json(insumo);
  } catch (error: any) {
    const msg = error?.code === 'P2002'
      ? `Já existe um insumo com o nome "${req.body.nome}".`
      : error?.message || 'Erro ao criar insumo.';
    res.status(400).json({ error: msg });
  }
});

app.patch('/insumos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, unidade, custoUnit, qtdMinima, codigoCor, quantidade, fornecedor } = req.body;
    const data: any = {};
    if (nome !== undefined) data.nome = String(nome).trim();
    if (unidade !== undefined) data.unidade = String(unidade).trim();
    if (custoUnit !== undefined) data.custoUnit = parseFloat(custoUnit) || 0;
    if (qtdMinima !== undefined) data.qtdMinima = parseFloat(qtdMinima) || 0;
    if (quantidade !== undefined) data.quantidade = parseFloat(quantidade) || 0;
    if (fornecedor !== undefined) data.fornecedor = fornecedor ? String(fornecedor).trim() : null;
    data.codigoCor = codigoCor || null;
    const insumo = await prisma.insumo.update({ where: { id: parseInt(id) }, data });
    res.json(insumo);
  } catch (error: any) {
    const msg = error?.code === 'P2002'
      ? `Já existe um insumo com o nome "${req.body.nome}".`
      : error?.message || 'Erro ao atualizar insumo.';
    res.status(400).json({ error: msg });
  }
});

app.delete('/insumos/:id', async (req, res) => {
  try {
    await prisma.insumo.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(400).json({ error: 'Erro ao excluir insumo' });
  }
});

// --- MOVIMENTAÇÕES ---

app.get('/movimentacoes', async (_req, res) => {
  try {
    const movimentacoes = await prisma.movimentacao.findMany({
      include: {
        insumo: true,
        usuario: { select: { id: true, nome: true, cargo: true } },
      },
      orderBy: { criadoEm: 'desc' },
      take: 200,
    });
    res.json(movimentacoes);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar movimentações' });
  }
});

app.post('/insumos/:id/movimentacao', async (req, res) => {
  try {
    const insumoId = parseInt(req.params.id);
    const { tipo, quantidade, motivo } = req.body;
    const qtd = parseFloat(quantidade);
    const usuarioId = (req as any).user?.id ?? null;

    const result = await prisma.$transaction(async (tx) => {
      const insumo = await tx.insumo.findUnique({ where: { id: insumoId } });
      if (!insumo) throw new Error('Insumo não encontrado');

      let novaQuantidade = insumo.quantidade;
      if (tipo === 'entrada') novaQuantidade += qtd;
      else if (tipo === 'saida') novaQuantidade -= qtd;
      else throw new Error('Tipo de movimentação inválido');

      if (novaQuantidade < 0) throw new Error('Estoque insuficiente');

      const mov = await tx.movimentacao.create({
        data: { insumoId, tipo, quantidade: qtd, motivo, usuarioId },
      });
      await tx.insumo.update({ where: { id: insumoId }, data: { quantidade: novaQuantidade } });
      return mov;
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao registrar movimentação' });
  }
});

app.get('/insumos/:id/historico', async (req, res) => {
  try {
    const historico = await prisma.movimentacao.findMany({
      where: { insumoId: parseInt(req.params.id) },
      include: { usuario: { select: { id: true, nome: true, cargo: true } } },
      orderBy: { criadoEm: 'desc' },
    });
    res.json(historico);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// --- ALERTAS ---

app.get('/alertas', async (_req, res) => {
  try {
    const insumos = await prisma.insumo.findMany();
    const alertas = insumos.filter(i => i.quantidade <= i.qtdMinima * 1.15);
    res.json(alertas);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
});

// --- ARTES ---

app.get('/artes', async (_req, res) => {
  try {
    const artes = await prisma.arte.findMany({
      include: { receitas: { include: { insumo: true } } },
    });
    const artesComCusto = artes.map(arte => {
      const custoProducao = arte.receitas.reduce(
        (acc, rec) => acc + rec.quantidade * rec.insumo.custoUnit,
        0
      );
      return { ...arte, custoProducao, margemBruta: arte.precoVenda - custoProducao };
    });
    res.json(artesComCusto);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar artes' });
  }
});

app.post('/artes', async (req, res) => {
  try {
    const { nome, descricao, precoVenda, imagemUrl } = req.body;
    const arte = await prisma.arte.create({ data: { nome, descricao, precoVenda, imagemUrl } });
    res.status(201).json(arte);
  } catch {
    res.status(400).json({ error: 'Erro ao criar arte' });
  }
});

app.patch('/artes/:id', async (req, res) => {
  try {
    const { nome, descricao, precoVenda, imagemUrl } = req.body;
    const arte = await prisma.arte.update({
      where: { id: parseInt(req.params.id) },
      data: { nome, descricao, precoVenda, imagemUrl },
    });
    res.json(arte);
  } catch {
    res.status(400).json({ error: 'Erro ao atualizar arte' });
  }
});

app.delete('/artes/:id', async (req, res) => {
  try {
    await prisma.arte.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch {
    res.status(400).json({ error: 'Erro ao excluir arte' });
  }
});

// --- RECEITAS ---

app.get('/artes/:id/receita', async (req, res) => {
  try {
    const receitas = await prisma.receita.findMany({
      where: { arteId: parseInt(req.params.id) },
      include: { insumo: true },
    });
    res.json(receitas);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar receitas' });
  }
});

app.post('/artes/:id/receita/bulk', async (req, res) => {
  try {
    const arteId = parseInt(req.params.id);
    const { receitas } = req.body;
    await prisma.$transaction(async (tx) => {
      await tx.receita.deleteMany({ where: { arteId } });
      if (receitas?.length > 0) {
        await tx.receita.createMany({
          data: receitas.map((r: any) => ({
            arteId,
            insumoId: parseInt(r.insumoId),
            quantidade: parseFloat(r.quantidade),
          })),
        });
      }
    });
    res.json({ message: 'Receitas atualizadas com sucesso' });
  } catch {
    res.status(400).json({ error: 'Erro ao atualizar receitas em lote' });
  }
});

app.post('/artes/:id/receita', async (req, res) => {
  try {
    const { insumoId, quantidade } = req.body;
    const arteId = parseInt(req.params.id);
    const receita = await prisma.receita.upsert({
      where: { arteId_insumoId: { arteId, insumoId: parseInt(insumoId) } },
      update: { quantidade: parseFloat(quantidade) },
      create: { arteId, insumoId: parseInt(insumoId), quantidade: parseFloat(quantidade) },
    });
    res.status(201).json(receita);
  } catch {
    res.status(400).json({ error: 'Erro ao criar ou atualizar receita' });
  }
});

app.delete('/artes/:id/receita/:insumoId', async (req, res) => {
  try {
    await prisma.receita.delete({
      where: {
        arteId_insumoId: { arteId: parseInt(req.params.id), insumoId: parseInt(req.params.insumoId) },
      },
    });
    res.status(204).send();
  } catch {
    res.status(400).json({ error: 'Erro ao remover insumo da receita' });
  }
});

// --- BAIXA DE PRODUÇÃO MANUAL ---

app.post('/artes/:id/baixa', async (req, res) => {
  try {
    const arteId = parseInt(req.params.id);
    const { qtdProduzida, insumosGastos } = req.body;
    const qtdProd = parseInt(qtdProduzida || '1');

    if (!Array.isArray(insumosGastos) || insumosGastos.length === 0) {
      return res.status(400).json({ error: 'Nenhum insumo informado para dar baixa' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const arte = await tx.arte.findUnique({ where: { id: arteId } });
      if (!arte) throw new Error('Arte não encontrada');

      const baixas = [];
      for (const gasto of insumosGastos) {
        const insumo = await tx.insumo.findUnique({ where: { id: gasto.insumoId } });
        if (!insumo) throw new Error(`Insumo ID ${gasto.insumoId} não encontrado`);

        const qtdGasta = parseFloat(gasto.quantidade);
        const novaQtd = insumo.quantidade - qtdGasta;
        if (novaQtd < 0) throw new Error(`Estoque insuficiente de ${insumo.nome}.`);

        await tx.insumo.update({ where: { id: insumo.id }, data: { quantidade: novaQtd } });
        const mov = await tx.movimentacao.create({
          data: {
            insumoId: insumo.id,
            tipo: 'saida',
            quantidade: qtdGasta,
            motivo: `Produção manual: ${qtdProd}x ${arte.nome}`,
            usuarioId: (req as any).user?.id ?? null,
          },
        });
        baixas.push(mov);
      }
      return baixas;
    });

    res.status(201).json({ message: `Baixa de ${qtdProd} artes registrada com sucesso`, movimentacoes: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao dar baixa na produção' });
  }
});

// --- DASHBOARD ---

app.get('/dashboard', async (_req, res) => {
  try {
    const hojeInicio = new Date();
    hojeInicio.setHours(0, 0, 0, 0);
    const hojeFim = new Date(hojeInicio);
    hojeFim.setDate(hojeFim.getDate() + 1);
    const seteDiasAtras = new Date(hojeInicio);
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);

    const [todosInsumos, todasArtes, movHoje, movRecentes] = await Promise.all([
      prisma.insumo.findMany(),
      prisma.arte.findMany({
        orderBy: { criadoEm: 'desc' },
        include: { receitas: { include: { insumo: true } } },
      }),
      prisma.movimentacao.findMany({
        where: { criadoEm: { gte: hojeInicio, lt: hojeFim } },
        select: { tipo: true },
      }),
      prisma.movimentacao.findMany({
        where: { criadoEm: { gte: seteDiasAtras } },
        select: { tipo: true, criadoEm: true },
        orderBy: { criadoEm: 'asc' },
      }),
    ]);

    const alertas = todosInsumos.filter(i => i.quantidade <= i.qtdMinima * 1.15);
    const valorTotalEstoque = todosInsumos.reduce((acc, i) => acc + i.quantidade * i.custoUnit, 0);

    const artesRecentes = todasArtes.slice(0, 4).map(arte => {
      const custoProducao = arte.receitas.reduce(
        (acc, rec) => acc + rec.quantidade * rec.insumo.custoUnit, 0
      );
      return { ...arte, custoProducao, margemBruta: arte.precoVenda - custoProducao };
    });

    const topInsumos = [...todosInsumos]
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 6)
      .map(i => ({ label: i.nome.slice(0, 4).toUpperCase(), nome: i.nome, value: i.quantidade }));

    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const movPorDia = Array.from({ length: 7 }, (_, i) => {
      const dia = new Date(seteDiasAtras);
      dia.setDate(dia.getDate() + i);
      const diaStr = dia.toISOString().split('T')[0];
      const movDia = movRecentes.filter(
        m => m.criadoEm.toISOString().split('T')[0] === diaStr
      );
      return {
        label: diasSemana[dia.getDay()],
        entradas: movDia.filter(m => m.tipo === 'entrada').length,
        saidas: movDia.filter(m => m.tipo === 'saida').length,
        total: movDia.length,
      };
    });

    res.json({
      totalInsumos: todosInsumos.length,
      valorTotalEstoque,
      totalArtes: todasArtes.length,
      totalAlertas: alertas.length,
      entradasHoje: movHoje.filter(m => m.tipo === 'entrada').length,
      saidasHoje: movHoje.filter(m => m.tipo === 'saida').length,
      alertas: alertas.slice(0, 4),
      artesRecentes,
      topInsumos,
      movPorDia,
    });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard.' });
  }
});

// --- SEED & START ---

async function seedAdmin(): Promise<void> {
  const count = await prisma.usuario.count();
  if (count === 0) {
    await prisma.usuario.create({
      data: {
        nome: 'Administrador',
        email: 'admin@marte.com',
        senhaHash: await bcrypt.hash('Admin@1234', 12),
        cargo: 'admin',
      },
    });
    console.log('Admin inicial criado: admin@marte.com / Admin@1234');
    console.log('IMPORTANTE: altere a senha no primeiro acesso.');
  }
}

seedAdmin().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend rodando em http://localhost:${PORT}`);
  });
});
