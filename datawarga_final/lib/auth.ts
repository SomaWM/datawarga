import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  id: string;
  username: string;
  role: string;
}

export function verifyToken(req: NextRequest): JWTPayload | null {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret') as JWTPayload;
  } catch {
    return null;
  }
}

export function unauthorized() {
  return Response.json({ error: 'Token tidak valid atau tidak ditemukan' }, { status: 401 });
}
