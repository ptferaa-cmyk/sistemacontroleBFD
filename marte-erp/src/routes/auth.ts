import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;

function safeUser(user: Record<string, unknown>) {
  const { senhaHash: _, ...rest } = user;
  return rest;
}

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      return;
    }

    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(senha, user.senhaHash))) {
      res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      return;
    }
    if (!user.ativo) {
      res.status(403).json({ error: 'Usuário inativo. Contate o administrador.' });
      return;
    }

    const token = jwt.sign({ sub: String(user.id) }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ access_token: token, token_type: 'bearer', user: safeUser(user as unknown as Record<string, unknown>) });
  } catch {
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: (req as AuthRequest).user!.id },
      select: { id: true, nome: true, email: true, cargo: true, ativo: true, criadoEm: true },
    });
    if (!user) { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.patch('/me/senha', requireAuth, async (req: Request, res: Response) => {
  try {
    const { senha_atual, nova_senha } = req.body;
    if (!senha_atual || !nova_senha) {
      res.status(400).json({ error: 'Informe a senha atual e a nova senha.' });
      return;
    }
    if (nova_senha.length < 8) {
      res.status(400).json({ error: 'A nova senha deve ter pelo menos 8 caracteres.' });
      return;
    }

    const user = await prisma.usuario.findUnique({ where: { id: (req as AuthRequest).user!.id } });
    if (!user || !(await bcrypt.compare(senha_atual, user.senhaHash))) {
      res.status(400).json({ error: 'Senha atual incorreta.' });
      return;
    }

    await prisma.usuario.update({
      where: { id: user.id },
      data: { senhaHash: await bcrypt.hash(nova_senha, 12) },
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro interno.' });
  }
});

export default router;
