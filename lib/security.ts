import prisma from './prisma';
import { AuthUser } from './auth';

/**
 * Log a user action to the AuditLog table
 */
export async function logAction(params: {
    user: AuthUser;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'LOCK' | 'UNLOCK';
    module: string;
    entityId?: number;
    payload?: any;
    ipAddress?: string;
}) {
    try {
        await prisma.auditLog.create({
            data: {
                userId: params.user.id,
                action: params.action,
                module: params.module,
                entityId: params.entityId,
                payload: params.payload,
                ipAddress: params.ipAddress,
                companyId: params.user.companyId as number,
            }
        });
    } catch (error) {
        console.error('Audit logging failed:', error);
    }
}

/**
 * Generic Permission Checker (RBAC + ABAC)
 */
export async function checkPermission(
    user: AuthUser,
    module: string,
    action: string,
    entity?: any
) {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;

    // RBAC: Role-based restrictions
    if (module === 'ACCOUNTS' && user.role !== 'ACCOUNTS') return false;
    if (module === 'VENDORS' && !['OPERATOR', 'ADMIN'].includes(user.role)) return false;

    // ABAC: Attribute-based restrictions (Branch check)
    if (entity && entity.branchId && user.branch && entity.branchId.toString() !== user.branch) {
        // If entity belongs to a specific branch and user is restricted to a branch
        return false;
    }

    return true;
}

/**
 * Check if a financial period is closed
 */
export async function isPeriodClosed(companyId: number, date: Date) {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const period = await prisma.financialPeriod.findUnique({
        where: {
            companyId_month_year: {
                companyId,
                month,
                year
            }
        }
    });

    return period?.isClosed || false;
}
