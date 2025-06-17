import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Package, 
  MessageSquare, 
  Flag, 
  TrendingUp, 
  Eye,
  Heart,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalUsers: number;
  totalItems: number;
  availableItems: number;
  totalMessages: number;
  pendingReports: number;
  totalViews: number;
  totalFavorites: number;
  newUsersToday: number;
  newItemsToday: number;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'item' | 'report';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalItems: 0,
    availableItems: 0,
    totalMessages: 0,
    pendingReports: 0,
    totalViews: 0,
    totalFavorites: 0,
    newUsersToday: 0,
    newItemsToday: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all stats in parallel
      const [
        usersResult,
        itemsResult,
        messagesResult,
        reportsResult,
        viewsResult,
        favoritesResult,
        newUsersResult,
        newItemsResult,
        activityResult
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('items').select('id, is_available', { count: 'exact' }),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id, status', { count: 'exact' }),
        supabase.from('item_views').select('id', { count: 'exact', head: true }),
        supabase.from('favorites').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
        supabase.from('items').select('id', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
        fetchRecentActivity()
      ]);

      const availableItems = itemsResult.data?.filter(item => item.is_available).length || 0;
      const pendingReports = reportsResult.data?.filter(report => report.status === 'pending').length || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalItems: itemsResult.count || 0,
        availableItems,
        totalMessages: messagesResult.count || 0,
        pendingReports,
        totalViews: viewsResult.count || 0,
        totalFavorites: favoritesResult.count || 0,
        newUsersToday: newUsersResult.count || 0,
        newItemsToday: newItemsResult.count || 0,
      });

      setRecentActivity(activityResult);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async (): Promise<RecentActivity[]> => {
    const activities: RecentActivity[] = [];

    try {
      // Recent users
      const { data: recentUsers } = await supabase
        .from('users')
        .select('id, full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      recentUsers?.forEach(user => {
        activities.push({
          id: `user-${user.id}`,
          type: 'user',
          title: 'New User Registration',
          description: `${user.full_name || user.email} joined the platform`,
          timestamp: user.created_at,
        });
      });

      // Recent items
      const { data: recentItems } = await supabase
        .from('items')
        .select('id, title, created_at, users!items_user_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      recentItems?.forEach(item => {
        activities.push({
          id: `item-${item.id}`,
          type: 'item',
          title: 'New Item Posted',
          description: `"${item.title}" by ${item.users?.full_name || 'Anonymous'}`,
          timestamp: item.created_at,
        });
      });

      // Recent reports
      const { data: recentReports } = await supabase
        .from('reports')
        .select('id, reason, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      recentReports?.forEach(report => {
        activities.push({
          id: `report-${report.id}`,
          type: 'report',
          title: 'New Report Submitted',
          description: `Report for ${report.reason}`,
          timestamp: report.created_at,
          status: report.status,
        });
      });

      // Sort by timestamp
      return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'item':
        return <Package className="h-4 w-4 text-green-600" />;
      case 'report':
        return <Flag className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      dismissed: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors] || colors.pending}`}>
        {status}
      </span>
    );
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
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
              <p className="text-sm text-green-600 mt-1">+{stats.newUsersToday} today</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalItems}</p>
              <p className="text-sm text-green-600 mt-1">+{stats.newItemsToday} today</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.availableItems}</p>
              <p className="text-sm text-gray-500 mt-1">{((stats.availableItems / stats.totalItems) * 100).toFixed(1)}% of total</p>
            </div>
            <div className="p-3 bg-teal-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Reports</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingReports}</p>
              <p className="text-sm text-red-600 mt-1">Needs attention</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-pink-100 rounded-lg">
              <Heart className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Favorites</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFavorites.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMessages.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(activity.status)}
                        <span className="text-xs text-gray-500">{formatDate(activity.timestamp)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;