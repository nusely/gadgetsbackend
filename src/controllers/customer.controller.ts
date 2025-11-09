import { Response } from 'express';
import { randomUUID } from 'crypto';
import { AuthRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../utils/supabaseClient';
import { successResponse, errorResponse } from '../utils/responseHandlers';

const resolveFallbackEmail = (): { primary: string; alias: string } => {
  const fallback = process.env.ADMIN_FALLBACK_EMAIL || process.env.SUPPORT_EMAIL || 'support@ventechgadgets.com';
  const [localPart, domain] = fallback.split('@');

  if (!localPart || !domain) {
    return {
      primary: 'support@ventechgadgets.com',
      alias: `support+${randomUUID().slice(0, 8)}@ventechgadgets.com`,
    };
  }

  const sanitizedLocal = localPart.replace(/[^a-zA-Z0-9.+_-]/g, '');
  const alias = `${sanitizedLocal}+${randomUUID().slice(0, 8)}@${domain}`;
  return {
    primary: fallback,
    alias,
  };
};

export class CustomerController {
  async createCustomer(req: AuthRequest, res: Response) {
    try {
      const { full_name, email, phone, shipping_address } = req.body || {};

      if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
        return errorResponse(res, 'Customer full name is required', 400);
      }

      if (!phone || typeof phone !== 'string' || phone.trim().length < 5) {
        return errorResponse(res, 'Customer phone number is required', 400);
      }

      const trimmedName = full_name.trim();
      const nameParts = trimmedName.split(/\s+/);
      const firstName = nameParts.shift() || trimmedName;
      const lastName = nameParts.join(' ').trim() || null;

      const normalizedEmail = typeof email === 'string' && email.trim().length > 0 ? email.trim().toLowerCase() : null;

      // If email exists, reuse the existing customer
      if (normalizedEmail) {
        const { data: existingCustomer, error: existingError } = await supabaseAdmin
          .from('users')
          .select('id, full_name, email, phone')
          .eq('email', normalizedEmail)
          .eq('role', 'customer')
          .maybeSingle();

        if (existingError) {
          console.error('Error checking existing customer:', existingError);
        }

        if (existingCustomer) {
          return successResponse(res, existingCustomer, 'Customer already exists');
        }
      }

      const { primary: fallbackEmail, alias: aliasEmail } = resolveFallbackEmail();
      const emailForInsert = normalizedEmail || aliasEmail;

      const insertPayload: Record<string, any> = {
        first_name: firstName,
        last_name: lastName,
        full_name: trimmedName,
        email: emailForInsert,
        phone: phone.trim(),
        role: 'customer',
        newsletter_subscribed: false,
        sms_notifications: true,
        email_notifications: true,
      };

      if (shipping_address && typeof shipping_address === 'object') {
        insertPayload.shipping_address = shipping_address;
      }

      if (!normalizedEmail) {
        insertPayload.metadata = {
          contact_email: fallbackEmail,
          generated_alias: emailForInsert,
        };
      }

      const { data: insertedCustomer, error: insertError } = await supabaseAdmin
        .from('users')
        .insert(insertPayload)
        .select('id, full_name, email, phone')
        .single();

      if (insertError) {
        console.error('Error creating customer:', insertError);

        // Handle duplicate email gracefully
        const errorWithCode = insertError as any;
        if (errorWithCode?.code === '23505' && emailForInsert) {
          const { data: existingCustomer } = await supabaseAdmin
            .from('users')
            .select('id, full_name, email, phone')
            .eq('email', emailForInsert)
            .maybeSingle();

          if (existingCustomer) {
            return successResponse(res, existingCustomer, 'Customer already exists');
          }
        }

        return errorResponse(res, insertError.message || 'Failed to create customer', 500);
      }

      return successResponse(res, insertedCustomer, 'Customer created successfully', 201);
    } catch (error: any) {
      console.error('Unexpected error creating customer:', error);
      return errorResponse(res, error?.message || 'Failed to create customer', 500);
    }
  }
}

export const customerController = new CustomerController();
