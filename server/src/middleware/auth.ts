import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { verify } from 'hono/jwt';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthUser {
  id: string;
  email: string;
  role: 'customer' | 'admin' | 'support';
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing or invalid authorization header' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }
    
    const payload = await verify(token, secret);
    
    // Fetch user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub as string))
      .limit(1);
    
    if (!user) {
      throw new HTTPException(401, { message: 'User not found' });
    }
    
    // Attach user to context
    c.set('user', {
      id: user.id,
      email: user.email,
      role: user.role,
    } as AuthUser);
    
    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    
    throw new HTTPException(401, { 
      message: 'Invalid or expired token' 
    });
  }
}

export async function adminMiddleware(c: Context, next: Next) {
  const user = c.get('user') as AuthUser | undefined;
  
  if (!user || user.role !== 'admin') {
    throw new HTTPException(403, { 
      message: 'Admin access required' 
    });
  }
  
  await next();
}
