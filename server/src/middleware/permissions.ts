import { Context, Next } from 'hono';
import { db } from '../db';
import { users, roles, permissions, userRoles, rolePermissions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

/**
 * Enhanced Role-Based Access Control (RBAC) System
 * 
 * Roles:
 * - customer: Can browse, add to cart, checkout, view own orders
 * - support: Can view orders, customers, issue refunds (limited)
 * - catalog_manager: Can manage products, categories, inventory
 * - fulfillment_operator: Can update order status, manage shipments
 * - finance_operator: Can view payments, issue refunds, reconciliation
 * - super_admin: Full access to everything
 */

// Permission constants
export const PERMISSIONS = {
  // Customer permissions
  CUSTOMER_BROWSE: 'customer.browse',
  CUSTOMER_CART: 'customer.cart',
  CUSTOMER_CHECKOUT: 'customer.checkout',
  CUSTOMER_ORDERS_VIEW: 'customer.orders.view',
  CUSTOMER_PROFILE: 'customer.profile',
  
  // Support permissions
  SUPPORT_ORDERS_VIEW: 'support.orders.view',
  SUPPORT_ORDERS_UPDATE: 'support.orders.update',
  SUPPORT_CUSTOMERS_VIEW: 'support.customers.view',
  SUPPORT_REFUND_ISSUE: 'support.refund.issue',
  SUPPORT_REFUND_APPROVE: 'support.refund.approve',
  
  // Catalog manager permissions
  CATALOG_PRODUCTS_CREATE: 'catalog.products.create',
  CATALOG_PRODUCTS_READ: 'catalog.products.read',
  CATALOG_PRODUCTS_UPDATE: 'catalog.products.update',
  CATALOG_PRODUCTS_DELETE: 'catalog.products.delete',
  CATALOG_CATEGORIES_MANAGE: 'catalog.categories.manage',
  CATALOG_INVENTORY_VIEW: 'catalog.inventory.view',
  CATALOG_INVENTORY_ADJUST: 'catalog.inventory.adjust',
  CATALOG_PROMOTIONS_MANAGE: 'catalog.promotions.manage',
  
  // Fulfillment operator permissions
  FULFILLMENT_ORDERS_VIEW: 'fulfillment.orders.view',
  FULFILLMENT_ORDERS_UPDATE: 'fulfillment.orders.update',
  FULFILLMENT_SHIPMENTS_MANAGE: 'fulfillment.shipments.manage',
  FULFILLMENT_STATUS_UPDATE: 'fulfillment.status.update',
  
  // Finance operator permissions
  FINANCE_PAYMENTS_VIEW: 'finance.payments.view',
  FINANCE_REFUNDS_ISSUE: 'finance.refunds.issue',
  FINANCE_REFUNDS_APPROVE: 'finance.refunds.approve',
  FINANCE_RECONCILIATION: 'finance.reconciliation',
  FINANCE_REPORTS: 'finance.reports',
  
  // Super admin permissions
  ADMIN_USERS_MANAGE: 'admin.users.manage',
  ADMIN_ROLES_MANAGE: 'admin.roles.manage',
  ADMIN_AUDIT_VIEW: 'admin.audit.view',
  ADMIN_SETTINGS: 'admin.settings',
  ADMIN_ALL: 'admin.all',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role definitions with default permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  customer: [
    PERMISSIONS.CUSTOMER_BROWSE,
    PERMISSIONS.CUSTOMER_CART,
    PERMISSIONS.CUSTOMER_CHECKOUT,
    PERMISSIONS.CUSTOMER_ORDERS_VIEW,
    PERMISSIONS.CUSTOMER_PROFILE,
  ],
  
  support: [
    PERMISSIONS.CUSTOMER_BROWSE,
    PERMISSIONS.SUPPORT_ORDERS_VIEW,
    PERMISSIONS.SUPPORT_ORDERS_UPDATE,
    PERMISSIONS.SUPPORT_CUSTOMERS_VIEW,
    PERMISSIONS.SUPPORT_REFUND_ISSUE,
  ],
  
  catalog_manager: [
    PERMISSIONS.CUSTOMER_BROWSE,
    PERMISSIONS.CATALOG_PRODUCTS_CREATE,
    PERMISSIONS.CATALOG_PRODUCTS_READ,
    PERMISSIONS.CATALOG_PRODUCTS_UPDATE,
    PERMISSIONS.CATALOG_PRODUCTS_DELETE,
    PERMISSIONS.CATALOG_CATEGORIES_MANAGE,
    PERMISSIONS.CATALOG_INVENTORY_VIEW,
    PERMISSIONS.CATALOG_INVENTORY_ADJUST,
    PERMISSIONS.CATALOG_PROMOTIONS_MANAGE,
  ],
  
  fulfillment_operator: [
    PERMISSIONS.CUSTOMER_BROWSE,
    PERMISSIONS.FULFILLMENT_ORDERS_VIEW,
    PERMISSIONS.FULFILLMENT_ORDERS_UPDATE,
    PERMISSIONS.FULFILLMENT_SHIPMENTS_MANAGE,
    PERMISSIONS.FULFILLMENT_STATUS_UPDATE,
  ],
  
  finance_operator: [
    PERMISSIONS.CUSTOMER_BROWSE,
    PERMISSIONS.FINANCE_PAYMENTS_VIEW,
    PERMISSIONS.FINANCE_REFUNDS_ISSUE,
    PERMISSIONS.FINANCE_REFUNDS_APPROVE,
    PERMISSIONS.FINANCE_RECONCILIATION,
    PERMISSIONS.FINANCE_REPORTS,
  ],
  
  super_admin: [
    PERMISSIONS.ADMIN_ALL,
  ],
};

/**
 * Check if user has a specific permission
 */
export async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
  // Get user's roles
  const userRolesList = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));
  
  if (userRolesList.length === 0) {
    return false;
  }
  
  // Check if user has super_admin role
  const superAdminRole = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, 'super_admin'))
    .limit(1);
  
  if (superAdminRole.length > 0 && userRolesList.some(ur => ur.roleId === superAdminRole[0].id)) {
    return true; // Super admin has all permissions
  }
  
  // Get role IDs
  const roleIds = userRolesList.map(ur => ur.roleId);
  
  // Get permission ID
  const permissionRecord = await db
    .select({ id: permissions.id })
    .from(permissions)
    .where(eq(permissions.name, permission))
    .limit(1);
  
  if (permissionRecord.length === 0) {
    return false;
  }
  
  // Check if any of user's roles have this permission
  const rolePerms = await db
    .select({ id: rolePermissions.id })
    .from(rolePermissions)
    .where(
      and(
        eq(rolePermissions.permissionId, permissionRecord[0].id)
      )
    );
  
  return rolePerms.some(rp => roleIds.includes(rp.roleId));
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const userRolesList = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));
  
  if (userRolesList.length === 0) {
    return [];
  }
  
  // Check for super_admin
  const superAdminRole = await db
    .select({ id: roles.id, name: roles.name })
    .from(roles)
    .where(eq(roles.name, 'super_admin'))
    .limit(1);
  
  if (superAdminRole.length > 0 && userRolesList.some(ur => ur.roleId === superAdminRole[0].id)) {
    return Object.values(PERMISSIONS) as Permission[];
  }
  
  // Get all permissions for user's roles
  const roleIds = userRolesList.map(ur => ur.roleId);
  
  const rolePerms = await db
    .select({ 
      permissionId: rolePermissions.permissionId,
      permissionName: permissions.name 
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id));
  
  const uniquePermissions = [...new Set(rolePerms.map(rp => rp.permissionName))];
  
  return uniquePermissions as Permission[];
}

