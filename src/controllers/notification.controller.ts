import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../utils/supabaseClient';
import { successResponse, errorResponse } from '../utils/responseHandlers';

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 50;

export const listNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const rawLimit = parseInt(String(req.query.limit ?? DEFAULT_LIMIT), 10);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const unreadOnly = String(req.query.unread ?? 'false').toLowerCase() === 'true';

    let query = supabaseAdmin
      .from('notifications')
      .select('id, type, title, message, is_read, created_at, action_url')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const { count: unreadCount, error: unreadError } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (unreadError) {
      throw unreadError;
    }

    return successResponse(res, {
      notifications: data || [],
      unread_count: unreadCount || 0,
    });
  } catch (error: any) {
    console.error('Error listing notifications:', error);
    return errorResponse(res, error?.message || 'Failed to fetch notifications');
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, 'Notification id is required', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return errorResponse(res, 'Notification not found', 404);
    }

    return successResponse(res, { id }, 'Notification marked as read');
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return errorResponse(res, error?.message || 'Failed to mark notification as read');
  }
};

export const markAllNotificationsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('is_read', false);

    if (error) {
      throw error;
    }

    return successResponse(res, { marked_all: true }, 'All notifications marked as read');
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return errorResponse(res, error?.message || 'Failed to mark all notifications as read');
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, 'Notification id is required', 400);
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return successResponse(res, { id }, 'Notification deleted successfully');
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return errorResponse(res, error?.message || 'Failed to delete notification');
  }
};
