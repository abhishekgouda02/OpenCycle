import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, 
  Clock, 
  User, 
  Heart, 
  MessageCircle, 
  Share2, 
  Flag, 
  ArrowLeft,
  Eye,
  Calendar,
  Package,
  Phone,
  MessageSquare,
  Instagram,
  Trash2,
  AlertTriangle,
  X,
  ExternalLink
} from 'lucide-react';
import { supabase, recordItemView, toggleFavorite, getItemStats } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Item } from '../types';

interface ItemStats {
  view_count: number;
  favorite_count: number;
  unique_viewers: number;
}

const ItemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [item, setItem] = useState<Item | null>(null);
  const [stats, setStats] = useState<ItemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchItem();
      fetchItemStats();
      checkIfFavorited();
      recordView();
    }
  }, [id, user]);

  const fetchItem = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          user:users!items_user_id_fkey(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setItem(data);
    } catch (error: any) {
      setError('Item not found');
      console.error('Error fetching item:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemStats = async () => {
    if (!id) return;

    try {
      const { data, error } = await getItemStats(id);
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching item stats:', error);
    }
  };

  const checkIfFavorited = async () => {
    if (!user || !id) return;

    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('item_id', id)
        .eq('user_id', user.id)
        .single();

      setIsFavorited(!!data);
    } catch (error) {
      // Not favorited
    }
  };

  const recordView = async () => {
    if (!id) return;

    try {
      await recordItemView(id, user?.id);
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!user || !id) {
      navigate('/auth');
      return;
    }

    setFavoriteLoading(true);
    try {
      const { error, favorited } = await toggleFavorite(id, user.id);
      if (error) throw error;
      
      setIsFavorited(favorited);
      
      // Update stats
      if (stats) {
        setStats({
          ...stats,
          favorite_count: favorited ? stats.favorite_count + 1 : stats.favorite_count - 1
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    if (!user || !item || user.id !== item.user_id) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  const handleContactOwner = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // TODO: Implement messaging system
    alert('Messaging feature coming soon!');
  };

  const handlePhoneCall = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`tel:${cleanPhone}`, '_self');
  };

  const handleSMS = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`sms:${cleanPhone}`, '_self');
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    // Add country code if not present (assuming US)
    const formattedPhone = cleanPhone.length === 10 ? `1${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  const handleInstagram = (handle: string) => {
    const cleanHandle = handle.replace('@', '');
    window.open(`https://instagram.com/${cleanHandle}`, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share && item) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  const getConditionColor = (condition: Item['condition']) => {
    const colors = {
      'new': 'bg-green-100 text-green-800 border-green-200',
      'like-new': 'bg-blue-100 text-blue-800 border-blue-200',
      'good': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'fair': 'bg-orange-100 text-orange-800 border-orange-200',
      'poor': 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[condition];
  };

  const getConditionDescription = (condition: Item['condition']) => {
    const descriptions = {
      'new': 'Brand new, never used',
      'like-new': 'Excellent condition, barely used',
      'good': 'Good condition with minor wear',
      'fair': 'Fair condition with visible wear',
      'poor': 'Poor condition, significant wear',
    };
    return descriptions[condition];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Item Not Found</h1>
          <p className="text-gray-600 mb-6">The item you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/"
            className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const showContactInfo = user && user.id !== item.user_id && item.is_available;
  const isOwner = user && user.id === item.user_id;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-teal-600 transition-colors mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="aspect-video bg-gray-200">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Package className="w-24 h-24 mx-auto mb-4" />
                      <span className="text-lg">No image available</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Item Details */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{item.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{item.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Posted {formatDate(item.created_at)}</span>
                    </div>
                    {stats && (
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{stats.view_count} views</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className="flex items-center space-x-2">
                  {item.is_available ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      Available
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                      Claimed
                    </span>
                  )}
                </div>
              </div>

              {/* Condition */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Condition</h3>
                <div className={`inline-flex items-center px-4 py-2 rounded-lg border ${getConditionColor(item.condition)}`}>
                  <span className="font-medium capitalize">{item.condition.replace('-', ' ')}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{getConditionDescription(item.condition)}</p>
              </div>

              {/* Category */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Category</h3>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                  {item.category}
                </span>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{item.description}</p>
              </div>

              {/* Stats */}
              {stats && (
                <div className="border-t pt-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.view_count}</div>
                      <div className="text-sm text-gray-500">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.favorite_count}</div>
                      <div className="text-sm text-gray-500">Favorites</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stats.unique_viewers}</div>
                      <div className="text-sm text-gray-500">Unique Viewers</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Owner Info */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Owner</h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden">
                  {item.user?.avatar_url ? (
                    <img
                      src={item.user.avatar_url}
                      alt={item.user.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-teal-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {item.user?.full_name || 'Anonymous User'}
                  </div>
                  {item.user?.location && (
                    <div className="text-sm text-gray-500 flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{item.user.location}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {item.user?.bio && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">{item.user.bio}</p>
                </div>
              )}

              {/* Contact Information */}
              {showContactInfo && (item.user?.phone || item.user?.whatsapp || item.user?.instagram) && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Options</h4>
                  <div className="space-y-3">
                    {item.user?.phone && item.user?.contact_preferences?.show_phone && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-900">Phone</span>
                          </div>
                          <span className="text-sm text-gray-600">{formatPhoneNumber(item.user.phone)}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePhoneCall(item.user!.phone!)}
                            className="flex-1 flex items-center justify-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <Phone className="h-4 w-4" />
                            <span>Call</span>
                          </button>
                          <button
                            onClick={() => handleSMS(item.user!.phone!)}
                            className="flex-1 flex items-center justify-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>SMS</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {item.user?.whatsapp && item.user?.contact_preferences?.show_whatsapp && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-gray-900">WhatsApp</span>
                          </div>
                          <span className="text-sm text-gray-600">{formatPhoneNumber(item.user.whatsapp)}</span>
                        </div>
                        <button
                          onClick={() => handleWhatsApp(item.user!.whatsapp!)}
                          className="w-full flex items-center justify-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>Message on WhatsApp</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {item.user?.instagram && item.user?.contact_preferences?.show_instagram && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Instagram className="h-4 w-4 text-pink-600" />
                            <span className="text-sm font-medium text-gray-900">Instagram</span>
                          </div>
                          <span className="text-sm text-gray-600">{formatInstagramHandle(item.user.instagram)}</span>
                        </div>
                        <button
                          onClick={() => handleInstagram(item.user!.instagram!)}
                          className="w-full flex items-center justify-center space-x-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors text-sm"
                        >
                          <Instagram className="h-4 w-4" />
                          <span>View on Instagram</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="space-y-3">
                {item.is_available && !isOwner && (
                  <button
                    onClick={handleContactOwner}
                    className="w-full flex items-center justify-center space-x-2 bg-teal-600 text-white px-4 py-3 rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Send Message</span>
                  </button>
                )}

                {!isOwner && (
                  <button
                    onClick={handleFavoriteToggle}
                    disabled={favoriteLoading}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                      isFavorited
                        ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
                    <span>{isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                  </button>
                )}

                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-50 text-gray-700 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                  <span>Share Item</span>
                </button>

                {isOwner ? (
                  <div className="border-t pt-3">
                    {deleteConfirm ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <span className="text-sm font-medium text-red-900">Confirm Deletion</span>
                        </div>
                        <p className="text-sm text-red-700 mb-4">
                          This action cannot be undone. Your item will be permanently deleted.
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleDeleteItem}
                            disabled={deleting}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                          >
                            {deleting ? 'Deleting...' : 'Delete Item'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(false)}
                            className="flex-1 bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(true)}
                        className="w-full flex items-center justify-center space-x-2 text-red-600 px-4 py-3 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                        <span>Delete Item</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button className="w-full flex items-center justify-center space-x-2 text-red-600 px-4 py-3 rounded-lg border border-red-200 hover:bg-red-50 transition-colors">
                    <Flag className="h-5 w-5" />
                    <span>Report Item</span>
                  </button>
                )}
              </div>
            </div>

            {/* Safety Tips */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Safety Tips</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Meet in a public place</li>
                <li>• Bring a friend if possible</li>
                <li>• Trust your instincts</li>
                <li>• Inspect items before pickup</li>
                <li>• Be respectful and courteous</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailPage;