import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    nome: string;
    email: string;
    cargo: string;
    ativo: boolean;
  };
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não fornecido.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET!) as { sub: string };
    const user = await prisma.usuario.findUnique({
      where: { id: parseInt(payload.sub) },
      select: { id: true, nome: true, email: true, cargo: true, ativo: true },
    });

    if (!user) { res.status(401).json({ error: 'Usuário não encontrado.' }); return; }
    if (!user.ativo) { res.status(403).json({ error: 'Usuário inativo.' }); return; }

    (req as AuthRequest).user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Token inválido ou expirado.' });
    } else {
      res.status(500).json({ error: 'Erro interno.' });
    }
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as AuthRequest).user;
  if (user?.cargo !== 'admin') {
    res.status(403).json({ error: 'Acesso restrito a administradores.' });
    return;
  }
  next();
}