/**
 * Permission check middleware
 */
export function requirePermission(...requiredPermissions: Permission[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    // Check each required permission
    for (const permission of requiredPermissions) {
      const hasPerm = await hasPermission(user.id, permission);
      
      if (!hasPerm) {
        throw new HTTPException(403, { 
          message: `Permission denied: ${permission}` 
        });
      }
    }
    
    await next();
  };
}

/**
 * Ownership check middleware
 * Ensures user can only access their own resources
 */
export function requireOwnership(resourceType: string, idParam: string = 'id') {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }
    
    const resourceId = c.req.param(idParam);
    
    if (!resourceId) {
      throw new HTTPException(400, { message: 'Resource ID required' });
    }
    
    // Check ownership based on resource type
    let isOwner = false;
    
    switch (resourceType) {
      case 'order': {
        const [order] = await db
          .select({ userId: orders.userId })
          .from(orders)
          .where(eq(orders.id, resourceId))
          .limit(1);
        
        isOwner = order?.userId === user.id;
        break;
      }
      
      case 'address': {
        const [address] = await db
          .select({ userId: addresses.userId })
          .from(addresses)
          .where(eq(addresses.id, resourceId))
          .limit(1);
        
        isOwner = address?.userId === user.id;
        break;
      }
      
      default:
        throw new HTTPException(400, { message: `Unknown resource type: ${resourceType}` });
    }
    
    if (!isOwner) {
      // Check if user has permission to access other users' resources
      const hasSupportAccess = await hasPermission(user.id, PERMISSIONS.SUPPORT_ORDERS_VIEW);
      
      if (!hasSupportAccess) {
        throw new HTTPException(403, { message: 'Access denied: not the owner' });
      }
    }
    
    await next();
  };
}

/**
 * Initialize default roles and permissions
 */
export async function initializeRolesAndPermissions() {
  // Create permissions
  for (const [key, permission] of Object.entries(PERMISSIONS)) {
    const [existing] = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(eq(permissions.name, permission))
      .limit(1);
    
    if (!existing) {
      await db.insert(permissions).values({
        name: permission,
        description: key.replace(/_/g, ' ').toLowerCase(),
      });
    }
  }
  
  // Create roles
  for (const roleName of Object.keys(ROLE_PERMISSIONS)) {
    const [existing] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, roleName))
      .limit(1);
    
    if (!existing) {
      await db.insert(roles).values({
        name: roleName,
        description: `${roleName.replace(/_/g, ' ')} role`,
      });
    }
  }
  
  // Assign permissions to roles
  for (const [roleName, rolePerms] of Object.entries(ROLE_PERMISSIONS)) {
    const [role] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, roleName))
      .limit(1);
    
    if (!role) continue;
    
    for (const permName of rolePerms) {
      const [perm] = await db
        .select({ id: permissions.id })
        .from(permissions)
        .where(eq(permissions.name, permName))
        .limit(1);
      
      if (!perm) continue;
      
      const [existing] = await db
        .select({ id: rolePermissions.id })
        .from(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, role.id),
            eq(rolePermissions.permissionId, perm.id)
          )
        )
        .limit(1);
      
      if (!existing) {
        await db.insert(rolePermissions).values({
          roleId: role.id,
          permissionId: perm.id,
        });
      }
    }
  }
}
