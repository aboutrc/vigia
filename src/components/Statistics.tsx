import React, { useState, useEffect } from 'react';
import { BarChart, Clock, MapPin, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Stats {
  totalRecordings: number;
  totalMarkers: number;
  recentActivity: {
    date: string;
    count: number;
  }[];
  markersByRegion: {
    region: string;
    count: number;
  }[];
  categoryBreakdown: {
    category: string;
    count: number;
  }[];
}

const Statistics = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Get total recordings count
      const { count: recordingsCount, error: recordingsError } = await supabase
        .from('recordings')
        .select('*', { count: 'exact', head: true });

      if (recordingsError) throw recordingsError;

      // Get total markers count
      const { count: markersCount, error: markersError } = await supabase
        .from('markers')
        .select('*', { count: 'exact', head: true });

      if (markersError) throw markersError;

      // Get recent activity (last 7 days)
      const { data: recentActivity, error: recentError } = await supabase
        .from('markers')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (recentError) throw recentError;

      // Get marker category breakdown
      const { data: categories, error: categoriesError } = await supabase
        .from('markers')
        .select('category');

      if (categoriesError) throw categoriesError;

      // Process the data
      const categoryBreakdown = categories.reduce((acc, curr) => {
        const existing = acc.find(item => item.category === curr.category);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ category: curr.category, count: 1 });
        }
        return acc;
      }, [] as { category: string; count: number }[]);

      // Group recent activity by day
      const activityByDay = recentActivity.reduce((acc, curr) => {
        const date = new Date(curr.created_at).toLocaleDateString();
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ date, count: 1 });
        }
        return acc;
      }, [] as { date: string; count: number }[]);

      setStats({
        totalRecordings: recordingsCount || 0,
        totalMarkers: markersCount || 0,
        recentActivity: activityByDay,
        markersByRegion: [], // This would require geocoding which we'll skip for now
        categoryBreakdown
      });
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-100 mb-8 flex items-center">
          <BarChart className="mr-2" />
          Community Statistics
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Overview Cards */}
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-100">Total Activity</h2>
              <Users className="text-gray-400" />
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-400">Total Recordings</div>
                <div className="text-2xl font-bold text-gray-100">{stats?.totalRecordings}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Total Markers</div>
                <div className="text-2xl font-bold text-gray-100">{stats?.totalMarkers}</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-100">Recent Activity</h2>
              <Clock className="text-gray-400" />
            </div>
            <div className="space-y-2">
              {stats?.recentActivity.map((activity, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-400">{activity.date}</span>
                  <span className="text-gray-100 font-semibold">{activity.count} reports</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-100">Category Breakdown</h2>
              <MapPin className="text-gray-400" />
            </div>
            <div className="space-y-4">
              {stats?.categoryBreakdown.map((category, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-400 capitalize">{category.category}</span>
                    <span className="text-gray-100">{category.count}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 rounded-full h-2"
                      style={{
                        width: `${(category.count / stats.totalMarkers) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;