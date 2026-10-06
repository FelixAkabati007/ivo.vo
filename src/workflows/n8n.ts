/**
 * n8n Workflow Definitions for ivo Electronics
 * 
 * These workflows handle asynchronous operations that should NOT
 * be executed in the request/response cycle. They are triggered
 * by webhooks from the server API.
 * 
 * CRITICAL: These workflows CANNOT mutate payment truth or
 * bypass application authorization. They are bounded automations.
 * 
 * Principle: "Automations fail safely"
 */

// ============================================
// WORKFLOW DEFINITIONS
// ============================================

export interface N8nWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: 'webhook' | 'schedule' | 'event';
  triggerConfig?: Record<string, any>;
  nodes: WorkflowNode[];
  errorHandling: 'retry' | 'alert' | 'dead_letter';
  permissions: string[];
}

export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
  next?: string | string[];
}

// ============================================
// WORKFLOW 1: Order Confirmation Email
// ============================================

export const orderConfirmationWorkflow: N8nWorkflow = {
  id: 'wf_order_confirmation',
  name: 'Order Confirmation Email',
  description: 'Sends order confirmation email when order is paid',
  trigger: 'webhook',
  triggerConfig: {
    path: '/webhooks/order/paid',
    method: 'POST',
    auth: 'header',
  },
  nodes: [
    {
      id: 'validate',
      type: 'function',
      name: 'Validate Webhook',
      config: {
        code: `
          // Verify webhook signature
          const signature = $input.first().json.headers['x-webhook-signature'];
          const payload = $input.first().json.body;
          
          if (!verifySignature(signature, payload)) {
            throw new Error('Invalid webhook signature');
          }
          
          return { orderId: payload.orderId, email: payload.customerEmail };
        `,
      },
      next: 'fetch_order',
    },
    {
      id: 'fetch_order',
      type: 'httpRequest',
      name: 'Fetch Order Details',
      config: {
        url: 'http://api:3000/internal/orders/{{ $json.orderId }}',
        method: 'GET',
        headers: {
          'X-Internal-Key': '{{ $env.INTERNAL_API_KEY }}',
        },
      },
      next: 'send_email',
    },
    {
      id: 'send_email',
      type: 'emailSend',
      name: 'Send Confirmation Email',
      config: {
        to: '{{ $json.email }}',
        subject: 'Order Confirmed - #{{ $json.orderNumber }}',
        html: `
          <h1>Thank you for your order!</h1>
          <p>Your order #{{ $json.orderNumber }} has been confirmed.</p>
          <p>Total: {{ $json.currency }} {{ $json.totalAmount }}</p>
          <p>We'll notify you when your order ships.</p>
        `,
      },
      next: 'log_success',
    },
    {
      id: 'log_success',
      type: 'function',
      name: 'Log Success',
      config: {
        code: `
          console.log('Order confirmation sent:', $json.orderId);
          return { success: true };
        `,
      },
    },
  ],
  errorHandling: 'retry',
  permissions: ['email:send', 'order:read'],
};

// ============================================
// WORKFLOW 2: Low Stock Alert
// ============================================

export const lowStockAlertWorkflow: N8nWorkflow = {
  id: 'wf_low_stock_alert',
  name: 'Low Stock Alert',
  description: 'Alerts when product stock falls below threshold',
  trigger: 'schedule',
  triggerConfig: {
    cron: '0 */6 * * *', // Every 6 hours
  },
  nodes: [
    {
      id: 'check_stock',
      type: 'httpRequest',
      name: 'Check Low Stock Products',
      config: {
        url: 'http://api:3000/internal/products/low-stock?threshold=10',
        method: 'GET',
        headers: {
          'X-Internal-Key': '{{ $env.INTERNAL_API_KEY }}',
        },
      },
      next: 'filter_results',
    },
    {
      id: 'filter_results',
      type: 'function',
      name: 'Filter Results',
      config: {
        code: `
          const products = $input.first().json.products;
          if (products.length === 0) {
            return { skip: true };
          }
          return { products, count: products.length };
        `,
      },
      next: 'send_alert',
    },
    {
      id: 'send_alert',
      type: 'slack',
      name: 'Send Slack Alert',
      config: {
        channel: '#inventory-alerts',
        text: '⚠️ Low Stock Alert: {{ $json.count }} products below threshold',
        attachments: JSON.stringify([
          {
            color: '#ff9800',
            fields: [
              {
                title: 'Products',
                value: '{{ $json.products.map(p => p.name + " (" + p.stock + " left)").join(", ") }}',
              },
            ],
          },
        ]),
      },
    },
  ],
  errorHandling: 'alert',
  permissions: ['product:read', 'slack:send'],
};

// ============================================
// WORKFLOW 3: Abandoned Cart Recovery
// ============================================

