import React, { useState, useEffect } from 'react';
import { User, MapPin, Calendar, Edit3, Upload, X, Camera, Phone, MessageSquare, Instagram, Eye, EyeOff, Trash2, Package, AlertTriangle } from 'lucide-react';
import { supabase, uploadFile, getPublicUrl } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Item } from '../../types';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  bio?: string;
  location?: string;
  avatar_url?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  contact_preferences?: {
    show_phone?: boolean;
    show_whatsapp?: boolean;
    show_instagram?: boolean;
  };
  created_at: string;
}

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    location: '',
    avatar_url: '',
    phone: '',
    whatsapp: '',
    instagram: '',
    contact_preferences: {
      show_phone: true,
      show_whatsapp: true,
      show_instagram: true,
    },
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserItems();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // If user doesn't exist in profiles table, create one
        if (error.code === 'PGRST116') {
          await createProfile();
        } else {
          throw error;
        }
      } else {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          bio: data.bio || '',
          location: data.location || '',
          avatar_url: data.avatar_url || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          instagram: data.instagram || '',
          contact_preferences: data.contact_preferences || {
            show_phone: true,
            show_whatsapp: true,
            show_instagram: true,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserItems(data || []);
    } catch (error) {
      console.error('Error fetching user items:', error);
    }
  };

  const createProfile = async () => {
    if (!user) return;

    try {
      const newProfile = {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || '',
        contact_preferences: {
          show_phone: true,
          show_whatsapp: true,
          show_instagram: true,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('users')
        .insert([newProfile])
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        bio: data.bio || '',
        location: data.location || '',
        avatar_url: data.avatar_url || '',
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        instagram: data.instagram || '',
        contact_preferences: data.contact_preferences || {
          show_phone: true,
          show_whatsapp: true,
          show_instagram: true,
        },
      });
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (2MB limit for avatars)
    if (file.size > 2 * 1024 * 1024) {
      setError('Avatar image must be less than 2MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const removeAvatar = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData(prev => ({ ...prev, avatar_url: '' }));
    
    // Clean up preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!selectedFile || !user) return null;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      
      const { data, error } = await uploadFile('avatars', fileName, selectedFile);
      
      if (error) throw error;
      
      const publicUrl = getPublicUrl('avatars', fileName);
      return publicUrl;
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    setError('');
    
    try {
      let avatarUrl = formData.avatar_url;

      // Upload avatar if one is selected
      if (selectedFile) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        } else if (error) {
          setSaving(false);
          return;
        }
      }

      const { data, error: updateError } = await supabase
        .from('users')
        .update({
          ...formData,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        bio: data.bio || '',
        location: data.location || '',
        avatar_url: data.avatar_url || '',
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        instagram: data.instagram || '',
        contact_preferences: data.contact_preferences || {
          show_phone: true,
          show_whatsapp: true,
          show_instagram: true,
        },
      });
      setEditing(false);
      setSelectedFile(null);
      setPreviewUrl('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        avatar_url: profile.avatar_url || '',
        phone: profile.phone || '',
        whatsapp: profile.whatsapp || '',
        instagram: profile.instagram || '',
        contact_preferences: profile.contact_preferences || {
          show_phone: true,
          show_whatsapp: true,
          show_instagram: true,
        },
      });
    }
    setEditing(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setError('');
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (deleteConfirm !== itemId) {
      setDeleteConfirm(itemId);
      return;
    }

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setUserItems(prev => prev.filter(item => item.id !== itemId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item');
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  };

  const formatInstagramHandle = (handle: string) => {
    // Remove @ if present and add it back
    const cleaned = handle.replace('@', '');
    return cleaned ? `@${cleaned}` : '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading profile</p>
      </div>
    );
  }

  const currentAvatarUrl = previewUrl || formData.avatar_url || profile.avatar_url;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-blue-600 px-6 py-8">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden mx-auto">
                    {currentAvatarUrl ? (
                      <img
                        src={currentAvatarUrl}
                        alt={profile.full_name}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-teal-600" />
                    )}
                  </div>
                  {editing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="cursor-pointer text-white hover:text-gray-200 transition-colors"
                      >
                        <Camera className="w-6 h-6" />
                      </label>
                    </div>
                  )}
                </div>
                <div className="text-white mt-4">
                  <h1 className="text-2xl font-bold">{profile.full_name || 'Anonymous User'}</h1>
                  <p className="text-teal-100 mt-1">{profile.email}</p>
                </div>
                <button
                  onClick={() => setEditing(!editing)}
                  className="mt-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{editing ? 'Cancel' : 'Edit Profile'}</span>
                </button>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {editing ? (
                <div className="space-y-4">
                  {/* Avatar Upload Section */}
                  {(previewUrl || selectedFile) && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <img
                            src={previewUrl}
                            alt="Avatar preview"
                            className="w-10 h-10 object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">New avatar selected</p>
                          <p className="text-xs text-gray-500">{selectedFile?.name}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Tell us about yourself..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="City, State"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  {/* Contact Information */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="tel"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                            placeholder="(555) 123-4567"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              contact_preferences: {
                                ...formData.contact_preferences,
                                show_phone: !formData.contact_preferences.show_phone
                              }
                            })}
                            className={`p-2 rounded-lg transition-colors ${
                              formData.contact_preferences.show_phone
                                ? 'bg-teal-100 text-teal-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                            title={formData.contact_preferences.show_phone ? 'Hide from others' : 'Show to others'}
                          >
                            {formData.contact_preferences.show_phone ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          WhatsApp Number
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="tel"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                            placeholder="(555) 123-4567"
                            value={formData.whatsapp}
                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              contact_preferences: {
                                ...formData.contact_preferences,
                                show_whatsapp: !formData.contact_preferences.show_whatsapp
                              }
                            })}
                            className={`p-2 rounded-lg transition-colors ${
                              formData.contact_preferences.show_whatsapp
                                ? 'bg-teal-100 text-teal-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                            title={formData.contact_preferences.show_whatsapp ? 'Hide from others' : 'Show to others'}
                          >
                            {formData.contact_preferences.show_whatsapp ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Instagram Handle
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                            placeholder="@username"
                            value={formData.instagram}
                            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              contact_preferences: {
                                ...formData.contact_preferences,
                                show_instagram: !formData.contact_preferences.show_instagram
                              }
                            })}
                            className={`p-2 rounded-lg transition-colors ${
                              formData.contact_preferences.show_instagram
                                ? 'bg-teal-100 text-teal-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                            title={formData.contact_preferences.show_instagram ? 'Hide from others' : 'Show to others'}
                          >
                            {formData.contact_preferences.show_instagram ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Avatar URL (alternative to upload)
                    </label>
                    <input
                      type="url"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="https://example.com/avatar.jpg"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    />
                  </div>

                  <div className="flex space-x-3 pt-4 border-t">
                    <button
                      onClick={handleCancel}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || uploading}
                      className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving || uploading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>{uploading ? 'Uploading...' : 'Saving...'}</span>
                        </div>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.bio && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">About</h3>
                      <p className="text-gray-600 text-sm">{profile.bio}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {profile.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-teal-600" />
                        <span className="text-sm text-gray-700">{profile.location}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-700">
                        Member since {new Date(profile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Contact Information Display */}
                  {(profile.phone || profile.whatsapp || profile.instagram) && (
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
                      <div className="space-y-2">
                        {profile.phone && profile.contact_preferences?.show_phone && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-gray-700">{formatPhoneNumber(profile.phone)}</span>
                            </div>
                          </div>
                        )}

                        {profile.whatsapp && profile.contact_preferences?.show_whatsapp && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <MessageSquare className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-gray-700">{formatPhoneNumber(profile.whatsapp)}</span>
                            </div>
                          </div>
                        )}

                        {profile.instagram && profile.contact_preferences?.show_instagram && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Instagram className="w-4 h-4 text-pink-600" />
                              <span className="text-sm text-gray-700">{formatInstagramHandle(profile.instagram)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Items</h2>
              <span className="px-3 py-1 bg-teal-100 text-teal-800 text-sm font-medium rounded-full">
                {userItems.length} items
              </span>
            </div>

            {userItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
                <p className="text-gray-500 mb-4">Start sharing items with your community</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-16 h-16 object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.is_available
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.is_available ? 'Available' : 'Claimed'}
                            </span>
                            <span className="text-xs text-gray-500">{item.category}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {deleteConfirm === item.id ? (
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Confirm delete"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="p-1 text-gray-400 hover:bg-gray-50 rounded transition-colors"
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;