/**
 * AI Service Layer with Guardrails
 * 
 * Implements bounded AI capabilities for ivo Electronics.
 * AI is used for discovery and support, NOT for financial truth.
 * 
 * PRINCIPLE: AI must not set prices, create payments, modify stock,
 * or mark orders as paid. All financial operations go through
 * explicit human-approved application flows.
 */

import { createHash } from 'crypto';

// ============================================
// AI TOOL DEFINITIONS
// ============================================

export interface AITool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  validate: (params: any) => boolean;
  execute: (params: any, context: AIContext) => Promise<any>;
  permissions: string[];
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

export interface AIContext {
  userId?: string;
  sessionId: string;
  correlationId: string;
  permissions: string[];
  tokenBudget: number;
  timeout: number;
}

export interface AIResponse {
  success: boolean;
   any;
  error?: string;
  meta {
    tool: string;
    correlationId: string;
    latency: number;
    tokensUsed: number;
    model: string;
  };
}

// ============================================
// NARROW AI TOOLS
// ============================================

/**
 * Tool: Search Published Products
 * 
 * Natural-language product search using approved catalogue data.
 * Returns only published, active products.
 */
export const searchPublishedProducts: AITool = {
  name: 'searchPublishedProducts',
  description: 'Search for products using natural language. Returns only published, active products.',
  parameters: {
    query: { type: 'string', required: true, maxLength: 500 },
    filters: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        minPrice: { type: 'number' },
        maxPrice: { type: 'number' },
        inStock: { type: 'boolean' },
      },
    },
    limit: { type: 'number', default: 10, max: 50 },
  },
  permissions: ['customer.browse'],
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000, // 100 requests per minute
  },
  validate: (params) => {
    return (
      typeof params.query === 'string' &&
      params.query.length > 0 &&
      params.query.length <= 500
    );
  },
  execute: async (params, context) => {
    // Import here to avoid circular dependencies
    const { productsService } = await import('../services/products.service');
    
    const products = await productsService.getAll({
      search: params.query,
      category: params.filters?.category,
      minPrice: params.filters?.minPrice,
      maxPrice: params.filters?.maxPrice,
      limit: params.limit || 10,
    });

    // Filter to only active, published products
    const filtered = products.filter(p => 
      p.isActive && p.status === 'active'
    );

    return {
      products: filtered.map(p => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        price: p.price,
        currency: p.currency,
        imageUrl: p.imageUrl,
        stockQuantity: p.stockQuantity,
        rating: p.rating,
      })),
      total: filtered.length,
    };
  },
};

/**
 * Tool: Get Public Product Details
 * 
 * Returns detailed product information for a specific product.
 * Only returns published, active products.
 */
export const getPublicProductDetails: AITool = {
  name: 'getPublicProductDetails',
  description: 'Get detailed information about a specific product.',
  parameters: {
    productId: { type: 'string', required: true, format: 'uuid' },
  },
  permissions: ['customer.browse'],
  validate: (params) => {
    return typeof params.productId === 'string' && params.productId.length > 0;
  },
  execute: async (params, context) => {
    const { productsService } = await import('../services/products.service');
    
    const product = await productsService.getById(params.productId);
    
    if (!product || !product.isActive || product.status !== 'active') {
      throw new Error('Product not found or not available');
    }

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription,
      price: product.price,
      originalPrice: product.originalPrice,
      currency: product.currency,
      stockQuantity: product.stockQuantity,
      rating: product.rating,
      reviewsCount: product.reviewsCount,
      imageUrl: product.imageUrl,
      images: product.images,
      features: product.features,
      brand: product.brand,
      category: product.categoryId,
    };
  },
};

/**
 * Tool: Get Order Status for Authenticated Customer
 * 
 * Returns order status for a specific order.
 * Only returns orders owned by the authenticated user.
 */
export const getOrderStatusForAuthenticatedCustomer: AITool = {
  name: 'getOrderStatusForAuthenticatedCustomer',
  description: 'Get the status of a specific order. Only returns orders owned by the authenticated user.',
  parameters: {
    orderId: { type: 'string', required: true, format: 'uuid' },
  },
  permissions: ['customer.orders.view'],
  validate: (params) => {
    return typeof params.orderId === 'string' && params.orderId.length > 0;
  },
  execute: async (params, context) => {
    if (!context.userId) {
      throw new Error('Authentication required');
    }

    const { ordersService } = await import('../services/orders.service');
    
    const order = await ordersService.getOrderById(params.orderId, context.userId);
    
    if (!order) {
      throw new Error('Order not found or access denied');
    }

    // Return only status information, not full order details
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      // DO NOT return: items, addresses, payment details
    };
  },
};