export const abandonedCartWorkflow: N8nWorkflow = {
  id: 'wf_abandoned_cart',
  name: 'Abandoned Cart Recovery',
  description: 'Sends reminder email for abandoned carts',
  trigger: 'schedule',
  triggerConfig: {
    cron: '0 */2 * * *', // Every 2 hours
  },
  nodes: [
    {
      id: 'find_abandoned',
      type: 'httpRequest',
      name: 'Find Abandoned Carts',
      config: {
        url: 'http://api:3000/internal/carts/abandoned?hours=24',
        method: 'GET',
        headers: {
          'X-Internal-Key': '{{ $env.INTERNAL_API_KEY }}',
        },
      },
      next: 'send_reminders',
    },
    {
      id: 'send_reminders',
      type: 'function',
      name: 'Send Reminder Emails',
      config: {
        code: `
          const carts = $input.first().json.carts;
          
          for (const cart of carts) {
            if (cart.customerEmail) {
              await sendEmail({
                to: cart.customerEmail,
                subject: 'You left items in your cart!',
                html: generateCartReminderHTML(cart),
              });
            }
          }
          
          return { processed: carts.length };
        `,
      },
    },
  ],
  errorHandling: 'dead_letter',
  permissions: ['cart:read', 'email:send'],
};

// ============================================
// WORKFLOW 4: Daily Reconciliation
// ============================================

export const dailyReconciliationWorkflow: N8nWorkflow = {
  id: 'wf_daily_reconciliation',
  name: 'Daily Payment Reconciliation',
  description: 'Reconciles payments with payment provider',
  trigger: 'schedule',
  triggerConfig: {
    cron: '0 2 * * *', // Daily at 2 AM
  },
  nodes: [
    {
      id: 'fetch_pending',
      type: 'httpRequest',
      name: 'Fetch Pending Payments',
      config: {
        url: 'http://api:3000/internal/payments/pending',
        method: 'GET',
        headers: {
          'X-Internal-Key': '{{ $env.INTERNAL_API_KEY }}',
        },
      },
      next: 'verify_with_provider',
    },
    {
      id: 'verify_with_provider',
      type: 'httpRequest',
      name: 'Verify with Payment Provider',
      config: {
        url: 'https://api.paystack.co/transaction/verify/{{ $json.reference }}',
        method: 'GET',
        headers: {
          Authorization: 'Bearer {{ $env.PAYSTACK_SECRET_KEY }}',
        },
      },
      next: 'update_status',
    },
    {
      id: 'update_status',
      type: 'httpRequest',
      name: 'Update Payment Status',
      config: {
        url: 'http://api:3000/internal/payments/{{ $json.paymentId }}/reconcile',
        method: 'POST',
        headers: {
          'X-Internal-Key': '{{ $env.INTERNAL_API_KEY }}',
        },
        body: {
          status: '{{ $json.status }}',
          providerResponse: '{{ $json }}',
        },
      },
      next: 'log_reconciliation',
    },
    {
      id: 'log_reconciliation',
      type: 'function',
      name: 'Log Reconciliation',
      config: {
        code: `
          console.log('Reconciled payment:', $json.paymentId);
          return { success: true };
        `,
      },
    },
  ],
  errorHandling: 'alert',
  permissions: ['payment:read', 'payment:write', 'paystack:verify'],
};

// ============================================
// WORKFLOW 5: Customer Support Ticket
// ============================================

export const supportTicketWorkflow: N8nWorkflow = {
  id: 'wf_support_ticket',
  name: 'Create Support Ticket',
  description: 'Creates support ticket for failed orders',
  trigger: 'webhook',
  triggerConfig: {
    path: '/webhooks/order/failed',
    method: 'POST',
    auth: 'header',
  },
  nodes: [
    {
      id: 'validate',
      type: 'function',
      name: 'Validate Webhook',
      config: {
        code: `
          const signature = $input.first().json.headers['x-webhook-signature'];
          if (!verifySignature(signature, $input.first().json.body)) {
            throw new Error('Invalid webhook signature');
          }
          return $input.first().json.body;
        `,
      },
      next: 'create_ticket',
    },
    {
      id: 'create_ticket',
      type: 'httpRequest',
      name: 'Create Zendesk Ticket',
      config: {
        url: 'https://ivo.zendesk.com/api/v2/tickets',
        method: 'POST',
        headers: {
          Authorization: 'Bearer {{ $env.ZENDESK_API_TOKEN }}',
        },
        body: {
          ticket: {
            subject: 'Order Failed - #{{ $json.orderNumber }}',
            description: 'Order {{ $json.orderNumber }} failed: {{ $json.error }}',
            priority: 'high',
            tags: ['order-failed', 'auto-generated'],
          },
        },
      },
    },
  ],
  errorHandling: 'retry',
  permissions: ['order:read', 'zendesk:create'],
};

// ============================================
// EXPORT ALL WORKFLOWS
// ============================================

export const allWorkflows: N8nWorkflow[] = [
  orderConfirmationWorkflow,
  lowStockAlertWorkflow,
  abandonedCartWorkflow,
  dailyReconciliationWorkflow,
  supportTicketWorkflow,
];

/**
 * Get workflow by ID
 */
export function getWorkflow(id: string): N8nWorkflow | undefined {
  return allWorkflows.find(w => w.id === id);
}

/**
 * Get workflows by trigger type
 */
export function getWorkflowsByTrigger(trigger: 'webhook' | 'schedule'): N8nWorkflow[] {
  return allWorkflows.filter(w => w.trigger === trigger);
}
