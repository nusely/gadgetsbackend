import { supabaseAdmin } from '../utils/supabaseClient';

export interface CustomerPayload {
  userId?: string | null;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  createdBy?: string | null;
  source?: string;
}

const normalizeEmail = (email?: string | null) => {
  if (!email) return null;
  const trimmed = email.trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : null;
};

export const customerService = {
  async findById(customerId: string) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  },

  async findByUserId(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  },

  async findByEmail(email: string) {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;

    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('email', normalized)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  },

  async upsertCustomer(payload: CustomerPayload) {
    const normalizedEmail = normalizeEmail(payload.email);
    const trimmedName = payload.fullName?.trim() || null;
    const trimmedPhone = payload.phone?.trim() || null;

    if (!normalizedEmail && !trimmedPhone) {
      // Need at least one contact field
      throw new Error('Customer email or phone is required');
    }

    // Prefer existing record by user_id
    if (payload.userId) {
      const existingByUser = await this.findByUserId(payload.userId);
      if (existingByUser) {
        await supabaseAdmin
          .from('customers')
          .update({
            full_name: trimmedName || existingByUser.full_name,
            email: normalizedEmail || existingByUser.email,
            phone: trimmedPhone || existingByUser.phone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingByUser.id);

        return (await this.findById(existingByUser.id)) || existingByUser;
      }
    }

    // Then try by email
    if (normalizedEmail) {
      const existingByEmail = await this.findByEmail(normalizedEmail);
      if (existingByEmail) {
        const updates: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (payload.userId && !existingByEmail.user_id) {
          updates.user_id = payload.userId;
        }
        if (trimmedName && !existingByEmail.full_name) {
          updates.full_name = trimmedName;
        }
        if (trimmedPhone && !existingByEmail.phone) {
          updates.phone = trimmedPhone;
        }

        if (Object.keys(updates).length > 1) {
          await supabaseAdmin
            .from('customers')
            .update(updates)
            .eq('id', existingByEmail.id);
        }

        return (await this.findById(existingByEmail.id)) || existingByEmail;
      }
    }

    const insertPayload: Record<string, any> = {
      user_id: payload.userId || null,
      full_name: trimmedName,
      email: normalizedEmail,
      phone: trimmedPhone,
      source: payload.source || (payload.userId ? 'registered' : 'manual'),
      created_by: payload.createdBy || null,
    };

    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async searchCustomers(query: string, limit = 10) {
    const term = query.trim();
    if (!term) return [];

    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('id, full_name, email, phone, user_id, source')
      .or(
        ['full_name', 'email', 'phone']
          .map((column) => `${column}.ilike.%${term}%`)
          .join(',')
      )
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async touchLastOrder(customerId: string) {
    await supabaseAdmin
      .from('customers')
      .update({ last_order_at: new Date().toISOString() })
      .eq('id', customerId);
  },
};
