/**
 * Knowledge Base Service - Gestion de la base de connaissances
 */

import { supabase } from '@/integrations/supabase/client';

export type KBStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  subcategory?: string;
  tags: string[];
  status: KBStatus;
  authorId?: string;
  organizationId?: string;
  viewCount: number;
  helpfulCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const kbTable = () => (supabase as any).from('knowledge_base');

class KnowledgeBaseService {
  /**
   * Get published articles (public)
   */
  async getPublishedArticles(filters?: { category?: string; tags?: string[] }): Promise<KBArticle[]> {
    try {
      let query = kbTable()
        .select('*')
        .eq('status', 'PUBLISHED');
      
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }
      
      const { data, error } = await query.order('view_count', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((row: any) => this.mapFromDatabase(row));
    } catch (err) {
      console.error('[KnowledgeBaseService] Error fetching articles:', err);
      return [];
    }
  }

  /**
   * Get all articles (admin)
   */
  async getAll(filters?: { status?: KBStatus; category?: string }): Promise<KBArticle[]> {
    try {
      let query = kbTable().select('*');
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      
      const { data, error } = await query.order('updated_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((row: any) => this.mapFromDatabase(row));
    } catch (err) {
      console.error('[KnowledgeBaseService] Error fetching articles:', err);
      return [];
    }
  }

  /**
   * Search articles
   */
  async search(query: string): Promise<KBArticle[]> {
    try {
      const { data, error } = await kbTable()
        .select('*')
        .eq('status', 'PUBLISHED')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('view_count', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return (data || []).map((row: any) => this.mapFromDatabase(row));
    } catch (err) {
      console.error('[KnowledgeBaseService] Error searching articles:', err);
      return [];
    }
  }

  /**
   * Get article by ID
   */
  async getById(id: string): Promise<KBArticle | null> {
    try {
      const { data, error } = await kbTable()
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Increment view count
      await kbTable()
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id);
      
      return this.mapFromDatabase(data);
    } catch (err) {
      console.error('[KnowledgeBaseService] Error fetching article:', err);
      return null;
    }
  }

  /**
   * Get categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await kbTable()
        .select('category')
        .eq('status', 'PUBLISHED');
      
      if (error) throw error;
      
      const categories = [...new Set((data || []).map((row: any) => row.category))];
      return categories.filter(Boolean) as string[];
    } catch (err) {
      console.error('[KnowledgeBaseService] Error fetching categories:', err);
      return [];
    }
  }

  /**
   * Create article
   */
  async create(article: Omit<KBArticle, 'id' | 'viewCount' | 'helpfulCount' | 'createdAt' | 'updatedAt'>): Promise<KBArticle> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await kbTable()
        .insert({
          title: article.title,
          content: article.content,
          category: article.category,
          subcategory: article.subcategory,
          tags: article.tags || [],
          status: article.status || 'DRAFT',
          author_id: user?.id,
          organization_id: article.organizationId,
          view_count: 0,
          helpful_count: 0,
          metadata: article.metadata || {}
        })
        .select()
        .single();
      
      if (error) throw error;
      return this.mapFromDatabase(data);
    } catch (err) {
      console.error('[KnowledgeBaseService] Error creating article:', err);
      throw err;
    }
  }

  /**
   * Update article
   */
  async update(id: string, updates: Partial<KBArticle>): Promise<KBArticle> {
    try {
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.content) dbUpdates.content = updates.content;
      if (updates.category) dbUpdates.category = updates.category;
      if (updates.subcategory !== undefined) dbUpdates.subcategory = updates.subcategory;
      if (updates.tags) dbUpdates.tags = updates.tags;
      if (updates.status) dbUpdates.status = updates.status;
      
      const { data, error } = await kbTable()
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return this.mapFromDatabase(data);
    } catch (err) {
      console.error('[KnowledgeBaseService] Error updating article:', err);
      throw err;
    }
  }

  /**
   * Mark article as helpful
   */
  async markHelpful(id: string): Promise<void> {
    try {
      const { data } = await kbTable().select('helpful_count').eq('id', id).single();
      
      await kbTable()
        .update({ helpful_count: (data?.helpful_count || 0) + 1 })
        .eq('id', id);
    } catch (err) {
      console.error('[KnowledgeBaseService] Error marking helpful:', err);
    }
  }

  /**
   * Delete article
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await kbTable().delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[KnowledgeBaseService] Error deleting article:', err);
      throw err;
    }
  }

  private mapFromDatabase(row: Record<string, unknown>): KBArticle {
    return {
      id: row.id as string,
      title: row.title as string,
      content: row.content as string,
      category: row.category as string,
      subcategory: row.subcategory as string,
      tags: (row.tags as string[]) || [],
      status: row.status as KBStatus,
      authorId: row.author_id as string,
      organizationId: row.organization_id as string,
      viewCount: row.view_count as number || 0,
      helpfulCount: row.helpful_count as number || 0,
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    };
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
