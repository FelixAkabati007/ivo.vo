/**
 * n8n Workflow Definitions
 * 
 * Complete workflow definitions for all 6 recommended workflows.
 * Each workflow is idempotent, safe to replay, and follows best practices.
 */

export interface N8nWorkflowDefinition {
  id: string;
  name: string;
  description: string;
  trigger: 'webhook' | 'schedule' | 'event';
  triggerConfig?: any;
  nodes: WorkflowNode[];
  errorHandling: {
    retries: number;
    backoffMs: number;
    deadLetter: boolean;
    alertOnFailure: boolean;
  };
  idempotency: {
    keyField: string;
    deduplicationWindow: string; // e.g., '24h', '7d'
  };
  security: {
    validateSignature: boolean;
    requiredPermissions: string[];
    sanitizePayload: boolean;
  };
}

export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  config: any;
  next?: string | string[];
  onError?: string;
}

// ============================================
// WORKFLOW A: Order Confirmation
// ============================================

export const orderConfirmationWorkflow: N8nWorkflowDefinition = {
  id: 'wf_order_confirmation',
  name: 'Order Confirmation',
  description: 'Sends order confirmation email/SMS/WhatsApp after verified payment',
  trigger: 'webhook',
  triggerConfig: {
    path: '/webhook/order-confirmation',
    method: 'POST',
    responseMode: 'onReceived',
  },
  nodes: [
    {
      id: 'validate_event',
      type: 'function',
      name: 'Validate Event',
      config: {
        code: `
          // Validate event schema
          const event = $input.first().json;
          
          if (!event.eventId || !event.eventType || !event.payload) {
            throw new Error('Invalid event schema');
          }
          
          if (event.eventType !== 'order.paid') {
            throw new Error('Invalid event type: ' + event.eventType);
          }
          
          // Check for duplicate event
          const eventExists = await checkEventProcessed(event.eventId);
          if (eventExists) {
            return { skip: true, reason: 'Event already processed' };
          }
          
          return event;
        `,
      },
      next: 'load_order',
    },
    {
      id: 'load_order',
      type: 'httpRequest',
      name: 'Load Order Details',
      config: {
        url: '={{ $env.API_URL }}/api/v1/orders/{{ $json.payload.orderId }}',
        method: 'GET',
        authentication: 'headerAuth',
        headerParameters: {
          parameters: [
            { name: 'X-Internal-Key', value: '={{ $env.INTERNAL_API_KEY }}' },
          ],
        },
      },
      next: 'check_order_status',
    },
    {
      id: 'check_order_status',
      type: 'if',
      name: 'Check Order Status',
      config: {
        conditions: {
          string: [
            {
              value1: '={{ $json.data.status }}',
              operation: 'equals',
              value2: 'paid',
            },
          ],
        },
      },
      next: {
        true: 'prepare_notification',
        false: 'skip_notification',
      },
    },
    {
      id: 'prepare_notification',
      type: 'function',
      name: 'Prepare Notification',
      config: {
        code: `
          const order = $input.first().json.data;
          const customer = order.shippingAddressSnapshot;
          
          return {
            orderId: order.orderNumber,
            customerEmail: customer.email,
            customerName: customer.firstName + ' ' + customer.lastName,
            totalAmount: order.grandTotal,
            currency: order.currency,
            items: order.items.length,
          };
        `,
      },
      next: 'send_email',
    },
    {
      id: 'send_email',
      type: 'emailSend',
      name: 'Send Confirmation Email',
      config: {
        fromEmail: '={{ $env.EMAIL_FROM }}',
        toEmail: '={{ $json.customerEmail }}',
        subject: 'Order Confirmed - #{{ $json.orderId }}',
        html: `
          <h1>Thank you for your order!</h1>
          <p>Hi {{ $json.customerName }},</p>
          <p>Your order #{{ $json.orderId }} has been confirmed and is being processed.</p>
          <p><strong>Total:</strong> {{ $json.currency }} {{ $json.totalAmount }}</p>
          <p><strong>Items:</strong> {{ $json.items }}</p>
          <p>We'll notify you when your order ships.</p>
          <p>Thank you for shopping with us!</p>
        `,
      },
      next: 'record_delivery',
    },
    {
      id: 'record_delivery',
      type: 'function',
      name: 'Record Delivery',
      config: {
        code: `
          // Mark event as processed
          await markEventProcessed($input.first().json.eventId);
          
          // Log delivery
          console.log('Order confirmation sent:', $input.first().json.orderId);
          
          return { success: true };
        `,
      },
    },
    {
      id: 'skip_notification',
      type: 'function',
      name: 'Skip Notification',
      config: {
        code: `
          console.log('Skipping notification - order not in paid state');
          return { skipped: true };
        `,
      },
    },
  ],
  errorHandling: {
    retries: 3,
    backoffMs: 5000,
    deadLetter: true,
    alertOnFailure: true,
  },
  idempotency: {
    keyField: 'eventId',
    deduplicationWindow: '24h',
  },
  security: {
    validateSignature: true,
    requiredPermissions: ['order.read'],
    sanitizePayload: true,
  },
};

