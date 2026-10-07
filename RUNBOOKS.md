# ivo Electronics - Operations Runbooks

> **Purpose:** Step-by-step procedures for handling incidents and common operational issues  
> **Audience:** On-call engineers, operations team, support team  
> **Last Updated:** 2024-01-15

---

## Table of Contents

1. [Payment Provider Outage](#1-payment-provider-outage)
2. [Webhook Verification Failure](#2-webhook-verification-failure)
3. [Reconciliation Discrepancy](#3-reconciliation-discrepancy)
4. [Database Connection Exhaustion](#4-database-connection-exhaustion)
5. [Failed Migration](#5-failed-migration)
6. [Accidental Secret Exposure](#6-accidental-secret-exposure)
7. [Suspicious Account/Admin Activity](#7-suspicious-accountadmin-activity)
8. [Failed Refund](#8-failed-refund)
9. [n8n Workflow Backlog](#9-n8n-workflow-backlog)
10. [Data Restoration and Disaster Recovery](#10-data-restoration-and-disaster-recovery)

---

## 1. Payment Provider Outage

### Severity: P0 - Critical

### Symptoms
- Payment initiation failures increasing
- Webhook events not being received
- Orders stuck in `pending_payment` state
- Alert: `payment_provider_health_check` failing

### Impact
- Customers cannot complete purchases
- Revenue loss
- Customer frustration

### Immediate Actions (0-15 minutes)

1. **Confirm the outage**
   ```bash
   # Check Paystack status page
   curl https://status.paystack.com
   
   # Check our payment health endpoint
   curl https://api.ivo.example.com/api/v1/health/payments
   ```

2. **Assess scope**
   ```sql
   -- Check pending payments in last hour
   SELECT COUNT(*), MIN(created_at), MAX(created_at)
   FROM payment_attempts
   WHERE status = 'pending'
   AND created_at > NOW() - INTERVAL '1 hour';
   ```

3. **Communicate internally**
   - Notify #incidents Slack channel
   - Alert engineering lead
   - Update status page if customer-facing

4. **Enable maintenance mode (if needed)**
   ```bash
   # Set feature flag to disable payments
   curl -X POST https://api.ivo.example.com/api/v1/admin/feature-flags/payment.enabled \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"enabled": false}'
   ```

### Short-term Actions (15-60 minutes)

5. **Monitor provider status**
   - Check Paystack status page regularly
   - Monitor webhook delivery queue
   - Track pending payment count

6. **Manual payment processing (if extended outage)**
   ```sql
   -- Get list of affected orders
   SELECT o.id, o.order_number, o.grand_total, o.currency
   FROM orders o
   JOIN payment_attempts pa ON pa.order_id = o.id
   WHERE pa.status = 'pending'
   AND pa.created_at > NOW() - INTERVAL '2 hours';
   ```

7. **Customer communication**
   ```
   Subject: Temporary Payment Issues
   
   We're experiencing temporary issues with our payment provider.
   Your order has been received and we're working to process it.
   We'll notify you once payment is confirmed.
   
   Order: {order_number}
   ```

### Resolution

8. **Verify provider recovery**
   ```bash
   # Test payment initiation
   curl -X POST https://api.ivo.example.com/api/v1/payments/test \
     -H "Authorization: Bearer $TEST_TOKEN"
   ```

9. **Process backlog**
   ```bash
   # Trigger reconciliation job
   curl -X POST https://api.ivo.example.com/api/v1/admin/payments/reconcile \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

10. **Monitor closely**
    - Watch for webhook delivery
    - Verify order status updates
    - Check for duplicate processing

### Post-Incident

11. **Document timeline**
    - Outage start time
    - Detection time
    - Resolution time
    - Customer impact

12. **Root cause analysis**
    - Provider issue or our integration?
    - Were alerts timely?
    - Was communication effective?

13. **Update runbook**
    - Add any new steps discovered
    - Update contact information
    - Refine escalation paths

---

## 2. Webhook Verification Failure

### Severity: P1 - High

### Symptoms
- Webhook events failing signature verification
- Orders not updating after payment
- Alert: `webhook_verification_failures` increasing

### Impact
- Payment status not updating
- Orders stuck in incorrect state
- Potential duplicate processing

### Immediate Actions (0-15 minutes)

1. **Check webhook logs**
   ```bash
   # View recent webhook failures
   kubectl logs -l app=ivo-api --tail=100 | grep "webhook.*verification"
   ```

2. **Verify webhook secret**
   ```bash
   # Check if secret matches Paystack dashboard
   echo $PAYSTACK_WEBHOOK_SECRET | base64
   ```

3. **Check for secret rotation**
   - Login to Paystack dashboard
   - Check if webhook secret was recently changed
   - Verify our environment variable matches

### Investigation (15-60 minutes)

4. **Analyze failed webhooks**
   ```sql
   -- Get recent webhook failures
   SELECT id, event_type, received_at, error_message
   FROM webhook_events
   WHERE signature_valid = false
   AND received_at > NOW() - INTERVAL '1 hour'
   ORDER BY received_at DESC
   LIMIT 20;
   ```

5. **Check for replay attacks**
   ```sql
   -- Look for duplicate event IDs
   SELECT external_event_id, COUNT(*)
   FROM webhook_events
   WHERE received_at > NOW() - INTERVAL '1 hour'
   GROUP BY external_event_id
   HAVING COUNT(*) > 1;
   ```

6. **Verify payload integrity**
   ```bash
   # Get a sample failed webhook
   curl https://api.ivo.example.com/api/v1/admin/webhooks/failed \
     -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.[0]'
   ```

### Resolution

7. **Update webhook secret (if rotated)**
   ```bash
   # Update environment variable
   kubectl set env deployment/ivo-api \
     PAYSTACK_WEBHOOK_SECRET=new_secret_value
   
   # Restart pods
   kubectl rollout restart deployment/ivo-api
   ```

8. **Reprocess failed webhooks**
   ```bash
   # Trigger webhook reprocessing
   curl -X POST https://api.ivo.example.com/api/v1/admin/webhooks/reprocess \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"since": "2024-01-15T10:00:00Z"}'
   ```

9. **Verify order updates**
   ```sql
   -- Check if orders are now updating
   SELECT o.id, o.status, o.updated_at
   FROM orders o
   WHERE o.updated_at > NOW() - INTERVAL '30 minutes'
   ORDER BY o.updated_at DESC
   LIMIT 10;
   ```

### Post-Incident

10. **Document root cause**
    - Secret rotation without notification?
    - Replay attack attempt?
    - Configuration drift?

11. **Update monitoring**
    - Add alert for webhook secret age
    - Monitor verification failure rate
    - Track reprocessing success rate

---

## 3. Reconciliation Discrepancy

### Severity: P1 - High

### Symptoms
- Reconciliation job reporting discrepancies
- Payment amounts not matching
- Alert: `reconciliation_discrepancies` > 0

### Impact
- Financial reporting inaccuracies
- Potential revenue loss or overcharging
- Compliance risk

### Immediate Actions (0-15 minutes)

1. **Get discrepancy report**
   ```bash
   curl https://api.ivo.example.com/api/v1/admin/reconciliation/discrepancies \
     -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
   ```

2. **Assess scope**
   ```sql
   -- Count discrepancies by type
   SELECT discrepancy_type, COUNT(*), SUM(amount_difference)
   FROM reconciliation_discrepancies
   WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY discrepancy_type;
   ```

3. **Pause automated processing (if needed)**
   ```bash
   # Disable auto-reconciliation
   curl -X POST https://api.ivo.example.com/api/v1/admin/reconciliation/pause \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

### Investigation (15-60 minutes)

4. **Analyze discrepancy patterns**
   ```sql
   -- Get detailed discrepancy data
   SELECT 
     rd.id,
     rd.order_id,
     rd.payment_id,
     rd.local_amount,
     rd.provider_amount,
     rd.amount_difference,
     rd.discrepancy_type,
     rd.created_at
   FROM reconciliation_discrepancies rd
   WHERE rd.created_at > NOW() - INTERVAL '24 hours'
   ORDER BY ABS(rd.amount_difference) DESC
   LIMIT 50;
   ```

5. **Check specific cases**
   ```sql
   -- Get full order and payment details
   SELECT 
     o.order_number,
     o.grand_total as order_total,
     pa.amount as payment_amount,
     pa.status as payment_status,
     pa.provider_reference
   FROM orders o
   JOIN payment_attempts pa ON pa.order_id = o.id
   WHERE o.id IN (
     SELECT order_id FROM reconciliation_discrepancies
     WHERE created_at > NOW() - INTERVAL '24 hours'
   );
   ```

6. **Verify with provider**
   ```bash
   # Check payment status with Paystack
   curl https://api.paystack.co/transaction/verify/{reference} \
     -H "Authorization: Bearer $PAYSTACK_SECRET_KEY"
   ```

### Resolution

7. **Categorize discrepancies**
   - **Timing differences**: Payment completed but webhook delayed
   - **Amount mismatches**: Currency conversion or fee differences
   - **Status mismatches**: Local says pending, provider says success
   - **Missing records**: Payment exists at provider but not locally

8. **Resolve each category**
   ```sql
   -- For timing differences: wait for webhook
   -- For amount mismatches: adjust local records
   UPDATE payment_attempts
   SET amount = provider_amount,
       reconciled_at = NOW()
   WHERE id = {payment_id};
   
   -- For status mismatches: update local status
   UPDATE payment_attempts
   SET status = 'succeeded',
       reconciled_at = NOW()
   WHERE id = {payment_id};
   ```

9. **Mark discrepancies as resolved**
   ```sql
   UPDATE reconciliation_discrepancies
   SET resolution = 'adjusted_local_record',
       resolved_at = NOW(),
       resolved_by = 'admin_user_id'
   WHERE id = {discrepancy_id};
   ```

### Post-Incident

10. **Root cause analysis**
    - Currency conversion issues?
    - Fee calculation differences?
    - Webhook delivery delays?
    - Race conditions?

11. **Update reconciliation logic**
    - Add tolerance for small differences
    - Improve timing window
    - Better error categorization

12. **Financial reporting**
    - Update accounting records
    - Notify finance team
    - Adjust revenue recognition if needed

---

## 4. Database Connection Exhaustion

### Severity: P0 - Critical

### Symptoms
- Application errors: "Too many clients" or "Connection pool exhausted"
- Slow query responses
- Alert: `db_connection_errors` increasing
- Health check failing

### Impact
- Application unavailable
- All operations failing
- Complete service outage

### Immediate Actions (0-5 minutes)

1. **Check connection count**
   ```sql
   -- Connect via admin connection
   SELECT count(*) FROM pg_stat_activity;
   SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
   ```

2. **Identify long-running queries**
   ```sql
   SELECT 
     pid,
     now() - pg_stat_activity.query_start AS duration,
     query,
     state
   FROM pg_stat_activity
   WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
   AND state != 'idle'
   ORDER BY duration DESC;
   ```

3. **Terminate problematic connections**
   ```sql
   -- Terminate long-running queries
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE (now() - query_start) > interval '30 minutes'
   AND state != 'idle';
   ```

### Short-term Actions (5-15 minutes)

4. **Check Neon dashboard**
   - View connection count
   - Check for connection spikes
   - Review active queries

5. **Scale connection pool (if needed)**
   ```bash
   # Increase pool size temporarily
   kubectl set env deployment/ivo-api \
     DATABASE_POOL_SIZE=30
   
   kubectl rollout restart deployment/ivo-api
   ```

6. **Enable query timeouts**
   ```sql
   -- Set statement timeout
   ALTER SYSTEM SET statement_timeout = '30s';
   SELECT pg_reload_conf();
   ```

### Investigation (15-60 minutes)

7. **Analyze connection patterns**
   ```sql
   -- Check connection sources
   SELECT 
     application_name,
     count(*) as connection_count,
     state
   FROM pg_stat_activity
   GROUP BY application_name, state
   ORDER BY connection_count DESC;
   ```

8. **Check for connection leaks**
   ```bash
   # Look for unclosed connections in logs
   kubectl logs -l app=ivo-api --tail=1000 | grep -i "connection"
   ```

9. **Review recent deployments**
   ```bash
   # Check if recent deploy caused issue
   kubectl rollout history deployment/ivo-api
   ```

### Resolution

10. **Fix connection leaks**
    - Review code for unclosed connections
    - Ensure proper connection pooling
    - Add connection timeout handling

11. **Optimize queries**
    ```sql
    -- Find slow queries
    SELECT 
      query,
      calls,
      total_time,
      mean_time
    FROM pg_stat_statements
    ORDER BY mean_time DESC
    LIMIT 10;
    ```

12. **Adjust pool configuration**
    ```bash
    # Set appropriate pool size
    kubectl set env deployment/ivo-api \
      DATABASE_POOL_SIZE=20 \
      DATABASE_POOL_IDLE_TIMEOUT=30000 \
      DATABASE_POOL_CONNECTION_TIMEOUT=10000
    ```

### Post-Incident

13. **Add monitoring**
    - Connection count alerts
    - Query duration alerts
    - Pool utilization metrics

14. **Update capacity planning**
    - Review connection limits
    - Plan for growth
    - Consider read replicas

---

## 5. Failed Migration

### Severity: P1 - High

### Symptoms
- Migration job failing
- Application unable to start
- Database schema mismatch
- Alert: `migration_failed`

### Impact
- Application unavailable
- Cannot deploy new features
- Potential data inconsistency

### Immediate Actions (0-15 minutes)

1. **Check migration status**
   ```bash
   # View migration logs
   kubectl logs job/ivo-migration --tail=100
   ```

2. **Check database state**
   ```sql
   -- Check current migration version
   SELECT * FROM _drizzle_migrations ORDER BY created_at DESC LIMIT 5;
   ```

3. **Assess rollback need**
   ```bash
   # Check if we need to rollback
   kubectl logs job/ivo-migration | grep -i "error"
   ```

### Investigation (15-60 minutes)

4. **Identify failure cause**
   - Schema conflict?
   - Data validation error?
   - Timeout?
   - Permission issue?

5. **Check migration file**
   ```bash
   # View the failing migration
   cat server/drizzle/migrations/{migration_name}.sql
   ```

6. **Test locally**
   ```bash
   # Run migration locally
   cd server
   npm run db:migrate
   ```

### Resolution

7. **Fix migration (if possible)**
   ```sql
   -- Edit migration file to fix issue
   -- Then re-run
   npm run db:migrate
   ```

8. **Rollback if needed**
   ```bash
   # Rollback to previous version
   npm run db:rollback
   
   # Or restore from backup
   psql $DATABASE_URL < backup.sql
   ```

9. **Manual intervention (if needed)**
   ```sql
   -- Manually apply schema changes
   -- Then mark migration as complete
   INSERT INTO _drizzle_migrations (hash, created_at)
   VALUES ('{migration_hash}', NOW());
   ```

### Post-Incident

10. **Update migration process**
    - Add pre-deployment checks
    - Test migrations on staging
    - Add rollback procedures

11. **Document lessons learned**
    - What caused the failure?
    - How to prevent in future?
    - Update migration guidelines

---

## 6. Accidental Secret Exposure

### Severity: P0 - Critical

### Symptoms
- Secret found in logs, code, or client bundle
- Alert from secret scanning tool
- Security team notification

### Impact
- Potential unauthorized access
- Data breach risk
- Compliance violation

### Immediate Actions (0-5 minutes)

1. **Identify exposed secret**
   ```bash
   # Check where secret was exposed
   grep -r "sk_test_" . --include="*.js" --include="*.ts" --include="*.log"
   ```

2. **Revoke the secret immediately**
   - Paystack: Dashboard → Settings → API Keys → Revoke
   - Neon: Dashboard → Settings → Connection String → Regenerate
   - JWT: Generate new secret

3. **Remove from source**
   ```bash
   # Remove from code
   git revert {commit_hash}
   
   # Or remove from logs
   # (Logs should be rotated/deleted)
   ```

### Short-term Actions (5-30 minutes)

4. **Rotate all related secrets**
   ```bash
   # Update environment variables
   kubectl set env deployment/ivo-api \
     PAYSTACK_SECRET_KEY=new_key \
     NEON_DATABASE_URL=new_url \
     JWT_SECRET=new_secret
   
   kubectl rollout restart deployment/ivo-api
   ```

5. **Check for unauthorized access**
   ```sql
   -- Check for suspicious activity
   SELECT * FROM audit_log
   WHERE created_at > NOW() - INTERVAL '24 hours'
   AND action LIKE '%admin%'
   ORDER BY created_at DESC;
   ```

6. **Notify stakeholders**
   - Security team
   - Engineering lead
   - Legal (if customer data at risk)

### Investigation (30-60 minutes)

7. **Determine exposure scope**
   - How long was secret exposed?
   - Who had access?
   - Was it used maliciously?

8. **Check for data breach**
   ```sql
   -- Check for unusual data access
   SELECT * FROM audit_log
   WHERE created_at > '{exposure_start_time}'
   AND entity_type IN ('user', 'order', 'payment')
   ORDER BY created_at DESC;
   ```

### Resolution

9. **Update all references**
   - CI/CD pipelines
   - Development environments
   - Documentation
   - Team communications

10. **Verify fix**
    ```bash
    # Run secret scan
    npm run secret-scan
    
    # Check bundle
    npm run build
    # Verify no secrets in dist/
    ```

### Post-Incident

11. **Root cause analysis**
    - How was secret exposed?
    - Why wasn't it caught earlier?
    - What controls failed?

12. **Improve prevention**
    - Add pre-commit hooks
    - Enhance CI secret scanning
    - Improve developer training

13. **Legal/compliance review**
    - Notify affected parties if needed
    - Document incident
    - Update security policies

---

## 7. Suspicious Account/Admin Activity

### Severity: P1 - High

### Symptoms
- Unusual login patterns
- Unauthorized permission changes
- Bulk data access
- Alert from security monitoring

### Impact
- Potential data breach
- Unauthorized changes
- Compliance risk

### Immediate Actions (0-15 minutes)

1. **Identify suspicious activity**
   ```sql
   -- Check recent admin actions
   SELECT * FROM admin_audit_log
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC
   LIMIT 50;
   ```

2. **Suspend suspicious accounts**
   ```sql
   -- Suspend user account
   UPDATE users
   SET status = 'suspended',
       updated_at = NOW()
   WHERE id = '{user_id}';
   ```

3. **Revoke active sessions**
   ```sql
   -- Invalidate all sessions for user
   DELETE FROM user_sessions
   WHERE user_id = '{user_id}';
   ```

### Investigation (15-60 minutes)

4. **Analyze activity pattern**
   ```sql
   -- Get full activity log
   SELECT 
     action,
     entity_type,
     entity_id,
     ip_address,
     user_agent,
     created_at
   FROM admin_audit_log
   WHERE actor_id = '{user_id}'
   AND created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```

5. **Check for data exfiltration**
   ```sql
   -- Check for bulk reads
   SELECT 
     action,
     COUNT(*) as count
   FROM admin_audit_log
   WHERE actor_id = '{user_id}'
   AND action LIKE '%read%'
   AND created_at > NOW() - INTERVAL '24 hours'
   GROUP BY action;
   ```

6. **Verify IP addresses**
   - Check if IPs are known/expected
   - Look for geographic anomalies
   - Check for VPN/proxy usage

### Resolution

7. **Reset credentials**
   ```bash
   # Force password reset
   # (User will need to reset on next login)
   ```

8. **Review and restore changes**
   ```sql
   -- Check what was changed
   SELECT * FROM admin_audit_log
   WHERE actor_id = '{user_id}'
   AND action IN ('update', 'delete', 'create')
   AND created_at > NOW() - INTERVAL '24 hours';
   
   -- Restore if needed
   ```

9. **Enhance monitoring**
   ```bash
   # Add user to watchlist
   # Increase logging for this user
   ```

### Post-Incident

10. **Determine root cause**
    - Compromised credentials?
    - Insider threat?
    - Misconfigured permissions?

11. **Update security controls**
    - Implement MFA if not already
    - Review permission model
    - Add anomaly detection

12. **Legal/compliance review**
    - Document incident
    - Notify if required
    - Update policies

---

## 8. Failed Refund

### Severity: P1 - High

### Symptoms
- Refund request failing
- Customer complaint
- Alert: `refund_failures` increasing

### Impact
- Customer dissatisfaction
- Financial discrepancy
- Support ticket volume

### Immediate Actions (0-15 minutes)

1. **Identify failed refunds**
   ```sql
   SELECT 
     r.id,
     r.order_id,
     r.amount,
     r.status,
     r.error_message,
     r.created_at
   FROM refunds r
   WHERE r.status = 'failed'
   AND r.created_at > NOW() - INTERVAL '24 hours'
   ORDER BY r.created_at DESC;
   ```

2. **Check error details**
   ```sql
   SELECT 
     r.id,
     r.error_message,
     pa.provider_reference,
     pa.status as payment_status
   FROM refunds r
   JOIN payment_attempts pa ON pa.id = r.payment_attempt_id
   WHERE r.status = 'failed'
   AND r.created_at > NOW() - INTERVAL '24 hours';
   ```

### Investigation (15-60 minutes)

3. **Verify with payment provider**
   ```bash
   # Check refund status with Paystack
   curl https://api.paystack.co/refund \
     -H "Authorization: Bearer $PAYSTACK_SECRET_KEY" \
     -d '{"reference": "{payment_reference}"}'
   ```

4. **Check common failure reasons**
   - Insufficient funds in merchant account
   - Payment already refunded
   - Payment method doesn't support refunds
   - Refund window expired
   - Provider API error

### Resolution

5. **Retry refund (if appropriate)**
   ```bash
   # Trigger refund retry
   curl -X POST https://api.ivo.example.com/api/v1/admin/refunds/{refund_id}/retry \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

6. **Manual refund (if needed)**
   ```bash
   # Process refund manually via provider dashboard
   # Then update local record
   ```

7. **Update refund status**
   ```sql
   UPDATE refunds
   SET status = 'succeeded',
       provider_reference = '{provider_ref}',
       updated_at = NOW()
   WHERE id = '{refund_id}';
   ```

8. **Notify customer**
   ```
   Subject: Refund Processed
   
   Your refund for order {order_number} has been processed.
   Amount: {currency} {amount}
   Reference: {refund_reference}
   
   Please allow 5-10 business days for the refund to appear.
   ```

### Post-Incident

9. **Analyze failure patterns**
   - Common error types?
   - Specific payment methods?
   - Time-based patterns?

10. **Improve refund process**
    - Better error messages
    - Automatic retry logic
    - Proactive monitoring

---

## 9. n8n Workflow Backlog

### Severity: P2 - Medium

### Symptoms
- Workflow execution queue growing
- Delayed notifications
- Alert: `n8n_workflow_backlog` > threshold

### Impact
- Delayed customer communications
- Stale data
- Poor user experience

### Immediate Actions (0-15 minutes)

1. **Check backlog size**
   ```sql
   SELECT 
     event_type,
     state,
     COUNT(*) as count,
     MIN(created_at) as oldest
   FROM outbox_events
   WHERE state = 'pending'
   GROUP BY event_type, state
   ORDER BY count DESC;
   ```

2. **Check n8n status**
   ```bash
   # Check n8n health
   curl https://n8n.ivo.example.com/healthz
   ```

3. **Identify bottleneck**
   - n8n instance overloaded?
   - Webhook endpoint slow?
   - Database queries slow?

### Short-term Actions (15-60 minutes)

4. **Scale n8n (if needed)**
   ```bash
   # Increase n8n replicas
   kubectl scale deployment/n8n --replicas=3
   ```

5. **Process backlog manually**
   ```bash
   # Trigger batch processing
   curl -X POST https://api.ivo.example.com/api/v1/admin/outbox/process \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -d '{"batchSize": 100}'
   ```

6. **Prioritize critical events**
   ```sql
   -- Process order confirmations first
   SELECT * FROM outbox_events
   WHERE event_type = 'order.paid'
   AND state = 'pending'
   ORDER BY created_at ASC
   LIMIT 50;
   ```

### Resolution

7. **Clear backlog**
   ```bash
   # Process all pending events
   while true; do
     curl -X POST https://api.ivo.example.com/api/v1/admin/outbox/process \
       -H "Authorization: Bearer $ADMIN_TOKEN" \
       -d '{"batchSize": 100}'
     
     # Check if backlog cleared
     count=$(curl -s https://api.ivo.example.com/api/v1/admin/outbox/stats | jq '.pending')
     if [ "$count" -lt "10" ]; then
       break
     fi
     sleep 5
   done
   ```

8. **Monitor recovery**
   ```sql
   -- Watch backlog decreasing
   SELECT COUNT(*) FROM outbox_events WHERE state = 'pending';
   ```

### Post-Incident

9. **Root cause analysis**
   - Why did backlog build up?
   - Was n8n down?
   - Were workflows too slow?

10. **Improve resilience**
    - Add auto-scaling
    - Implement circuit breakers
    - Better monitoring

---

## 10. Data Restoration and Disaster Recovery

### Severity: P0 - Critical

### Symptoms
- Data loss detected
- Database corruption
- Complete service outage
- Ransomware attack

### Impact
- Data loss
- Extended downtime
- Business continuity risk

### Immediate Actions (0-15 minutes)

1. **Assess damage**
   ```sql
   -- Check database integrity
   SELECT COUNT(*) FROM orders;
   SELECT COUNT(*) FROM payments;
   ```

2. **Stop all writes**
   ```bash
   # Enable maintenance mode
   kubectl set env deployment/ivo-api MAINTENANCE_MODE=true
   kubectl rollout restart deployment/ivo-api
   ```

3. **Identify recovery point**
   ```bash
   # Check available backups
   neonctl backups list --project-id {project_id}
   ```

### Recovery Process (15-60 minutes)

4. **Restore from backup**
   ```bash
   # Restore to point-in-time
   neonctl branches restore --project-id {project_id} \
     --backup-id {backup_id} \
     --branch-name recovery
   ```

5. **Verify restored data**
   ```sql
   -- Check data integrity
   SELECT 
     (SELECT COUNT(*) FROM orders) as orders_count,
     (SELECT COUNT(*) FROM payments) as payments_count,
     (SELECT MAX(created_at) FROM orders) as latest_order;
   ```

6. **Switch to restored database**
   ```bash
   # Update connection string
   kubectl set env deployment/ivo-api \
     DATABASE_URL={restored_branch_url}
   
   kubectl rollout restart deployment/ivo-api
   ```

### Post-Recovery (1-24 hours)

7. **Verify application functionality**
   ```bash
   # Run smoke tests
   npm run test:e2e
   
   # Check critical paths
   curl https://api.ivo.example.com/api/v1/health
   ```

8. **Reconcile data**
   ```sql
   -- Check for data gaps
   SELECT DATE(created_at), COUNT(*)
   FROM orders
   WHERE created_at > '{recovery_point}'
   GROUP BY DATE(created_at)
   ORDER BY DATE(created_at);
   ```

9. **Communicate with stakeholders**
   - Update status page
   - Notify customers if needed
   - Brief leadership

### Post-Incident

10. **Root cause analysis**
    - What caused data loss?
    - How to prevent recurrence?
    - Were backups adequate?

11. **Update DR plan**
    - Test restore procedures regularly
    - Document lessons learned
    - Improve backup strategy

12. **Compliance review**
    - Document incident
    - Notify if required
    - Update policies

---

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| Engineering Lead | {name} | {phone/email} |
| On-Call Engineer | {rotation} | {pagerduty} |
| Database Admin | {name} | {phone/email} |
| Security Team | {team} | {slack/email} |
| Paystack Support | - | support@paystack.com |
| Neon Support | - | support@neon.tech |

---

## Escalation Matrix

| Severity | Response Time | Escalation |
|----------|---------------|------------|
| P0 - Critical | 5 minutes | Engineering Lead → CTO |
| P1 - High | 15 minutes | On-Call → Engineering Lead |
| P2 - Medium | 1 hour | On-Call Engineer |
| P3 - Low | 4 hours | Next business day |

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-01-15 | 1.0 | Initial version | Engineering Team |

---

**Remember:** When in doubt, escalate. It's better to over-communicate than to under-respond during an incident.
