import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../utils/supabaseClient';
import { successResponse, errorResponse } from '../utils/responseHandlers';

export const updateOptionPrice = async (req: AuthRequest, res: Response) => {
  const { optionId } = req.params;
  const { price_modifier } = req.body;

  const parsedPrice = Number(price_modifier);
  if (Number.isNaN(parsedPrice)) {
    return errorResponse(res, 'price_modifier must be a numeric value', 400);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('product_attribute_options')
      .update({ price_modifier: parsedPrice })
      .eq('id', optionId)
      .select()
      .single();

    if (error) throw error;

    return successResponse(res, data, 'Option price updated successfully');
  } catch (error: any) {
    console.error('Error updating option price:', error);
    return errorResponse(res, 'Failed to update option price');
  }
};

export const deleteOption = async (req: AuthRequest, res: Response) => {
  const { optionId } = req.params;

  try {
    // Remove any product mappings referencing this option
    const { error: optionMappingError } = await supabaseAdmin
      .from('product_attribute_option_mappings')
      .delete()
      .eq('option_id', optionId);

    if (optionMappingError) throw optionMappingError;

    const { error: optionDeleteError } = await supabaseAdmin
      .from('product_attribute_options')
      .delete()
      .eq('id', optionId);

    if (optionDeleteError) throw optionDeleteError;

    return successResponse(res, { optionId }, 'Option deleted successfully');
  } catch (error: any) {
    console.error('Error deleting attribute option:', error);
    return errorResponse(res, 'Failed to delete option');
  }
};

export const deleteAttribute = async (req: AuthRequest, res: Response) => {
  const { attributeId } = req.params;

  try {
    // Remove option mappings referencing this attribute
    const { error: optionMappingsError } = await supabaseAdmin
      .from('product_attribute_option_mappings')
      .delete()
      .eq('attribute_id', attributeId);

    if (optionMappingsError) throw optionMappingsError;

    // Remove product mappings for this attribute
    const { error: attributeMappingsError } = await supabaseAdmin
      .from('product_attribute_mappings')
      .delete()
      .eq('attribute_id', attributeId);

    if (attributeMappingsError) throw attributeMappingsError;

    // Remove attribute options
    const { error: optionsDeleteError } = await supabaseAdmin
      .from('product_attribute_options')
      .delete()
      .eq('attribute_id', attributeId);

    if (optionsDeleteError) throw optionsDeleteError;

    // Finally, remove the attribute itself
    const { error: attributeDeleteError } = await supabaseAdmin
      .from('product_attributes')
      .delete()
      .eq('id', attributeId);

    if (attributeDeleteError) throw attributeDeleteError;

    return successResponse(res, { attributeId }, 'Attribute deleted successfully');
  } catch (error: any) {
    console.error('Error deleting attribute:', error);
    return errorResponse(res, 'Failed to delete attribute');
  }
};