/**
 * Tool: Create Support Ticket
 * 
 * Creates a support ticket for customer issues.
 */
export const createSupportTicket: AITool = {
  name: 'createSupportTicket',
  description: 'Create a support ticket for customer issues.',
  parameters: {
    category: { 
      type: 'string', 
      required: true,
      enum: ['order_status', 'refund_request', 'product_inquiry', 'shipping_issue', 'account_access', 'other']
    },
    message: { type: 'string', required: true, maxLength: 2000 },
    orderId: { type: 'string', format: 'uuid' },
  },
  permissions: ['customer.support'],
  validate: (params) => {
    return (
      typeof params.category === 'string' &&
      typeof params.message === 'string' &&
      params.message.length > 0 &&
      params.message.length <= 2000
    );
  },
  execute: async (params, context) => {
    // Sanitize message - remove any potential prompt injection
    const sanitizedMessage = sanitizeInput(params.message);
    
    // Create ticket in database
    const { db } = await import('../db');
    const { supportTickets } = await import('../db/schema');
    
    const [ticket] = await db.insert(supportTickets).values({
      userId: context.userId,
      sessionId: context.sessionId,
      category: params.category,
      message: sanitizedMessage,
      orderId: params.orderId,
      status: 'open',
      priority: 'medium',
    }).returning();

    return {
      ticketId: ticket.id,
      status: ticket.status,
      createdAt: ticket.createdAt,
      message: 'Support ticket created successfully. Our team will respond within 24 hours.',
    };
  },
};

/**
 * Tool: Draft Support Reply
 * 
 * Drafts a reply to a support ticket.
 * DOES NOT send the reply - requires human approval.
 */
export const draftSupportReply: AITool = {
  name: 'draftSupportReply',
  description: 'Draft a reply to a support ticket. This is a DRAFT only and requires human approval before sending.',
  parameters: {
    ticketId: { type: 'string', required: true, format: 'uuid' },
  },
  permissions: ['support.tickets.draft'],
  validate: (params) => {
    return typeof params.ticketId === 'string' && params.ticketId.length > 0;
  },
  execute: async (params, context) => {
    const { db } = await import('../db');
    const { supportTickets } = await import('../db/schema');
    
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, params.ticketId))
      .limit(1);

    if (!ticket) {
      throw new Error('Support ticket not found');
    }

    // Generate draft response using AI
    // This would call the AI model with the ticket context
    const draftResponse = await generateDraftResponse(ticket);

    return {
      ticketId: ticket.id,
      draft: draftResponse,
      disclaimer: 'This is an AI-generated draft. It requires human review before sending.',
      requiresApproval: true,
    };
  },
};

/**
 * Tool: Get Aggregate Operations Summary
 * 
 * Returns aggregate operations data for reporting.
 * Restricted to users with reporting permissions.
 */
export const getAggregateOperationsSummary: AITool = {
  name: 'getAggregateOperationsSummary',
  description: 'Get aggregate operations summary for a date range. Restricted to users with reporting permissions.',
  parameters: {
    startDate: { type: 'string', required: true, format: 'date' },
    endDate: { type: 'string', required: true, format: 'date' },
  },
  permissions: ['finance.reports'],
  validate: (params) => {
    return (
      typeof params.startDate === 'string' &&
      typeof params.endDate === 'string'
    );
  },
  execute: async (params, context) => {
    const { db } = await import('../db');
    const { orders, payments } = await import('../db/schema');
    
    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);

    // Get aggregate data
    const [orderStats] = await db
      .select({
        totalOrders: sql`COUNT(*)`,
        totalRevenue: sql`SUM(CAST(grand_total AS NUMERIC))`,
        paidOrders: sql`COUNT(*) FILTER (WHERE status = 'paid')`,
        cancelledOrders: sql`COUNT(*) FILTER (WHERE status = 'cancelled')`,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      );

    const [paymentStats] = await db
      .select({
        totalPayments: sql`COUNT(*)`,
        successfulPayments: sql`COUNT(*) FILTER (WHERE status = 'succeeded')`,
        failedPayments: sql`COUNT(*) FILTER (WHERE status = 'failed')`,
      })
      .from(payments)
      .where(
        and(
          gte(payments.createdAt, startDate),
          lte(payments.createdAt, endDate)
        )
      );

    return {
      dateRange: {
        start: params.startDate,
        end: params.endDate,
      },
      orders: {
        total: orderStats.totalOrders,
        paid: orderStats.paidOrders,
        cancelled: orderStats.cancelledOrders,
      },
      revenue: {
        total: orderStats.totalRevenue || 0,
        currency: 'GHS',
      },
      payments: {
        total: paymentStats.totalPayments,
        successful: paymentStats.successfulPayments,
        failed: paymentStats.failedPayments,
      },
      disclaimer: 'This is aggregate data for reporting purposes. Do not use for financial reconciliation.',
    };
  },
};

