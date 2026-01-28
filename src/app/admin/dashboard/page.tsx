'use client';

import { useState, useEffect } from 'react';
import { Activity, Map, Users, AlertTriangle, CircleGauge, Clock, Shield, Eye, Search, Filter, FileText, Building, User, Calendar, RotateCcw } from "lucide-react";
import ReportDetailsModal from '@/components/report-details-modal';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'stats'>('live');
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: ''
  });
  const [filterTrigger, setFilterTrigger] = useState(0);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');

        if (response.ok) {
          const profileData = await response.json();
          setUserProfile(profileData);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await fetch('/api/admin/stats');

        if (!response.ok) {
          // Try to get error details from response
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = `${errorMessage} - ${errorData.error}`;
            }
          } catch (parseErr) {
            // If we can't parse the error response, use the basic message
            console.warn('Could not parse error response:', parseErr);
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();
        setDashboardData(data);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterTrigger]);

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleApplyFilters = () => {
    setFilterTrigger(prev => prev + 1);
  };

  const handleResetFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    setFilterTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center p-6 bg-zinc-900 border border-zinc-800 rounded-xl max-w-md">
          <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-zinc-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  // Stats data - Updated to match new API response
  const stats = [
    { title: "Total Users", value: dashboardData?.totalUsers?.toString() || "0", icon: Users, color: "text-blue-500" },
    { title: "Total Reports", value: dashboardData?.totalReports?.toString() || "0", icon: FileText, color: "text-orange-500" },
    { title: "Total Units", value: dashboardData?.totalUnits?.toString() || "0", icon: Building, color: "text-purple-500" },
  ];

  // Prepare data for global stats chart - Using data from API
  const globalChartData = [
    { name: 'Safe', value: dashboardData?.safetyStats?.safe || 0, color: '#10B981' },
    { name: 'Unsafe Action', value: dashboardData?.safetyStats?.unsafeAction || 0, color: '#EF4444' },
    { name: 'Unsafe Condition', value: dashboardData?.safetyStats?.unsafeCondition || 0, color: '#F59E0B' },
  ];

  // Prepare data for unit ranking chart (top 5) - Using data from API
  const unitRankingData = dashboardData?.unitRanking || [];

  // Colors for charts
  const COLORS = ['#10B981', '#EF4444', '#F59E0B'];

  return (
    <>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Central Dashboard</h1>
              {!userLoading && userProfile?.full_name && (
                <p className="text-sm text-muted-foreground mt-1">
                  Halo, <span className="font-semibold text-white">{userProfile.full_name}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                <span className="text-sm font-medium">Live Monitoring</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className="p-3 bg-zinc-800 rounded-lg">
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-zinc-800 mb-6">
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'live'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-zinc-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('live')}
            >
              Live Monitor
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-zinc-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('stats')}
            >
              Statistik & Analisa
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'live' ? (
            /* Live Feed Section */
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Live Feed
                </h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Clock className="h-4 w-4" />
                    Live
                  </div>
                </div>
              </div>

              {/* Reports List */}
              <div className="space-y-4">
                {(dashboardData?.recentReports || []).map((report: any) => (
                  <div
                    key={report?.id}
                    className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                    onClick={() => handleViewReport(report)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {report?.imagePath || report?.image_path ? (
                          <div className="relative group">
                            <img
                              src={report.imagePath || report.image_path}
                              alt="Report"
                              className="w-24 h-24 rounded-xl object-cover border border-zinc-700 bg-zinc-800 transition-transform duration-200 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-zinc-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex-grow">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-white truncate">
                            {report?.user?.fullName || 'Officer'} - {report?.unit?.name || 'Unit'}
                          </h3>
                          <span className="text-xs text-zinc-500">
                            {report?.capturedAt ? new Date(report.capturedAt).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 mt-1 truncate">
                          {report?.notes || 'No notes provided'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Map className="h-3 w-3" />
                            {report?.latitude && report?.longitude
                              ? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`
                              : 'Location not available'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            View Details
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {(dashboardData?.recentReports?.length || 0) === 0 && (
                  <div className="text-center py-8 text-zinc-500">
                    No reports available
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Statistics & Analysis Tab */
            <div className="space-y-8">
              {/* Filters */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-500" />
                  Filters
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">End Date</label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-end space-x-2">
                    <button
                      onClick={handleApplyFilters}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                    >
                      <Search className="h-4 w-4" />
                      Apply
                    </button>
                    <button
                      onClick={handleResetFilters}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Global Overview */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <CircleGauge className="h-5 w-5 text-blue-500" />
                  Global Safety Status
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={globalChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {globalChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Reports']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                      <h4 className="font-medium text-green-400 mb-2">Safe Reports</h4>
                      <p className="text-2xl font-bold">{dashboardData?.safetyStats?.safe || 0}</p>
                    </div>

                    <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                      <h4 className="font-medium text-red-400 mb-2">Unsafe Actions</h4>
                      <p className="text-2xl font-bold">{dashboardData?.safetyStats?.unsafeAction || 0}</p>
                    </div>

                    <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                      <h4 className="font-medium text-yellow-400 mb-2">Unsafe Conditions</h4>
                      <p className="text-2xl font-bold">{dashboardData?.safetyStats?.unsafeCondition || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unit Ranking */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-500" />
                  Unit Ranking (Top 5)
                </h3>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={unitRankingData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9CA3AF" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#9CA3AF"
                        width={90}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Bar dataKey="safe" stackId="a" name="Safe" fill="#10B981" />
                      <Bar dataKey="unsafeAction" stackId="a" name="Unsafe Action" fill="#EF4444" />
                      <Bar dataKey="unsafeCondition" stackId="a" name="Unsafe Condition" fill="#F59E0B" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Unit Breakdown */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  Unit Breakdown
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardData?.unitRanking && dashboardData.unitRanking.length > 0 ? (
                    dashboardData.unitRanking.map((unit: any, index: number) => (
                      <div key={index} className="bg-zinc-800/50 rounded-lg border border-zinc-700 p-4">
                        <h4 className="font-medium text-white mb-2">{unit.name}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-green-400">Safe:</span>
                            <span className="font-medium">{unit.safe || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-400">Unsafe Action:</span>
                            <span className="font-medium">{unit.unsafeAction || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-yellow-400">Unsafe Condition:</span>
                            <span className="font-medium">{unit.unsafeCondition || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-zinc-500">
                      No unit statistics available
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Details Modal */}
      {isModalOpen && selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}