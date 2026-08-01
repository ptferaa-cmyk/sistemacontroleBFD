import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

function safeUser(user: Record<string, unknown>) {
  const { senhaHash: _, ...rest } = user;
  return rest;
}

router.use(requireAuth as any);

router.get('/', requireAdmin as any, async (_req: Request, res: Response) => {
  try {
    const usuarios = await prisma.usuario.findMany({ orderBy: { nome: 'asc' } });
    res.json(usuarios.map(u => safeUser(u as unknown as Record<string, unknown>)));
  } catch {
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
});

router.post('/', requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const { nome, email, senha, cargo = 'funcionario' } = req.body;
    if (!nome || !email || !senha) {
      res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
      return;
    }
    if (!['admin', 'funcionario'].includes(cargo)) {
      res.status(400).json({ error: "Cargo inválido. Use 'admin' ou 'funcionario'." });
      return;
    }
    if (senha.length < 8) {
      res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });
      return;
    }
    const usuario = await prisma.usuario.create({
      data: { nome, email, senhaHash: await bcrypt.hash(senha, 12), cargo },
    });
    res.status(201).json(safeUser(usuario as unknown as Record<string, unknown>));
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(400).json({ error: 'E-mail já está em uso.' });
    } else {
      res.status(400).json({ error: 'Erro ao criar usuário.' });
    }
  }
});

router.get('/:id', requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }
    res.json(safeUser(usuario as unknown as Record<string, unknown>));
  } catch {
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.patch('/:id', requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { nome, cargo, ativo } = req.body;
    if (cargo && !['admin', 'funcionario'].includes(cargo)) {
      res.status(400).json({ error: 'Cargo inválido.' });
      return;
    }
    const data: Record<string, unknown> = {};
    if (nome !== undefined) data.nome = nome;
    if (cargo !== undefined) data.cargo = cargo;
    if (ativo !== undefined) data.ativo = Boolean(ativo);

    const usuario = await prisma.usuario.update({ where: { id }, data });
    res.json(safeUser(usuario as unknown as Record<string, unknown>));
  } catch (err: any) {
    if (err?.code === 'P2025') { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }
    res.status(400).json({ error: 'Erro ao atualizar usuário.' });
  }
});

router.delete('/:id', requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (id === (req as AuthRequest).user!.id) {
      res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
      return;
    }
    await prisma.usuario.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    if (err?.code === 'P2025') { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }
    res.status(400).json({ error: 'Erro ao excluir usuário.' });
  }
});

router.patch('/:id/senha', requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { nova_senha } = req.body;
    if (!nova_senha || nova_senha.length < 8) {
      res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });
      return;
    }
    await prisma.usuario.update({
      where: { id },
      data: { senhaHash: await bcrypt.hash(nova_senha, 12) },
    });
    res.json({ ok: true });
  } catch (err: any) {
    if (err?.code === 'P2025') { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }
    res.status(400).json({ error: 'Erro ao redefinir senha.' });
  }
});

router.patch('/:id/toggle', requireAdmin as any, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (id === (req as AuthRequest).user!.id) {
      res.status(400).json({ error: 'Você não pode desativar sua própria conta.' });
      return;
    }
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }
    const updated = await prisma.usuario.update({ where: { id }, data: { ativo: !usuario.ativo } });
    res.json({ ok: true, ativo: updated.ativo });
  } catch {
    res.status(400).json({ error: 'Erro ao alterar status.' });
  }
});

export default router;