// ============================================
// AI SERVICE
// ============================================

export class AIService {
  private tools: Map<string, AITool> = new Map();
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    // Register all tools
    this.registerTool(searchPublishedProducts);
    this.registerTool(getPublicProductDetails);
    this.registerTool(getOrderStatusForAuthenticatedCustomer);
    this.registerTool(createSupportTicket);
    this.registerTool(draftSupportReply);
    this.registerTool(getAggregateOperationsSummary);
  }

  /**
   * Register an AI tool
   */
  registerTool(tool: AITool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Execute an AI tool with guardrails
   */
  async executeTool(
    toolName: string,
    params: any,
    context: AIContext
  ): Promise<AIResponse> {
    const startTime = Date.now();

    // Check if tool exists
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        success: false,
        error: `Tool '${toolName}' not found`,
        meta {
          tool: toolName,
          correlationId: context.correlationId,
          latency: Date.now() - startTime,
          tokensUsed: 0,
          model: 'none',
        },
      };
    }

    // Check permissions
    const hasPermission = tool.permissions.some(p => 
      context.permissions.includes(p)
    );
    if (!hasPermission) {
      return {
        success: false,
        error: 'Permission denied',
        meta {
          tool: toolName,
          correlationId: context.correlationId,
          latency: Date.now() - startTime,
          tokensUsed: 0,
          model: 'none',
        },
      };
    }

    // Check rate limit
    if (tool.rateLimit) {
      const rateLimitKey = `${toolName}:${context.userId || context.sessionId}`;
      const rateLimit = this.rateLimits.get(rateLimitKey);
      const now = Date.now();

      if (rateLimit && now < rateLimit.resetTime) {
        if (rateLimit.count >= tool.rateLimit.maxRequests) {
          return {
            success: false,
            error: 'Rate limit exceeded',
            meta {
              tool: toolName,
              correlationId: context.correlationId,
              latency: Date.now() - startTime,
              tokensUsed: 0,
              model: 'none',
            },
          };
        }
        rateLimit.count++;
      } else {
        this.rateLimits.set(rateLimitKey, {
          count: 1,
          resetTime: now + tool.rateLimit.windowMs,
        });
      }
    }

    // Validate parameters
    if (!tool.validate(params)) {
      return {
        success: false,
        error: 'Invalid parameters',
        meta {
          tool: toolName,
          correlationId: context.correlationId,
          latency: Date.now() - startTime,
          tokensUsed: 0,
          model: 'none',
        },
      };
    }

    try {
      // Execute tool with timeout
      const result = await Promise.race([
        tool.execute(params, context),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Tool execution timeout')), context.timeout)
        ),
      ]);

      return {
        success: true,
        data: result,
        meta {
          tool: toolName,
          correlationId: context.correlationId,
          latency: Date.now() - startTime,
          tokensUsed: estimateTokens(params, result),
          model: 'ivo-ai-v1',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
        meta {
          tool: toolName,
          correlationId: context.correlationId,
          latency: Date.now() - startTime,
          tokensUsed: 0,
          model: 'ivo-ai-v1',
        },
      };
    }
  }

  /**
   * Get list of available tools for a user
   */
  getAvailableTools(permissions: string[]): AITool[] {
    return Array.from(this.tools.values()).filter(tool =>
      tool.permissions.some(p => permissions.includes(p))
    );
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sanitize input to prevent prompt injection
 */
function sanitizeInput(input: string): string {
  // Remove potential prompt injection patterns
  return input
    .replace(/ignore previous instructions/gi, '[REDACTED]')
    .replace(/you are now/gi, '[REDACTED]')
    .replace(/system prompt/gi, '[REDACTED]')
    .replace(/assistant:/gi, '[REDACTED]')
    .trim();
}

/**
 * Estimate token usage (simplified)
 */
function estimateTokens(input: any, output: any): number {
  const inputStr = JSON.stringify(input);
  const outputStr = JSON.stringify(output);
  const totalChars = inputStr.length + outputStr.length;
  return Math.ceil(totalChars / 4); // Rough estimate: 4 chars per token
}

/**
 * Generate draft response for support ticket
 */
async function generateDraftResponse(ticket: any): Promise<string> {
  // This would call an AI model in production
  // For now, return a template
  return `Thank you for contacting us regarding your ${ticket.category} issue.

We have received your support ticket and our team will review it shortly.

Your ticket ID is: ${ticket.id}

We aim to respond within 24 hours. If this is urgent, please call our support line.

Best regards,
ivo Support Team`;
}

// ============================================
// SINGLETON
// ============================================

export const aiService = new AIService();