// ============================================
// WORKFLOW B: Payment Reconciliation
// ============================================

export const paymentReconciliationWorkflow: N8nWorkflowDefinition = {
  id: 'wf_payment_reconciliation',
  name: 'Payment Reconciliation',
  description: 'Reconciles pending payments with payment provider',
  trigger: 'schedule',
  triggerConfig: {
    cron: '0 */6 * * *', // Every 6 hours
  },
  nodes: [
    {
      id: 'fetch_pending_payments',
      type: 'httpRequest',
      name: 'Fetch Pending Payments',
      config: {
        url: '={{ $env.API_URL }}/api/v1/admin/payments/pending',
        method: 'GET',
        authentication: 'headerAuth',
        headerParameters: {
          parameters: [
            { name: 'X-Internal-Key', value: '={{ $env.INTERNAL_API_KEY }}' },
          ],
        },
      },
      next: 'process_each_payment',
    },
    {
      id: 'process_each_payment',
      type: 'loopOverItems',
      name: 'Process Each Payment',
      config: {},
      next: 'verify_with_provider',
    },
    {
      id: 'verify_with_provider',
      type: 'httpRequest',
      name: 'Verify with Provider',
      config: {
        url: 'https://api.paystack.co/transaction/verify/{{ $json.providerReference }}',
        method: 'GET',
        authentication: 'headerAuth',
        headerParameters: {
          parameters: [
            { name: 'Authorization', value: 'Bearer {{ $env.PAYSTACK_SECRET_KEY }}' },
          ],
        },
      },
      next: 'compare_results',
    },
    {
      id: 'compare_results',
      type: 'function',
      name: 'Compare Results',
      config: {
        code: `
          const localPayment = $input.first().json;
          const providerPayment = $input.last().json.data;
          
          const discrepancies = [];
          
          // Compare reference
          if (localPayment.providerReference !== providerPayment.reference) {
            discrepancies.push('Reference mismatch');
          }
          
          // Compare amount (provider returns in kobo/pesewas)
          const providerAmount = providerPayment.amount / 100;
          if (Math.abs(parseFloat(localPayment.amount) - providerAmount) > 0.01) {
            discrepancies.push('Amount mismatch');
          }
          
          // Compare currency
          if (localPayment.currency !== providerPayment.currency) {
            discrepancies.push('Currency mismatch');
          }
          
          // Compare status
          const statusMap = {
            'success': 'succeeded',
            'failed': 'failed',
            'abandoned': 'cancelled',
          };
          
          const expectedStatus = statusMap[providerPayment.status];
          if (localPayment.status !== expectedStatus) {
            discrepancies.push('Status mismatch');
          }
          
          return {
            paymentId: localPayment.id,
            orderId: localPayment.orderId,
            discrepancies,
            providerStatus: providerPayment.status,
            localStatus: localPayment.status,
            needsUpdate: discrepancies.length > 0,
          };
        `,
      },
      next: 'apply_updates',
    },
    {
      id: 'apply_updates',
      type: 'if',
      name: 'Apply Updates',
      config: {
        conditions: {
          boolean: [
            {
              value1: '={{ $json.needsUpdate }}',
              operation: 'equals',
              value2: true,
            },
          ],
        },
      },
      next: {
        true: 'update_payment_status',
        false: 'log_no_changes',
      },
    },
    {
      id: 'update_payment_status',
      type: 'httpRequest',
      name: 'Update Payment Status',
      config: {
        url: '={{ $env.API_URL }}/api/v1/admin/payments/{{ $json.paymentId }}/reconcile',
        method: 'POST',
        authentication: 'headerAuth',
        headerParameters: {
          parameters: [
            { name: 'X-Internal-Key', value: '={{ $env.INTERNAL_API_KEY }}' },
          ],
        },
        body: {
          providerStatus: '={{ $json.providerStatus }}',
          discrepancies: '={{ $json.discrepancies }}',
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
          console.log('Payment reconciled:', $input.first().json.paymentId);
          return { success: true };
        `,
      },
    },
    {
      id: 'log_no_changes',
      type: 'function',
      name: 'Log No Changes',
      config: {
        code: `
          console.log('No changes needed for payment:', $input.first().json.paymentId);
          return { noChanges: true };
        `,
      },
    },
  ],
  errorHandling: {
    retries: 2,
    backoffMs: 10000,
    deadLetter: true,
    alertOnFailure: true,
  },
  idempotency: {
    keyField: 'paymentId',
    deduplicationWindow: '1h',
  },
  security: {
    validateSignature: false,
    requiredPermissions: ['payment.read', 'payment.update'],
    sanitizePayload: false,
  },
};

// ============================================
// WORKFLOW C: Low Stock Alert
// ============================================

export const lowStockAlertWorkflow: N8nWorkflowDefinition = {
  id: 'wf_low_stock_alert',
  name: 'Low Stock Alert',
  description: 'Alerts operators when inventory falls below threshold',
  trigger: 'schedule',
  triggerConfig: {
    cron: '0 */4 * * *', // Every 4 hours
  },
  nodes: [
    {
      id: 'fetch_low_stock',
      type: 'httpRequest',
      name: 'Fetch Low Stock Items',
      config: {
        url: '={{ $env.API_URL }}/api/v1/admin/inventory/low-stock?threshold=10',
        method: 'GET',
        authentication: 'headerAuth',
        headerParameters: {
          parameters: [
            { name: 'X-Internal-Key', value: '={{ $env.INTERNAL_API_KEY }}' },
          ],
        },
      },
      next: 'aggregate_alerts',
    },
    {
      id: 'aggregate_alerts',
      type: 'function',
      name: 'Aggregate Alerts',
      config: {
        code: `
          const items = $input.first().json.data;
          
          // Group by SKU to avoid duplicate alerts
          const grouped = {};
          items.forEach(item => {
            const key = item.sku;
            if (!grouped[key]) {
              grouped[key] = {
                sku: item.sku,
                productName: item.productName,
                locations: [],
                totalQuantity: 0,
                threshold: item.threshold || 10,
              };
            }
            grouped[key].locations.push({
              location: item.locationName,
              quantity: item.available,
            });
            grouped[key].totalQuantity += item.available;
          });
          
          return Object.values(grouped);
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
        text: '⚠️ Low Stock Alert',
        attachments: JSON.stringify([
          {
            color: '#ff9800',
            fields: [
              {
                title: 'Low Stock Items',
                value: '={{ $json.map(i => i.sku + " (" + i.totalQuantity + " left)").join(", ") }}',
                short: false,
              },
            ],
            actions: [
              {
                type: 'button',
                text: 'View Inventory',
                url: '={{ $env.ADMIN_URL }}/inventory',
              },
            ],
          },
        ]),
      },
    },
  ],
  errorHandling: {
    retries: 2,
    backoffMs: 5000,
    deadLetter: true,
    alertOnFailure: true,
  },
  idempotency: {
    keyField: 'timestamp',
    deduplicationWindow: '4h',
  },
  security: {
    validateSignature: false,
    requiredPermissions: ['inventory.read'],
    sanitizePayload: false,
  },
};

// ============================================
// WORKFLOW D: Abandoned Cart Reminder
// ============================================

export const abandonedCartWorkflow: N8nWorkflowDefinition = {
  id: 'wf_abandoned_cart',
  name: 'Abandoned Cart Reminder',
  description: 'Sends reminder emails for abandoned carts',
  trigger: 'schedule',
  triggerConfig: {
    cron: '0 */2 * * *', // Every 2 hours
  },
  nodes: [
    {
      id: 'fetch_abandoned_carts',
      type: 'httpRequest',
      name: 'Fetch Abandoned Carts',
      config: {
        url: '={{ $env.API_URL }}/api/v1/admin/carts/abandoned?hours=24&limit=100',
        method: 'GET',
        authentication: 'headerAuth',
        headerParameters: {
          parameters: [
            { name: 'X-Internal-Key', value: '={{ $env.INTERNAL_API_KEY }}' },
          ],
        },
      },
      next: 'filter_eligible',
    },
    {
      id: 'filter_eligible',
      type: 'function',
      name: 'Filter Eligible Carts',
      config: {
        code: `
          const carts = $input.first().json.data;
          
          // Filter out:
          // - Carts with paid orders
          // - Opted-out customers
          // - Carts under active checkout
          // - Already reminded (frequency cap)
          
          const eligible = carts.filter(cart => {
            // Check if customer opted out
            if (cart.customer?.marketingOptOut) return false;
            
            // Check if already reminded (max 2 reminders)
            if (cart.reminderCount >= 2) return false;
            
            // Check if cart is under active checkout
            if (cart.checkoutStartedAt) return false;
            
            return true;
          });
          
          return eligible;
        `,
      },
      next: 'send_reminders',
    },
    {
      id: 'send_reminders',
      type: 'loopOverItems',
      name: 'Send Reminders',
      config: {},
      next: 'send_email',
    },
    {
      id: 'send_email',
      type: 'emailSend',
      name: 'Send Reminder Email',
      config: {
        fromEmail: '={{ $env.EMAIL_FROM }}',
        toEmail: '={{ $json.customerEmail }}',
        subject: 'You left items in your cart!',
        html: `
          <h1>Still interested?</h1>
          <p>Hi {{ $json.customerName }},</p>
          <p>We noticed you left some items in your cart. They're still waiting for you!</p>
          <p><a href="{{ $env.STOREFRONT_URL }}/cart">Complete your purchase</a></p>
          <p>Items in your cart: {{ $json.itemCount }}</p>
          <p>Total: {{ $json.currency }} {{ $json.total }}</p>
        `,
      },
      next: 'record_reminder',
    },
    {
      id: 'record_reminder',
      type: 'httpRequest',
      name: 'Record Reminder',
      config: {
        url: '={{ $env.API_URL }}/api/v1/admin/carts/{{ $json.id }}/remind',
        method: 'POST',
        authentication: 'headerAuth',
        headerParameters: {
          parameters: [
            { name: 'X-Internal-Key', value: '={{ $env.INTERNAL_API_KEY }}' },
          ],
        },
      },
    },
  ],
  errorHandling: {
    retries: 2,
    backoffMs: 5000,
    deadLetter: true,
    alertOnFailure: false,
  },
  idempotency: {
    keyField: 'cartId',
    deduplicationWindow: '24h',
  },
  security: {
    validateSignature: false,
    requiredPermissions: ['cart.read', 'cart.update'],
    sanitizePayload: true, // Remove sensitive cart contents from previews
  },
};

// ============================================
// WORKFLOW E: Customer Support Triage
// ============================================

export const supportTriageWorkflow: N8nWorkflowDefinition = {
  id: 'wf_support_triage',
  name: 'Customer Support Triage',
  description: 'Classifies and routes customer support requests',
  trigger: 'webhook',
  triggerConfig: {
    path: '/webhook/support-request',
    method: 'POST',
  },
  nodes: [
    {
      id: 'sanitize_request',
      type: 'function',
      name: 'Sanitize Request',
      config: {
        code: `
          const request = $input.first().json;
          
          // Remove sensitive data before AI processing
          const sanitized = {
            requestId: request.requestId,
            customerId: request.customerId,
            message: request.message,
            // Remove: payment info, full address, etc.
          };
          
          return sanitized;
        `,
      },
      next: 'classify_topic',
    },
    {
      id: 'classify_topic',
      type: 'openAi',
      name: 'Classify Topic',
      config: {
        model: 'gpt-4',
        prompt: `
          Classify this customer support request into one of these categories:
          - order_status
          - refund_request
          - product_inquiry
          - shipping_issue
          - account_access
          - complaint
          - other
          
          Also determine urgency (low, medium, high) and draft a response.
          
          Request: {{ $json.message }}
        `,
      },
      next: 'route_request',
    },
    {
      id: 'route_request',
      type: 'switch',
      name: 'Route Request',
      config: {
        rules: [
          {
            value: '={{ $json.category }}',
            operation: 'equals',
            value2: 'refund_request',
            output: 0,
          },
          {
            value: '={{ $json.category }}',
            operation: 'equals',
            value2: 'complaint',
            output: 1,
          },
          {
            value: '={{ $json.urgency }}',
            operation: 'equals',
            value2: 'high',
            output: 2,
          },
        ],
        fallbackOutput: 3,
      },
      next: {
        0: 'human_review_refund',
        1: 'human_review_complaint',
        2: 'urgent_queue',
        3: 'auto_respond',
      },
    },
    {
      id: 'human_review_refund',
      type: 'function',
      name: 'Queue for Human Review (Refund)',
      config: {
        code: `
          // Queue for human review - refunds require approval
          await queueForReview({
            requestId: $input.first().json.requestId,
            category: 'refund',
            priority: 'high',
            draftResponse: $input.first().json.draftResponse,
          });
          
          return { queued: true };
        `,
      },
    },
    {
      id: 'human_review_complaint',
      type: 'function',
      name: 'Queue for Human Review (Complaint)',
      config: {
        code: `
          // Queue for human review - complaints require care
          await queueForReview({
            requestId: $input.first().json.requestId,
            category: 'complaint',
            priority: 'high',
            draftResponse: $input.first().json.draftResponse,
          });
          
          return { queued: true };
        `,
      },
    },
    {
      id: 'urgent_queue',
      type: 'function',
      name: 'Add to Urgent Queue',
      config: {
        code: `
          await addToUrgentQueue($input.first().json);
          return { urgent: true };
        `,
      },
    },
    {
      id: 'auto_respond',
      type: 'emailSend',
      name: 'Send Auto Response',
      config: {
        fromEmail: '={{ $env.SUPPORT_EMAIL }}',
        toEmail: '={{ $json.customerEmail }}',
        subject: 'Re: Your support request',
        html: '={{ $json.draftResponse }}',
      },
    },
  ],
  errorHandling: {
    retries: 2,
    backoffMs: 5000,
    deadLetter: true,
    alertOnFailure: true,
  },
  idempotency: {
    keyField: 'requestId',
    deduplicationWindow: '24h',
  },
  security: {
    validateSignature: true,
    requiredPermissions: ['support.read', 'support.write'],
    sanitizePayload: true, // Remove sensitive data before AI
  },
};

// ============================================
// WORKFLOW F: Daily Operations Summary
// ============================================

export const dailyOperationsWorkflow: N8nWorkflowDefinition = {
  id: 'wf_daily_operations',
  name: 'Daily Operations Summary',
  description: 'Generates daily summary of operations',
  trigger: 'schedule',
  triggerConfig: {
    cron: '0 8 * * *', // Daily at 8 AM
  },
  nodes: [
    {
      id: 'fetch_metrics',
      type: 'httpRequest',
      name: 'Fetch Metrics',
      config: {
        url: '={{ $env.API_URL }}/api/v1/admin/metrics/daily',
        method: 'GET',
        authentication: 'headerAuth',
        headerParameters: {
          parameters: [
            { name: 'X-Internal-Key', value: '={{ $env.INTERNAL_API_KEY }}' },
          ],
        },
      },
      next: 'summarize_data',
    },
    {
      id: 'summarize_data',
      type: 'function',
      name: 'Summarize Data',
      config: {
        code: `
          const metrics = $input.first().json.data;
          
          const summary = {
            date: new Date().toISOString().split('T')[0],
            orders: {
              total: metrics.orders.total,
              paid: metrics.orders.paid,
              pending: metrics.orders.pending,
              cancelled: metrics.orders.cancelled,
            },
            revenue: {
              total: metrics.revenue.total,
              currency: metrics.revenue.currency,
            },
            paymentFailures: metrics.paymentFailures.count,
            lowStockItems: metrics.lowStock.count,
            fulfillmentBacklog: metrics.fulfillment.backlog,
            refunds: {
              count: metrics.refunds.count,
              total: metrics.refunds.total,
            },
            workflowFailures: metrics.workflows.failed,
          };
          
          return summary;
        `,
      },
      next: 'generate_commentary',
    },
    {
      id: 'generate_commentary',
      type: 'openAi',
      name: 'Generate Commentary',
      config: {
        model: 'gpt-4',
        prompt: `
          Generate a brief operational summary based on these metrics.
          Clearly separate actual data from your commentary.
          Highlight any concerns or areas needing attention.
          
          Metrics: {{ JSON.stringify($json) }}
        `,
      },
      next: 'send_summary',
    },
    {
      id: 'send_summary',
      type: 'slack',
      name: 'Send Summary',
      config: {
        channel: '#operations-daily',
        text: '📊 Daily Operations Summary',
        attachments: JSON.stringify([
          {
            color: '#3b82f6',
            fields: [
              {
                title: 'Orders',
                value: 'Total: {{ $json.data.orders.total }} | Paid: {{ $json.data.orders.paid }} | Pending: {{ $json.data.orders.pending }}',
                short: true,
              },
              {
                title: 'Revenue',
                value: '{{ $json.data.revenue.currency }} {{ $json.data.revenue.total }}',
                short: true,
              },
              {
                title: 'Concerns',
                value: 'Payment Failures: {{ $json.data.paymentFailures }} | Low Stock: {{ $json.data.lowStockItems }} | Workflow Failures: {{ $json.data.workflowFailures }}',
                short: false,
              },
              {
                title: 'AI Commentary',
                value: '{{ $json.commentary }}',
                short: false,
              },
            ],
          },
        ]),
      },
    },
  ],
  errorHandling: {
    retries: 2,
    backoffMs: 10000,
    deadLetter: true,
    alertOnFailure: true,
  },
  idempotency: {
    keyField: 'date',
    deduplicationWindow: '24h',
  },
  security: {
    validateSignature: false,
    requiredPermissions: ['metrics.read'],
    sanitizePayload: false,
  },
};

// ============================================
// EXPORT ALL WORKFLOWS
// ============================================

export const allWorkflows: N8nWorkflowDefinition[] = [
  orderConfirmationWorkflow,
  paymentReconciliationWorkflow,
  lowStockAlertWorkflow,
  abandonedCartWorkflow,
  supportTriageWorkflow,
  dailyOperationsWorkflow,
];

/**
 * Get workflow by ID
 */
export function getWorkflow(id: string): N8nWorkflowDefinition | undefined {
  return allWorkflows.find(w => w.id === id);
}

/**
 * Get workflows by trigger type
 */
export function getWorkflowsByTrigger(trigger: 'webhook' | 'schedule'): N8nWorkflowDefinition[] {
  return allWorkflows.filter(w => w.trigger === trigger);
}
