'use client';

import { useState, useEffect } from 'react';
import { X, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { Activity, MapPin, Users, CircleGauge, Clock, Shield, Eye, Search, Filter, FileText, Building, RotateCcw, BarChart3, TrendingUp, AlertTriangle, LayoutDashboard, Image, Trash2, Camera, ExternalLink } from "lucide-react";
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

  // State untuk menampilkan laporan per unit
  const [showUnitReports, setShowUnitReports] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [unitReports, setUnitReports] = useState<any[]>([]);
  const [loadingUnitReports, setLoadingUnitReports] = useState(false);

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

  // Fungsi untuk mengambil laporan berdasarkan unit
  const fetchUnitReports = async (unitId: string) => {
    try {
      setLoadingUnitReports(true);
      console.log('Fetching reports for unitId:', unitId, 'Type:', typeof unitId); // Debug log

      // Pastikan unitId tidak kosong
      if (!unitId) {
        console.error('Unit ID is empty or undefined');
        setUnitReports([]);
        return;
      }

      const params = new URLSearchParams({
        units: unitId,  // Gunakan 'units' sesuai dengan endpoint API
        page: '1',
        limit: '1000' // Ambil semua laporan untuk unit tertentu
      });

      console.log('Request URL:', `/api/admin/reports?${params.toString()}`); // Debug log

      const response = await fetch(`/api/admin/reports?${params.toString()}`);
      console.log('Response status:', response.status); // Debug log

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText); // Debug log
        throw new Error(`Gagal mengambil laporan unit: ${errorText}`);
      }

      const data = await response.json();
      console.log('Received reports:', data.reports?.length || 0, data.reports); // Debug log
      setUnitReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching unit reports:', error);
      setUnitReports([]);
    } finally {
      setLoadingUnitReports(false);
    }
  };

  // Fungsi untuk menghapus laporan
  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini?')) return;

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Gagal menghapus laporan');

      // Update state lokal untuk menghapus laporan
      setUnitReports(prev => prev.filter(report => report.id !== reportId));
      // Juga update data dashboard jika diperlukan
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          recentReports: dashboardData.recentReports?.filter((report: any) => report.id !== reportId)
        });
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Gagal menghapus laporan');
    }
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        
        if (dateRange.startDate) queryParams.append('startDate', dateRange.startDate);
        if (dateRange.endDate) queryParams.append('endDate', dateRange.endDate);

        const url = `/api/admin/stats?${queryParams.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-4 border-amber-500 border-r-transparent mb-4"></div>
          <p className="text-sm sm:text-base font-medium text-slate-600">Menginisialisasi Pusat Operasi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white border border-red-200 rounded-2xl shadow-lg max-w-md w-full">
          <div className="bg-red-100 p-3 rounded-full w-fit mx-auto mb-4">
             <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-slate-900">Kesalahan Koneksi</h2>
          <p className="text-slate-500 mb-6 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-md"
          >
            Hubungkan Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 font-medium">Tidak ada data operasional tersedia.</p>
        </div>
      </div>
    );
  }

  // TECHNICAL COPYWRITING UPDATES
  const stats = [
    { title: "Jumlah Personel", value: dashboardData?.totalUsers?.toString() || "0", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Laporan Masuk", value: dashboardData?.totalReports?.toString() || "0", icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Unit Operasional", value: dashboardData?.totalUnits?.toString() || "0", icon: Building, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  const globalChartData = [
    { name: 'Safe Condition', value: dashboardData?.safetyStats?.safe || 0, color: '#10B981' },
    { name: 'Unsafe Action (UA)', value: dashboardData?.safetyStats?.unsafeAction || 0, color: '#EF4444' },
    { name: 'Unsafe Condition (UC)', value: dashboardData?.safetyStats?.unsafeCondition || 0, color: '#F59E0B' },
  ];

  const unitRankingData = dashboardData?.unitRanking || [];

  return (
    <>
      {/* Main Content - Light Mode Background & Full Width */}
      <div className="flex-1 flex flex-col w-full bg-slate-50 text-slate-900 min-h-screen">
        
        {/* Scrollable Content Container */}
        <div className="w-full px-6 py-8 space-y-8">
          
          {/* Header Section */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                 <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                    <LayoutDashboard className="h-6 w-6 text-amber-600" />
                 </div>
                 <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pusat Komando Operasi</h1>
              </div>
              {!userLoading && (
                <p className="text-sm text-slate-500 font-medium ml-1">
                  Administrator Sistem: <span className="font-bold text-amber-700">{userProfile?.full_name || userProfile?.name || 'Admin'}</span>
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 shadow-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Sistem Aktif</span>
              </div>
            </div>
          </div>

          {/* Stats Grid - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.title}</p>
                    <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`p-4 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="grid grid-cols-2 gap-2 sm:gap-0 sm:flex sm:border-b sm:border-slate-200 bg-slate-100/50 p-1 sm:p-0 rounded-xl sm:rounded-none">
            <button
              className={`px-6 py-3 text-center text-sm font-bold rounded-lg sm:rounded-none sm:rounded-t-lg transition-all ${
                activeTab === 'live'
                  ? 'bg-white sm:bg-transparent text-amber-700 shadow-sm sm:shadow-none sm:border-b-4 border-amber-500'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 sm:hover:bg-transparent'
              }`}
              onClick={() => setActiveTab('live')}
            >
              <div className="flex items-center justify-center gap-2">
                 <Eye className="h-4 w-4" /> Live Monitoring
              </div>
            </button>
            <button
              className={`px-6 py-3 text-center text-sm font-bold rounded-lg sm:rounded-none sm:rounded-t-lg transition-all ${
                activeTab === 'stats'
                  ? 'bg-white sm:bg-transparent text-amber-700 shadow-sm sm:shadow-none sm:border-b-4 border-amber-500'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 sm:hover:bg-transparent'
              }`}
              onClick={() => setActiveTab('stats')}
            >
              <div className="flex items-center justify-center gap-2">
                 <BarChart3 className="h-4 w-4" /> HSE Analytics
              </div>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'live' ? (
            /* Live Feed Section */
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-amber-600" />
                  Real-time Incident Feed
                </h2>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <Clock className="h-3 w-3" />
                  Live Stream
                </div>
              </div>

              {/* Reports List */}
              <div className="p-6 space-y-4">
                {(dashboardData?.recentReports || []).map((report: any) => (
                  <div
                    key={report?.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => handleViewReport(report)}
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {/* Image Thumbnail */}
                      <div className="flex-shrink-0 w-full sm:w-auto">
                        {report?.imagePath ? (
                          <div className="relative w-full sm:w-28 aspect-video sm:aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                            <img
                              src={report.imagePath}
                              alt="Evidence"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-amber-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                              <Eye className="h-8 w-8 text-white drop-shadow-md" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full sm:w-28 h-20 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                            <FileText className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 w-full space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <h3 className="font-bold text-slate-900 text-base truncate">
                            {report?.user?.fullName || 'Officer'} 
                            <span className="text-slate-400 font-normal mx-2">|</span> 
                            <span className="text-amber-700">{report?.unit?.name || 'Unassigned Unit'}</span>
                          </h3>
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            {report?.capturedAt ? new Date(report.capturedAt).toLocaleString('en-GB') : '-'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {report?.notes || 'No description provided.'}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {report?.category && (
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${
                              report.category.color === 'red' || report.category.name.toLowerCase().includes('action')
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : report.category.color === 'yellow' || report.category.name.toLowerCase().includes('condition')
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {report.category.name}
                            </span>
                          )}

                          {report?.location?.name && (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                              <MapPin className="h-3 w-3" />
                              {report.location.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {(dashboardData?.recentReports?.length || 0) === 0 && (
                  <div className="text-center py-12">
                    <div className="bg-slate-50 p-4 rounded-full w-fit mx-auto mb-3">
                        <FileText className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">Tidak ada laporan masuk tersedia.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Statistics & Analysis Tab */
            <div className="space-y-8">
              {/* Filters */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-4">
                  <Filter className="h-5 w-5 text-amber-600" />
                  Parameter Filter Data
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Tanggal Akhir</label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-end gap-3">
                    <button
                      onClick={handleApplyFilters}
                      className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors shadow-md hover:shadow-lg"
                    >
                      <Search className="h-4 w-4" />
                      Terapkan Filter
                    </button>
                    <button
                      onClick={handleResetFilters}
                      className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 font-bold rounded-xl text-sm transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Atur Ulang
                    </button>
                  </div>
                </div>
              </div>

              {/* Global Overview */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-4">
                  <CircleGauge className="h-5 w-5 text-amber-600" />
                  Akumulasi Kepatuhan HSE 
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="h-64 sm:h-80 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={globalChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          innerRadius={60}
                          dataKey="value"
                          paddingAngle={5}
                        >
                          {globalChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [value, 'Entri']}
                          contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#0f172a' }}
                          itemStyle={{ color: '#0f172a' }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            formatter={(value) => <span className="text-slate-600 font-semibold ml-1">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                        <span className="text-3xl font-black text-slate-900">{dashboardData?.totalReports || 0}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase">Total Entri</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center hover:shadow-sm transition-shadow">
                      <div>
                          <h4 className="font-bold text-emerald-800 text-sm">Safe Condition</h4>
                          <p className="text-xs text-emerald-600 mt-1">Compliant with HSE standards</p>
                      </div>
                      <p className="text-3xl font-black text-emerald-600">{dashboardData?.safetyStats?.safe || 0}</p>
                    </div>

                    <div className="p-5 bg-red-50 rounded-xl border border-red-100 flex justify-between items-center hover:shadow-sm transition-shadow">
                      <div>
                          <h4 className="font-bold text-red-800 text-sm">Unsafe Action (UA)</h4>
                          <p className="text-xs text-red-600 mt-1">Violation of safety procedures</p>
                      </div>
                      <p className="text-3xl font-black text-red-600">{dashboardData?.safetyStats?.unsafeAction || 0}</p>
                    </div>

                    <div className="p-5 bg-amber-50 rounded-xl border border-amber-100 flex justify-between items-center hover:shadow-sm transition-shadow">
                      <div>
                          <h4 className="font-bold text-amber-800 text-sm">Unsafe Condition (UC)</h4>
                          <p className="text-xs text-amber-600 mt-1">Hazardous environment/equipment</p>
                      </div>
                      <p className="text-3xl font-black text-amber-600">{dashboardData?.safetyStats?.unsafeCondition || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unit Ranking */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-4">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                  Top Performing Units (HSE Compliance)
                </h3>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={unitRankingData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#94a3b8" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#64748b"
                        width={120}
                        tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }}
                        interval={0}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                        cursor={{fill: '#f1f5f9'}}
                      />
                      <Legend wrapperStyle={{ paddingTop: '10px' }} />
                      <Bar dataKey="safe" stackId="a" name="Safe" fill="#10B981" barSize={24} radius={[0, 4, 4, 0]} />
                      <Bar dataKey="unsafeAction" stackId="a" name="Unsafe Action" fill="#EF4444" barSize={24} radius={[0, 4, 4, 0]} />
                      <Bar dataKey="unsafeCondition" stackId="a" name="Unsafe Condition" fill="#F59E0B" barSize={24} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Unit Breakdown */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-4">
                  <Shield className="h-5 w-5 text-amber-600" />
                  Distribusi Kinerja Unit
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardData?.unitRanking && dashboardData.unitRanking.length > 0 ? (
                    dashboardData.unitRanking.map((unit: any, index: number) => {
                      const unitChartData = [
                        { name: 'Safe', value: unit.safe || 0, color: '#10B981' },
                        { name: 'Unsafe Action', value: unit.unsafeAction || 0, color: '#EF4444' },
                        { name: 'Unsafe Condition', value: unit.unsafeCondition || 0, color: '#F59E0B' },
                      ].filter(item => item.value > 0);

                      return (
                        <div
                          key={index}
                          className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col hover:border-amber-200 transition-colors cursor-pointer hover:shadow-md"
                          onClick={() => {
                            console.log('Clicked unit:', unit); // Debug log
                            setSelectedUnit(unit);
                            fetchUnitReports(unit.id);
                            setShowUnitReports(true);
                          }}
                        >
                          <h4 className="font-bold text-slate-900 mb-3 text-center text-base truncate" title={unit.name}>{unit.name}</h4>
                          
                          <div className="h-48 flex items-center justify-center relative">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={unitChartData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={65}
                                  paddingAngle={4}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  {unitChartData.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value) => [value, 'Entri']}
                                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#0f172a' }}
                                  itemStyle={{ color: '#0f172a' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
                               <span className="text-2xl font-black text-slate-800">{unit.total || 0}</span>
                               <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                            </div>
                          </div>

                          <div className="space-y-3 mt-2 flex-grow border-t border-slate-200 pt-3">
                            {unitChartData.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                                  <span className="text-slate-600 font-medium truncate max-w-[120px]">{item.name}</span>
                                </div>
                                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                      Tidak ada data analitik unit tersedia.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl scale-100 transform transition-all"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900">Detail Laporan</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto flex-1 p-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Photo Evidence */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-500" />
                    Bukti Foto
                  </h4>
                  <div className="bg-slate-100 border border-slate-200 rounded-2xl w-full h-64 flex items-center justify-center overflow-hidden shadow-inner">
                    {selectedReport.imagePath ? (
                      <img
                        src={selectedReport.imagePath}
                        alt="Bukti laporan"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.parentElement?.querySelector('.fallback-content');
                          if (fallback) fallback.setAttribute('style', 'display: flex');
                        }}
                      />
                    ) : (
                      <div className="fallback-content w-full h-full flex flex-col items-center justify-center text-slate-400">
                        <Camera className="w-12 h-12 mb-2" />
                        <p className="font-bold">Foto Tidak Tersedia</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Report Info */}
                <div className="space-y-4">
                  {/* Officer */}
                  <div className="bg-slate-50 border border-slate-100 hover:border-amber-300 rounded-xl p-3 transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Petugas</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{selectedReport.user?.fullName || 'N/A'}</p>
                  </div>

                  {/* Unit */}
                  <div className="bg-slate-50 border border-slate-100 hover:border-amber-300 rounded-xl p-3 transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{selectedReport.unit?.name || 'N/A'}</p>
                  </div>

                  {/* Category */}
                  {selectedReport.category && (
                    <div className="bg-slate-50 border border-slate-100 hover:border-amber-300 rounded-xl p-3 transition-colors">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</p>
                      <div className="mt-2">
                        <span className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          selectedReport.category.color === 'red' || selectedReport.category.name.toLowerCase().includes('action')
                            ? 'bg-red-100 text-red-600 border border-red-200'
                            : selectedReport.category.color === 'yellow' || selectedReport.category.name.toLowerCase().includes('condition')
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {selectedReport.category.name}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  <div className="bg-slate-50 border border-slate-100 hover:border-amber-300 rounded-xl p-3 transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lokasi</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{selectedReport.location?.name || 'N/A'}</p>
                  </div>

                  {/* Coordinates */}
                  <div className="bg-slate-50 border border-slate-100 hover:border-amber-300 rounded-xl p-3 flex items-start gap-3 transition-colors">
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><MapPin className="w-4 h-4" /></div>
                    <div>
                      {selectedReport.latitude && selectedReport.longitude ? (
                        <>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Koordinat</p>
                          <p className="text-sm font-bold text-slate-800 mt-1">
                            {selectedReport.latitude.toFixed(6)}, {selectedReport.longitude.toFixed(6)}
                          </p>
                          <a
                            href={`https://www.google.com/maps?q=${selectedReport.latitude},${selectedReport.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-black text-amber-600 hover:underline flex items-center gap-1 mt-1 uppercase"
                          >
                            Buka di Maps <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      ) : (
                        <p className="text-sm font-bold text-slate-400">Lokasi tidak tersedia</p>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="bg-slate-50 border border-slate-100 hover:border-amber-300 rounded-xl p-3 transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">
                      {new Date(selectedReport.capturedAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="mt-6">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">Deskripsi</h4>
                <div className="bg-slate-50 border border-slate-100 border-l-4 border-l-amber-500 rounded-xl p-4 min-h-[100px] shadow-sm">
                  <p className="text-slate-600 font-medium italic leading-relaxed">
                    "{selectedReport.notes || 'Tidak ada deskripsi untuk laporan ini.'}"
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal untuk menampilkan laporan per unit */}
      {showUnitReports && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-6xl w-full shadow-2xl scale-100 transform transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-amber-600" />
                  Laporan untuk Unit: {selectedUnit?.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1">Daftar laporan keamanan untuk unit {selectedUnit?.name}</p>
              </div>
              <button
                onClick={() => setShowUnitReports(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingUnitReports ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500 border-r-transparent"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Bukti</th>
                      <th className="px-6 py-4">Petugas</th>
                      <th className="px-6 py-4">Unit</th>
                      <th className="px-6 py-4">Kategori</th>
                      <th className="px-6 py-4">Lokasi</th>
                      <th className="px-6 py-4">Tanggal/Waktu</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {unitReports.map((report: any) => (
                      <tr key={report.id} className="hover:bg-amber-50/30 transition-colors group">
                        <td className="px-6 py-4 w-24">
                          <div className="h-14 w-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative shadow-sm">
                            {report.imagePath ? (
                              <img src={report.imagePath} alt="Evd" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-slate-400"><Image size={20} /></div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{report.user?.fullName || 'Unknown'}</div>
                          <div className="text-xs font-medium text-slate-500 mt-0.5">{report.unit?.name || 'Unknown Unit'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-xs">
                            {report.unit?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {report.category ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider border ${
                              report.category.color === 'red' || report.category.name.toLowerCase().includes('action')
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : report.category.color === 'yellow' || report.category.name.toLowerCase().includes('condition')
                                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            }`}>
                              {report.category.name}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider border bg-slate-100 text-slate-500 border-slate-200">
                              N/A
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-xs">
                            {report.location?.name || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{new Date(report.capturedAt).toLocaleDateString('en-GB')}</span>
                            <span className="text-xs text-slate-500 mt-0.5">{new Date(report.capturedAt).toLocaleTimeString('en-GB')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering parent row click
                                setSelectedReport(report);
                                setIsModalOpen(true);
                              }}
                              className="p-2 bg-white border border-slate-200 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg text-slate-400 transition-all shadow-sm"
                            >
                              <Eye size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Total: {unitReports.length} laporan
              </span>
              <button
                onClick={() => {
                  // Fungsi export ke Excel
                  console.log('Export button clicked. Unit reports count:', unitReports.length); // Debug log
                  if (unitReports.length === 0) {
                    alert("Tidak ada data laporan untuk diekspor.");
                    return;
                  }

                  const exportData = unitReports.map(report => ({
                    "Tanggal": new Date(report.capturedAt).toLocaleDateString('id-ID'),
                    "Waktu": new Date(report.capturedAt).toLocaleTimeString('id-ID'),
                    "Nama Petugas": report.user?.fullName || 'N/A',
                    "Unit": report.unit?.name || 'N/A',
                    "Kategori": report.category?.name || 'N/A',
                    "Lokasi": report.location?.name || '-',
                    "Catatan": report.notes || '-',
                    "Link Foto": report.imagePath || '-'
                  }));

                  console.log('Export data prepared:', exportData); // Debug log

                  const ws = XLSX.utils.json_to_sheet(exportData);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Laporan Unit");
                  XLSX.writeFile(wb, `Laporan_Unit_${selectedUnit?.name}_${new Date().toISOString().slice(0,10)}.xlsx`);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors shadow-md"
              >
                <Download className="h-4 w-4" />
                <span>Ekspor ke Excel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
