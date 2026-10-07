/**
 * OpenAPI 3.0 Specification for ivo Electronics API
 * 
 * Auto-generated documentation source of truth.
 * Use this to generate client SDKs and API documentation.
 */

export const openAPISpec = {
  openapi: '3.0.3',
  info: {
    title: 'ivo Electronics API',
    description: 'Enterprise-grade e-commerce API for ivo Electronics',
    version: '1.0.0',
    contact: {
      name: 'ivo Electronics',
      email: 'support@ivo.example.com',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: 'https://api.ivo.example.com/api/v1',
      description: 'Production',
    },
    {
      url: 'https://staging-api.ivo.example.com/api/v1',
      description: 'Staging',
    },
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development',
    },
  ],
  security: [
    {
      bearerAuth: [],
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      // Error Envelope
      ErrorEnvelope: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: {
            type: 'boolean',
            enum: [false],
          },
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: {
                type: 'string',
                description: 'Machine-readable error code',
              },
              message: {
                type: 'string',
                description: 'Human-readable error message',
              },
              requestId: {
                type: 'string',
                description: 'Request correlation ID',
              },
              fieldErrors: {
                type: 'object',
                additionalProperties: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                description: 'Field-level validation errors',
              },
              details: {
                type: 'object',
                description: 'Additional error details',
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              timestamp: {
                type: 'string',
                format: 'date-time',
              },
              version: {
                type: 'string',
              },
            },
          },
        },
      },
      
      // Success Envelope
      SuccessEnvelope: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: {
            type: 'boolean',
            enum: [true],
          },
          data: {
            type: 'object',
            description: 'Response data',
          },
          meta: {
            type: 'object',
            properties: {
              requestId: {
                type: 'string',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
              },
              version: {
                type: 'string',
              },
              pagination: {
                $ref: '#/components/schemas/Pagination',
              },
            },
          },
        },
      },
      
      // Pagination
      Pagination: {
        type: 'object',
        required: ['page', 'pageSize', 'total', 'totalPages', 'hasNext', 'hasPrev'],
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
          },
          pageSize: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
          },
          total: {
            type: 'integer',
          },
          totalPages: {
            type: 'integer',
          },
          hasNext: {
            type: 'boolean',
          },
          hasPrev: {
            type: 'boolean',
          },
          nextCursor: {
            type: 'string',
          },
          prevCursor: {
            type: 'string',
          },
        },
      },
      
      // Product
      Product: {
        type: 'object',
        required: ['id', 'slug', 'name', 'status', 'price', 'currency'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          slug: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          status: {
            type: 'string',
            enum: ['draft', 'active', 'archived'],
          },
          brand: {
            type: 'string',
          },
          categoryId: {
            type: 'string',
            format: 'uuid',
          },
          price: {
            type: 'string',
            description: 'Decimal string for precision',
          },
          currency: {
            type: 'string',
            pattern: '^[A-Z]{3}$',
          },
          stockQuantity: {
            type: 'integer',
          },
          rating: {
            type: 'string',
          },
          reviewsCount: {
            type: 'integer',
          },
          imageUrl: {
            type: 'string',
            format: 'uri',
          },
          images: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          features: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          badge: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      
      // Order
      Order: {
        type: 'object',
        required: ['id', 'orderNumber', 'status', 'grandTotal', 'currency'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          orderNumber: {
            type: 'string',
          },
          userId: {
            type: 'string',
            format: 'uuid',
          },
          status: {
            type: 'string',
            enum: [
              'draft',
              'pending_payment',
              'paid',
              'processing',
              'fulfilled',
              'payment_failed',
              'cancelled',
              'partially_fulfilled',
              'refunded',
              'partially_refunded',
              'requires_review',
            ],
          },
          paymentStatus: {
            type: 'string',
            enum: [
              'created',
              'pending',
              'succeeded',
              'failed',
              'cancelled',
              'refund_pending',
              'partially_refunded',
              'refunded',
              'disputed',
            ],
          },
          currency: {
            type: 'string',
            pattern: '^[A-Z]{3}$',
          },
          subtotal: {
            type: 'string',
          },
          discountAmount: {
            type: 'string',
          },
          shippingAmount: {
            type: 'string',
          },
          taxAmount: {
            type: 'string',
          },
          grandTotal: {
            type: 'string',
          },
          shippingAddressSnapshot: {
            type: 'object',
          },
          items: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/OrderItem',
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      
      // Order Item
      OrderItem: {
        type: 'object',
        required: ['id', 'variantId', 'sku', 'productName', 'quantity', 'unitPrice', 'lineTotal'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          variantId: {
            type: 'string',
            format: 'uuid',
          },
          sku: {
            type: 'string',
          },
          productName: {
            type: 'string',
          },
          variantName: {
            type: 'string',
          },
          options: {
            type: 'object',
          },
          quantity: {
            type: 'integer',
          },
          unitPrice: {
            type: 'string',
          },
          unitTax: {
            type: 'string',
          },
          unitDiscount: {
            type: 'string',
          },
          lineTotal: {
            type: 'string',
          },
          currency: {
            type: 'string',
          },
        },
      },
      
      // Cart
      Cart: {
        type: 'object',
        required: ['id', 'sessionId', 'items', 'subtotal', 'currency'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          sessionId: {
            type: 'string',
          },
          userId: {
            type: 'string',
            format: 'uuid',
          },
          items: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/CartItem',
            },
          },
          subtotal: {
            type: 'string',
          },
          currency: {
            type: 'string',
          },
        },
      },
      
      // Cart Item
      CartItem: {
        type: 'object',
        required: ['id', 'variantId', 'quantity'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          variantId: {
            type: 'string',
            format: 'uuid',
          },
          quantity: {
            type: 'integer',
            minimum: 1,
          },
          product: {
            $ref: '#/components/schemas/Product',
          },
        },
      },
      
      // User
      User: {
        type: 'object',
        required: ['id', 'email', 'status'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          phone: {
            type: 'string',
          },
          status: {
            type: 'string',
            enum: ['active', 'suspended', 'deleted'],
          },
          firstName: {
            type: 'string',
          },
          lastName: {
            type: 'string',
          },
          roles: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      },
    },
    
    responses: {
      BadRequest: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorEnvelope',
            },
          },
        },
      },
      Unauthorized: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorEnvelope',
            },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorEnvelope',
            },
          },
        },
      },
      NotFound: {
        description: 'Not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorEnvelope',
            },
          },
        },
      },
      Conflict: {
        description: 'Conflict',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorEnvelope',
            },
          },
        },
      },
      InternalError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorEnvelope',
            },
          },
        },
      },
    },
    
    parameters: {
      PageParam: {
        name: 'page',
        in: 'query',
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1,
        },
        description: 'Page number',
      },
      PageSizeParam: {
        name: 'pageSize',
        in: 'query',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20,
        },
        description: 'Items per page',
      },
      CursorParam: {
        name: 'cursor',
        in: 'query',
        schema: {
          type: 'string',
        },
        description: 'Cursor for pagination',
      },
    },
  },
  
  paths: {
    // Health
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        security: [],
        responses: {
          '200': {
            description: 'Healthy',
          },
          '503': {
            description: 'Unhealthy',
          },
        },
      },
    },
    
    // Products
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List products',
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/PageSizeParam' },
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string' },
          },
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/Product',
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    
    '/products/{slug}': {
      get: {
        tags: ['Products'],
        summary: 'Get product by slug',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          $ref: '#/components/schemas/Product',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '404': {
            $ref: '#/components/responses/NotFound',
          },
        },
      },
    },
    
    // Cart
    '/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Get cart',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          $ref: '#/components/schemas/Cart',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    
    '/cart/items': {
      post: {
        tags: ['Cart'],
        summary: 'Add item to cart',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['variantId', 'quantity'],
                properties: {
                  variantId: { type: 'string', format: 'uuid' },
                  quantity: { type: 'integer', minimum: 1 },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
          },
          '400': {
            $ref: '#/components/responses/BadRequest',
          },
        },
      },
    },
    
    // Orders
    '/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Create order',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['shippingAddress', 'idempotencyKey'],
                properties: {
                  shippingAddress: { type: 'object' },
                  idempotencyKey: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          $ref: '#/components/schemas/Order',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': {
            $ref: '#/components/responses/BadRequest',
          },
          '409': {
            $ref: '#/components/responses/Conflict',
          },
        },
      },
    },
    
    '/orders/{publicReference}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order by reference',
        parameters: [
          {
            name: 'publicReference',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Success',
          },
          '404': {
            $ref: '#/components/responses/NotFound',
          },
        },
      },
    },
    
    // Account
    '/me': {
      get: {
        tags: ['Account'],
        summary: 'Get current user',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          $ref: '#/components/schemas/User',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    
    '/me/orders': {
      get: {
        tags: ['Account'],
        summary: 'Get user orders',
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/PageSizeParam' },
        ],
        responses: {
          '200': {
            description: 'Success',
          },
          '401': {
            $ref: '#/components/responses/Unauthorized',
          },
        },
      },
    },
    
    // Admin
    '/admin/products': {
      post: {
        tags: ['Admin'],
        summary: 'Create product',
        security: [{ bearerAuth: [] }],
        responses: {
          '201': {
            description: 'Created',
          },
          '400': {
            $ref: '#/components/responses/BadRequest',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
        },
      },
    },
    
    '/admin/orders': {
      get: {
        tags: ['Admin'],
        summary: 'List all orders',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/PageSizeParam' },
        ],
        responses: {
          '200': {
            description: 'Success',
          },
          '403': {
            $ref: '#/components/responses/Forbidden',
          },
        },
      },
    },
  },
  
  tags: [
    { name: 'Health', description: 'Health check endpoints' },
    { name: 'Products', description: 'Product catalogue' },
    { name: 'Cart', description: 'Shopping cart' },
    { name: 'Orders', description: 'Order management' },
    { name: 'Account', description: 'User account' },
    { name: 'Admin', description: 'Admin operations' },
  ],
};
