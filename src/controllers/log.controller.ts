import { Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { successResponse, errorResponse } from '../utils/responseHandlers';
import { SPECIAL_AUDIT_EMAILS } from '../middleware/auth.middleware';

export class LogController {
  async getAdminLogs(req: Request, res: Response) {
    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const offset = (page - 1) * limit;

    try {
      const currentUser = (req as any).user;

      if (!currentUser) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const email = typeof currentUser.email === 'string' ? currentUser.email.toLowerCase() : '';
      const isWhitelisted = email && SPECIAL_AUDIT_EMAILS.has(email);

      if (currentUser.role !== 'superadmin' && currentUser.role !== 'admin') {
        return errorResponse(res, 'Forbidden', 403);
      }

      if (currentUser.role !== 'superadmin' && !isWhitelisted) {
        return errorResponse(res, 'Forbidden', 403);
      }

      const { data, error, count } = await supabaseAdmin
        .from('admin_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching admin logs:', error);
        return errorResponse(res, 'Failed to fetch logs', 500);
      }

      // Insert audit trail for this access
      try {
        await supabaseAdmin
          .from('admin_logs')
          .insert({
            action: 'VIEW_ADMIN_LOGS',
            user_id: (req as any).user?.id ?? null,
            role: (req as any).user?.role ?? 'unknown',
            status_code: 200,
            duration_ms: 0,
            ip_address: req.ip,
            metadata: {
              page,
              limit,
            },
          });
      } catch (auditError) {
        console.error('Failed to persist audit view log:', auditError);
      }

      return successResponse(res, {
        logs: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit) || 1,
        },
      });
    } catch (error) {
      console.error('Unexpected error fetching admin logs:', error);
      return errorResponse(res, 'Failed to fetch logs', 500);
    }
  }
}

export default new LogController();

