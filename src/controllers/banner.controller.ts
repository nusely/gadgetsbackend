import { Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { successResponse, errorResponse } from '../utils/responseHandlers';
import { AuthRequest } from '../middleware/auth.middleware';

export const getBannersByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const currentDate = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('banners')
      .select('*')
      .eq('type', type)
      .eq('active', true)
      .or(`start_date.is.null,start_date.lte.${currentDate}`)
      .or(`end_date.is.null,end_date.gte.${currentDate}`)
      .order('position', { ascending: true });

    if (error) throw error;

    return successResponse(res, data || []);
  } catch (error: any) {
    console.error('Get banners error:', error);
    return errorResponse(res, error.message);
  }
};

export const getAllBanners = async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('banners')
      .select('*')
      .order('position', { ascending: true });

    if (error) throw error;

    return successResponse(res, data || []);
  } catch (error: any) {
    console.error('Get all banners error:', error);
    return errorResponse(res, error.message);
  }
};

export const createBanner = async (req: AuthRequest, res: Response) => {
  try {
    const bannerData = req.body;

    const { data, error } = await supabaseAdmin
      .from('banners')
      .insert([bannerData])
      .select()
      .single();

    if (error) throw error;

    return successResponse(res, data, 'Banner created successfully', 201);
  } catch (error: any) {
    console.error('Create banner error:', error);
    return errorResponse(res, error.message);
  }
};

export const updateBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
      .from('banners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return errorResponse(res, 'Banner not found', 404);
    }

    return successResponse(res, data, 'Banner updated successfully');
  } catch (error: any) {
    console.error('Update banner error:', error);
    return errorResponse(res, error.message);
  }
};

export const deleteBanner = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin.from('banners').delete().eq('id', id);

    if (error) throw error;

    return successResponse(res, null, 'Banner deleted successfully');
  } catch (error: any) {
    console.error('Delete banner error:', error);
    return errorResponse(res, error.message);
  }
};



