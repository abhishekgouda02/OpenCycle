import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  Eye, 
  Heart, 
  MessageSquare,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AnalyticsData {
  userGrowth: { date: string; count: number }[];
  itemGrowth: { date: string; count: number }[];
  categoryDistribution: { category: string; count: number }[];
  topItems: { id: string; title: string; views: number; favorites: number }[];
  topUsers: { id: string; name: string; items: number; views: number }[];
  dailyActivity: { date: string; users: number; items: number; views: number }[];
}

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: [],
    itemGrowth: [],
    categoryDistribution: [],
    topItems: [],
    topUsers: [],
    dailyActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      // Fetch all analytics data in parallel
      const [
        userGrowthData,
        itemGrowthData,
        categoryData,
        topItemsData,
        topUsersData,
        activityData
      ] = await Promise.all([
        fetchUserGrowth(startDate, endDate),
        fetchItemGrowth(startDate, endDate),
        fetchCategoryDistribution(),
        fetchTopItems(),
        fetchTopUsers(),
        fetchDailyActivity(startDate, endDate)
      ]);

      setAnalytics({
        userGrowth: userGrowthData,
        itemGrowth: itemGrowthData,
        categoryDistribution: categoryData,
        topItems: topItemsData,
        topUsers: topUsersData,
        dailyActivity: activityData,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserGrowth = async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at');

    if (error) throw error;

    // Group by date
    const growthMap = new Map<string, number>();
    data?.forEach(user => {
      const date = new Date(user.created_at).toISOString().split('T')[0];
      growthMap.set(date, (growthMap.get(date) || 0) + 1);
    });

    return Array.from(growthMap.entries()).map(([date, count]) => ({ date, count }));
  };

  const fetchItemGrowth = async (startDate: Date, endDate: Date) => {
    const { data, error } = await supabase
      .from('items')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at');

    if (error) throw error;

    // Group by date
    const growthMap = new Map<string, number>();
    data?.forEach(item => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      growthMap.set(date, (growthMap.get(date) || 0) + 1);
    });

    return Array.from(growthMap.entries()).map(([date, count]) => ({ date, count }));
  };

  const fetchCategoryDistribution = async () => {
    const { data, error } = await supabase
      .from('items')
      .select('category')
      .eq('is_available', true);

    if (error) throw error;

    // Count by category
    const categoryMap = new Map<string, number>();
    data?.forEach(item => {
      categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1);
    });

    return Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count }));
  };

  const fetchTopItems = async () => {
    const { data, error } = await supabase
      .from('items_with_stats')
      .select('id, title, view_count, favorite_count')
      .order('view_count', { ascending: false })
      .limit(10);

    if (error) throw error;

    return data?.map(item => ({
      id: item.id,
      title: item.title,
      views: item.view_count || 0,
      favorites: item.favorite_count || 0,
    })) || [];
  };

  const fetchTopUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        items(count),
        items!inner(
          item_views(count)
        )
      `)
      .limit(10);

    if (error) throw error;

    return data?.map(user => ({
      id: user.id,
      name: user.full_name || 'Anonymous',
      items: user.items?.[0]?.count || 0,
      views: user.items?.reduce((total, item) => total + (item.item_views?.[0]?.count || 0), 0) || 0,
    })).sort((a, b) => b.views - a.views) || [];
  };

  const fetchDailyActivity = async (startDate: Date, endDate: Date) => {
    // This would require more complex queries in a real implementation
    // For now, we'll return mock data
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push({
        date: current.toISOString().split('T')[0],
        users: Math.floor(Math.random() * 50) + 10,
        items: Math.floor(Math.random() * 20) + 5,
        views: Math.floor(Math.random() * 200) + 50,
      });
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
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
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Platform insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div className="h-64 flex items-end space-x-2">
            {analytics.userGrowth.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{
                    height: `${Math.max((data.count / Math.max(...analytics.userGrowth.map(d => d.count))) * 200, 4)}px`
                  }}
                ></div>
                <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                  {formatDate(data.date)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Item Growth</h3>
            <Package className="h-5 w-5 text-green-600" />
          </div>
          <div className="h-64 flex items-end space-x-2">
            {analytics.itemGrowth.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-green-500 rounded-t"
                  style={{
                    height: `${Math.max((data.count / Math.max(...analytics.itemGrowth.map(d => d.count))) * 200, 4)}px`
                  }}
                ></div>
                <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                  {formatDate(data.date)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Category Distribution</h3>
          <PieChart className="h-5 w-5 text-purple-600" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {analytics.categoryDistribution.map((category, index) => {
            const colors = [
              'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
              'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
            ];
            return (
              <div key={category.category} className="text-center">
                <div className={`w-16 h-16 ${colors[index % colors.length]} rounded-lg mx-auto mb-2 flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">{category.count}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{category.category}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Items and Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Items</h3>
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </div>
          <div className="space-y-3">
            {analytics.topItems.slice(0, 5).map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 truncate max-w-xs">{item.title}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {item.views}
                      </span>
                      <span className="flex items-center">
                        <Heart className="h-3 w-3 mr-1" />
                        {item.favorites}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Users</h3>
            <Activity className="h-5 w-5 text-teal-600" />
          </div>
          <div className="space-y-3">
            {analytics.topUsers.slice(0, 5).map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-teal-100 text-teal-600 rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Package className="h-3 w-3 mr-1" />
                        {user.items} items
                      </span>
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {user.views} views
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Daily Activity</h3>
          <BarChart3 className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-gray-500">Date</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">New Users</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">New Items</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">Views</th>
              </tr>
            </thead>
            <tbody>
              {analytics.dailyActivity.slice(-7).map((day) => (
                <tr key={day.date} className="border-b border-gray-100">
                  <td className="py-2 text-sm text-gray-900">{formatDate(day.date)}</td>
                  <td className="py-2 text-sm text-gray-900">{day.users}</td>
                  <td className="py-2 text-sm text-gray-900">{day.items}</td>
                  <td className="py-2 text-sm text-gray-900">{day.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;