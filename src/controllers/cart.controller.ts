import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../utils/supabaseClient';
import { errorResponse, successResponse } from '../utils/responseHandlers';

const buildCartSelect = () =>
  `id, quantity, selected_variants, product:products(*)`;

export class CartController {
  async getCart(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const { data, error } = await supabaseAdmin
        .from('cart_items')
        .select(buildCartSelect())
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return successResponse(res, data || [], 'Cart fetched successfully');
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      return errorResponse(res, error?.message || 'Failed to fetch cart');
    }
  }

  async replaceCart(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const items = Array.isArray(req.body?.items) ? req.body.items : [];

      // Clear existing cart for user
      const { error: deleteError } = await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        throw deleteError;
      }

      if (items.length === 0) {
        return successResponse(res, [], 'Cart cleared successfully');
      }

      const now = new Date().toISOString();
      const payload = items.map((item: any) => ({
        user_id: userId,
        product_id: item.product_id,
        quantity: Number(item.quantity) || 1,
        selected_variants: item.selected_variants || {},
        created_at: now,
        updated_at: now,
      }));

      const { data, error } = await supabaseAdmin
        .from('cart_items')
        .upsert(payload, { onConflict: 'user_id,product_id' })
        .select(buildCartSelect());

      if (error) {
        throw error;
      }

      return successResponse(res, data || [], 'Cart updated successfully');
    } catch (error: any) {
      console.error('Error replacing cart:', error);
      return errorResponse(res, error?.message || 'Failed to update cart');
    }
  }

  async removeItem(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { productId } = req.params;

      if (!userId) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      if (!productId) {
        return errorResponse(res, 'Product id is required', 400);
      }

      const { error } = await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (error) {
        throw error;
      }

      return successResponse(res, { productId }, 'Item removed from cart');
    } catch (error: any) {
      console.error('Error removing cart item:', error);
      return errorResponse(res, error?.message || 'Failed to remove item');
    }
  }

  async clearCart(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const { error } = await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return successResponse(res, [], 'Cart cleared successfully');
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      return errorResponse(res, error?.message || 'Failed to clear cart');
    }
  }
}

export const cartController = new CartController();
