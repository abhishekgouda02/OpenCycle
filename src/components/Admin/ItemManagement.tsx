import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Ban, 
  CheckCircle,
  Package,
  MapPin,
  Calendar,
  User,
  Heart,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Item } from '../../types';

interface ItemWithStats extends Item {
  view_count?: number;
  favorite_count?: number;
}

const ItemManagement: React.FC = () => {
  const [items, setItems] = useState<ItemWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedItem, setSelectedItem] = useState<ItemWithStats | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const categories = [
    'Electronics',
    'Furniture',
    'Clothing',
    'Books',
    'Toys',
    'Kitchen',
    'Sports',
    'Other'
  ];

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items_with_stats')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    setActionLoading(itemId);
    try {
      const { error } = await supabase
        .from('items')
        .update({ is_available: !currentStatus })
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, is_available: !currentStatus } : item
      ));
    } catch (error) {
      console.error('Error updating item:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    setActionLoading(itemId);
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesStatus = !selectedStatus || 
                         (selectedStatus === 'available' && item.is_available) ||
                         (selectedStatus === 'claimed' && !item.is_available);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getConditionColor = (condition: Item['condition']) => {
    const colors = {
      'new': 'bg-green-100 text-green-800',
      'like-new': 'bg-blue-100 text-blue-800',
      'good': 'bg-yellow-100 text-yellow-800',
      'fair': 'bg-orange-100 text-orange-800',
      'poor': 'bg-red-100 text-red-800',
    };
    return colors[condition];
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item Management</h1>
          <p className="text-gray-600">Manage all items posted on the platform</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">{filteredItems.length} items</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items by title, description, or location..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="claimed">Claimed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {item.image_url ? (
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={item.image_url}
                            alt={item.title}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {item.title}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {item.description}
                        </div>
                        <div className="flex items-center text-xs text-gray-400 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {item.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        {item.user?.avatar_url ? (
                          <img
                            className="h-8 w-8 rounded-full object-cover"
                            src={item.user.avatar_url}
                            alt={item.user.full_name}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-teal-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {item.user?.full_name || 'Anonymous'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.user?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {item.category}
                      </span>
                      <div>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getConditionColor(item.condition)}`}>
                          {item.condition}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Eye className="h-3 w-3 text-gray-400 mr-1" />
                        <span>{item.view_count || 0}</span>
                      </div>
                      <div className="flex items-center">
                        <Heart className="h-3 w-3 text-gray-400 mr-1" />
                        <span>{item.favorite_count || 0}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.is_available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.is_available ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Available
                        </>
                      ) : (
                        <>
                          <Ban className="h-3 w-3 mr-1" />
                          Claimed
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(item.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowItemModal(true);
                        }}
                        className="text-teal-600 hover:text-teal-900 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <a
                        href={`/item/${item.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="View on site"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleToggleAvailability(item.id, item.is_available)}
                        disabled={actionLoading === item.id}
                        className={`transition-colors ${
                          item.is_available
                            ? 'text-yellow-600 hover:text-yellow-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={item.is_available ? 'Mark as claimed' : 'Mark as available'}
                      >
                        {actionLoading === item.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : item.is_available ? (
                          <Ban className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={actionLoading === item.id}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Detail Modal */}
      {showItemModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Item Details</h3>
                <button
                  onClick={() => setShowItemModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  {selectedItem.image_url ? (
                    <img
                      src={selectedItem.image_url}
                      alt={selectedItem.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      {selectedItem.title}
                    </h4>
                    <p className="text-gray-600">{selectedItem.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Category</span>
                      <p className="text-gray-900">{selectedItem.category}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Condition</span>
                      <p className="text-gray-900 capitalize">{selectedItem.condition.replace('-', ' ')}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Location</span>
                      <p className="text-gray-900">{selectedItem.location}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Status</span>
                      <p className={selectedItem.is_available ? 'text-green-600' : 'text-red-600'}>
                        {selectedItem.is_available ? 'Available' : 'Claimed'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Views</span>
                      <p className="text-gray-900">{selectedItem.view_count || 0}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Favorites</span>
                      <p className="text-gray-900">{selectedItem.favorite_count || 0}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-500">Posted</span>
                    <p className="text-gray-900">{formatDate(selectedItem.created_at)}</p>
                  </div>

                  {selectedItem.user && (
                    <div className="border-t pt-4">
                      <span className="text-sm font-medium text-gray-500">Owner</span>
                      <div className="flex items-center mt-2">
                        {selectedItem.user.avatar_url ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={selectedItem.user.avatar_url}
                            alt={selectedItem.user.full_name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-teal-600" />
                          </div>
                        )}
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {selectedItem.user.full_name || 'Anonymous User'}
                          </p>
                          <p className="text-sm text-gray-500">{selectedItem.user.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemManagement;