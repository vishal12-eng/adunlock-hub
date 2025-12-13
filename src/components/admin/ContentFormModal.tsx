import { useState, useEffect } from 'react';
import { X, Upload, Link, Loader2, FileBox } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

interface Content {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  redirect_url: string | null;
  required_ads: number;
  status: string;
}

interface ContentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: Content | null;
  onSuccess: () => void;
}

const contentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  thumbnail_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  file_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  redirect_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  required_ads: z.number().min(1, 'At least 1 ad required').max(20, 'Maximum 20 ads'),
  status: z.enum(['active', 'inactive'])
});

export function ContentFormModal({ isOpen, onClose, content, onSuccess }: ContentFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    file_url: '',
    redirect_url: '',
    required_ads: 3,
    status: 'active'
  });

  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title,
        description: content.description || '',
        thumbnail_url: content.thumbnail_url || '',
        file_url: content.file_url || '',
        redirect_url: content.redirect_url || '',
        required_ads: content.required_ads,
        status: content.status
      });
    } else {
      setFormData({
        title: '',
        description: '',
        thumbnail_url: '',
        file_url: '',
        redirect_url: '',
        required_ads: 3,
        status: 'active'
      });
    }
  }, [content, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate
    const result = contentSchema.safeParse({
      ...formData,
      required_ads: Number(formData.required_ads)
    });

    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        thumbnail_url: formData.thumbnail_url || null,
        file_url: formData.file_url || null,
        redirect_url: formData.redirect_url || null,
        required_ads: Number(formData.required_ads),
        status: formData.status
      };

      if (content) {
        // Update existing
        const { error } = await supabase
          .from('contents')
          .update(payload)
          .eq('id', content.id);

        if (error) throw error;
        toast.success('Content updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('contents')
          .insert(payload);

        if (error) throw error;
        toast.success('Content created successfully');
      }

      onSuccess();
    } catch (error) {
      toast.error('Failed to save content');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto glass-intense rounded-2xl animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 glass-intense border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileBox className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {content ? 'Edit Content' : 'Add New Content'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Content title"
              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the content"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Thumbnail URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Thumbnail URL
            </label>
            <input
              type="url"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {formData.thumbnail_url && (
              <div className="mt-2 rounded-lg overflow-hidden h-32 bg-muted">
                <img 
                  src={formData.thumbnail_url} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </div>

          {/* File URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Upload className="w-4 h-4" />
              File/Download URL
            </label>
            <input
              type="url"
              value={formData.file_url}
              onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
              placeholder="https://example.com/file.zip"
              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">Direct download link for files (APK, ZIP, PDF, etc.)</p>
          </div>

          {/* Redirect URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Link className="w-4 h-4" />
              Redirect URL
            </label>
            <input
              type="url"
              value={formData.redirect_url}
              onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
              placeholder="https://example.com/page"
              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">External page to redirect after unlock (takes priority over file)</p>
          </div>

          {/* Required Ads */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Required Ads to Unlock *</label>
            <input
              type="number"
              value={formData.required_ads}
              onChange={(e) => setFormData({ ...formData, required_ads: parseInt(e.target.value) || 1 })}
              min={1}
              max={20}
              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground">Number of ads user must watch (1-20)</p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-foreground">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={formData.status === 'inactive'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-foreground">Inactive</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-border text-muted-foreground font-medium hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-neon flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                content ? 'Update Content' : 'Create Content'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
