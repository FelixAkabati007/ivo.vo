import { Hono } from 'hono';
import { z } from 'zod';
import { sign } from 'hono/jwt';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hash, compare } from 'bcrypt';

export const authRouter = new Hono();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/register
authRouter.post('/register', async (c) => {
  const body = await c.req.json();
  const data = registerSchema.parse(body);
  
  // Check if user exists
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);
  
  if (existing) {
    return c.json({
      success: false,
      error: {
        code: 'DUPLICATE_EMAIL',
        message: 'Email already registered',
      },
    }, 409);
  }
  
  // Hash password
  const passwordHash = await hash(data.password, 10);
  
  // Create user
  const [user] = await db
    .insert(users)
    .values({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    })
    .returning();
  
  // Generate JWT
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  
  const token = await sign({
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
  }, secret);
  
  return c.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    },
  }, 201);
});

// POST /api/auth/login
authRouter.post('/login', async (c) => {
  const body = await c.req.json();
  const data = loginSchema.parse(body);
  
  // Find user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);
  
  if (!user) {
    return c.json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    }, 401);
  }
  
  // Verify password
  const validPassword = await compare(data.password, user.passwordHash);
  if (!validPassword) {
    return c.json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    }, 401);
  }
  
  // Update last login
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));
  
  // Generate JWT
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  
  const token = await sign({
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
  }, secret);
  
  return c.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    },
  });
});
