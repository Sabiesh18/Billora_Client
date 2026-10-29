import React, { useState, useEffect } from 'react';
import { reportApi } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import { DashboardMetrics, SalesReport } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBolt,
  faUtensils,
  faArrowsRotate,
  faCoins,
  faReceipt,
  faHourglassHalf,
  faChair,
  faFire,
  faCreditCard,
  faMoneyBillWave,
  faMobileScreenButton,
  faTags,
  faChartColumn,
  faTable,
  faLayerGroup,
  faArrowTrendUp,
  faCalendarDay,
  faAward,
  faCheckCircle,
  faCircleDot,
} from '@fortawesome/free-solid-svg-icons';

interface DashboardPageProps {
  setActivePage: (page: string) => void;
}

type ViewMode = 'charts' | 'tables' | 'split';

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActivePage }) => {
  const { settings } = useSettings();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trendReport, setTrendReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Global view switcher: 'charts' | 'tables' | 'split'
  const [globalView, setGlobalView] = useState<ViewMode>('charts');

  // Per-card view toggles to allow mixing charts and tables
  const [cardViews, setCardViews] = useState<{
    trend?: 'chart' | 'table';
    topItems?: 'chart' | 'table';
    payment?: 'chart' | 'table';
    occupancy?: 'chart' | 'table';
  }>({});

  // Hover state for interactive SVG charts
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null);
  const [hoveredPaymentIdx, setHoveredPaymentIdx] = useState<number | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6); // 7 days window (including today)
      const fromDateStr = start.toISOString().split('T')[0];
      const toDateStr = end.toISOString().split('T')[0];

      const [metricsData, trendData] = await Promise.all([
        reportApi.getDashboardMetrics(),
        reportApi.getSalesReport({ fromDate: fromDateStr, toDate: toDateStr }).catch(() => null),
      ]);

      setMetrics(metricsData);
      setTrendReport(trendData);
    } catch (err) {
      console.error('Error fetching dashboard metrics and trend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds for real-time POS updates
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper to determine effective card view
  const getCardView = (cardKey: 'trend' | 'topItems' | 'payment' | 'occupancy'): 'chart' | 'table' => {
    if (globalView === 'split') return 'chart'; // In split mode both or specialized layout is used
    if (cardViews[cardKey]) return cardViews[cardKey]!;
    return globalView === 'tables' ? 'table' : 'chart';
  };

  const toggleCardView = (cardKey: 'trend' | 'topItems' | 'payment' | 'occupancy') => {
    const current = getCardView(cardKey);
    setCardViews((prev) => ({
      ...prev,
      [cardKey]: current === 'chart' ? 'table' : 'chart',
    }));
  };

  const handleGlobalViewChange = (mode: ViewMode) => {
    setGlobalView(mode);
    setCardViews({}); // Reset individual overrides so all cards follow global mode
  };

  // Safe numerical values
  const currency = settings.currency_symbol || '₹';
  const todayRevenue = Number(metrics?.todaySales || 0);
  const todayOrders = Number(metrics?.todayOrders || 0);
  const activeBills = Number(metrics?.activeBills || 0);
  const occupancyRate = Number(metrics?.occupancyRate || 0);
  const totalTables = Number(metrics?.totalTables || 0);
  const occupiedTables = Number(metrics?.occupiedTables || 0);
  const availableTables = Math.max(0, totalTables - occupiedTables);

  // 7-Day Trend calculations
  const trendDays = trendReport?.dailyTrend || [];
  const maxTrendRevenue = Math.max(...trendDays.map((d) => Number(d.netRevenue || 0)), 100);
  const totalTrendRevenue = trendDays.reduce((acc, d) => acc + Number(d.netRevenue || 0), 0);
  const totalTrendOrders = trendDays.reduce((acc, d) => acc + Number(d.ordersCount || 0), 0);

  // Top Selling Items calculations
  const topItems = metrics?.topSellingItems || [];
  const maxItemQty = Math.max(...topItems.map((i) => Number(i.totalQty || 0)), 1);
  const totalTopRevenue = topItems.reduce((acc, i) => acc + Number(i.totalRevenue || 0), 0);

  // Payment Breakdown calculations & SVG Donut Chart angles
  const paymentBreakdown = metrics?.paymentBreakdown || [];
  const totalPaymentAmount = paymentBreakdown.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const totalTransactions = paymentBreakdown.reduce((acc, p) => acc + Number(p.count || 0), 0);

  const paymentColors: Record<string, { stroke: string; bg: string; text: string; lightBg: string }> = {
    CASH: { stroke: '#10B981', bg: 'bg-emerald-500', text: 'text-emerald-700', lightBg: 'bg-emerald-50 border-emerald-200' },
    UPI: { stroke: '#F67009', bg: 'bg-[#F67009]', text: 'text-[#F67009]', lightBg: 'bg-[#FFF0E6] border-[#FED7AA]' },
    CARD: { stroke: '#3B82F6', bg: 'bg-blue-500', text: 'text-blue-700', lightBg: 'bg-blue-50 border-blue-200' },
    OTHER: { stroke: '#8B5CF6', bg: 'bg-purple-500', text: 'text-purple-700', lightBg: 'bg-purple-50 border-purple-200' },
  };

  // SVG Donut calculation
  const donutRadius = 60;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let accumulatedPercent = 0;

  const donutSlices = paymentBreakdown.map((pm) => {
    const amount = Number(pm.amount || 0);
    const percent = totalPaymentAmount > 0 ? (amount / totalPaymentAmount) * 100 : 0;
    const strokeDasharray = `${(percent / 100) * donutCircumference} ${donutCircumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * donutCircumference);
    accumulatedPercent += percent;

    const colorConfig = paymentColors[pm.paymentMode.toUpperCase()] || paymentColors.OTHER;

    return {
      ...pm,
      percent,
      strokeDasharray,
      strokeDashoffset,
      color: colorConfig.stroke,
      config: colorConfig,
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-10">
      {/* Top Banner & Quick Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#F3E5DC] p-5 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F67009] animate-pulse"></span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Billing Operations & Analytics</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time financial revenue metrics, order velocity, table utilization & analytical charts
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActivePage('pos')}
            className="bg-gradient-to-r from-[#F67009] to-[#F88D3A] hover:opacity-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faBolt} />
            <span>New POS Bill</span>
          </button>
          <button
            onClick={() => setActivePage('tables')}
            className="bg-[#FFF9F6] hover:bg-[#FFF0E6] text-slate-700 hover:text-[#F67009] text-xs font-bold px-3.5 py-2.5 rounded-xl border border-[#F3E5DC] transition-colors flex items-center gap-1.5"
          >
            <FontAwesomeIcon icon={faUtensils} className="text-[#F67009]" />
            <span>Table Layout</span>
          </button>
          <button
            onClick={fetchDashboardData}
            title="Refresh Metrics"
            className="bg-[#FFF9F6] hover:bg-[#FFF0E6] text-slate-700 hover:text-[#F67009] text-xs font-bold px-3 py-2.5 rounded-xl border border-[#F3E5DC] transition-colors flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faArrowsRotate} className={loading ? 'animate-spin text-[#F67009]' : ''} />
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Settled Revenue */}
        <div className="bg-white border border-[#F3E5DC] p-5 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Today's Revenue</span>
            <span className="w-10 h-10 flex items-center justify-center bg-[#FFF0E6] text-[#F67009] rounded-xl border border-[#FED7AA]">
              <FontAwesomeIcon icon={faCoins} className="text-base" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {currency} {todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <FontAwesomeIcon icon={faCheckCircle} className="text-[10px]" />
              <span>Audited Settled Collections</span>
            </p>
          </div>
        </div>

        {/* Orders Completed */}
        <div className="bg-white border border-[#F3E5DC] p-5 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Settled Orders</span>
            <span className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <FontAwesomeIcon icon={faReceipt} className="text-base" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{todayOrders}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Paid customer bills generated</p>
          </div>
        </div>

        {/* Active Open Bills */}
        <div className="bg-white border border-[#F3E5DC] p-5 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Active Open Bills</span>
            <span className="w-10 h-10 flex items-center justify-center bg-[#FFF0E6] text-[#F88D3A] rounded-xl border border-[#FED7AA]">
              <FontAwesomeIcon icon={faHourglassHalf} className="text-base" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-[#F67009] tracking-tight">{activeBills}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Unsettled live dining tables</p>
          </div>
        </div>

        {/* Table Occupancy Rate */}
        <div className="bg-white border border-[#F3E5DC] p-5 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Occupancy Rate</span>
            <span className="w-10 h-10 flex items-center justify-center bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <FontAwesomeIcon icon={faChair} className="text-base" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{occupancyRate}%</h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {occupiedTables} of {totalTables} dining tables occupied
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Section Header & Global View Mode Switcher */}
      <div className="bg-white border border-[#F3E5DC] p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faArrowTrendUp} className="text-[#F67009]" />
            <span>Operational & Financial Analytics</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Switch between graphical visualizations and detailed tables, or view both side-by-side
          </p>
        </div>

        {/* View Mode Segmented Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FFF9F6] border border-[#F3E5DC] rounded-xl select-none">
          <button
            type="button"
            onClick={() => handleGlobalViewChange('charts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              globalView === 'charts'
                ? 'bg-gradient-to-r from-[#F67009] to-[#F88D3A] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#F67009] hover:bg-[#FFF0E6]'
            }`}
          >
            <FontAwesomeIcon icon={faChartColumn} />
            <span>Charts View</span>
          </button>

          <button
            type="button"
            onClick={() => handleGlobalViewChange('tables')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              globalView === 'tables'
                ? 'bg-gradient-to-r from-[#F67009] to-[#F88D3A] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#F67009] hover:bg-[#FFF0E6]'
            }`}
          >
            <FontAwesomeIcon icon={faTable} />
            <span>Tables View</span>
          </button>

          <button
            type="button"
            onClick={() => handleGlobalViewChange('split')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              globalView === 'split'
                ? 'bg-gradient-to-r from-[#F67009] to-[#F88D3A] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#F67009] hover:bg-[#FFF0E6]'
            }`}
          >
            <FontAwesomeIcon icon={faLayerGroup} />
            <span>Split View</span>
          </button>
        </div>
      </div>

      {/* Analytics Section 1: 7-Day Revenue & Sales Trend */}
      <div className="bg-white border border-[#F3E5DC] p-5 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F3E5DC]">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarDay} className="text-[#F67009]" />
              <span>7-Day Revenue & Order Velocity Trend</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily revenue comparison ({currency} {totalTrendRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })} total across {totalTrendOrders} orders)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-400">View:</span>
            <div className="inline-flex rounded-lg border border-[#F3E5DC] bg-[#FFF9F6] p-0.5">
              <button
                type="button"
                onClick={() => toggleCardView('trend')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${
                  getCardView('trend') === 'chart'
                    ? 'bg-white text-[#F67009] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FontAwesomeIcon icon={faChartColumn} />
                <span>Chart</span>
              </button>
              <button
                type="button"
                onClick={() => toggleCardView('trend')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${
                  getCardView('trend') === 'table'
                    ? 'bg-white text-[#F67009] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FontAwesomeIcon icon={faTable} />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Render: Chart or Table (or Split) */}
        {globalView === 'split' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {renderTrendChart()}
            {renderTrendTable()}
          </div>
        ) : getCardView('trend') === 'chart' ? (
          renderTrendChart()
        ) : (
          renderTrendTable()
        )}
      </div>

      {/* Analytics Section 2 & 3: Two-Column Insights (Top Items & Payment Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Dishes Today */}
        <div className="bg-white border border-[#F3E5DC] p-5 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F3E5DC]">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FontAwesomeIcon icon={faFire} className="text-[#F67009]" />
                  <span>Top Selling Dishes Today</span>
                </h3>
                <span className="text-xs text-slate-400">Portions ordered & revenue</span>
              </div>

              <div className="inline-flex rounded-lg border border-[#F3E5DC] bg-[#FFF9F6] p-0.5">
                <button
                  type="button"
                  onClick={() => toggleCardView('topItems')}
                  className={`px-2 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
                    getCardView('topItems') === 'chart'
                      ? 'bg-white text-[#F67009] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FontAwesomeIcon icon={faChartColumn} />
                  <span>Chart</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleCardView('topItems')}
                  className={`px-2 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
                    getCardView('topItems') === 'table'
                      ? 'bg-white text-[#F67009] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FontAwesomeIcon icon={faTable} />
                  <span>Table</span>
                </button>
              </div>
            </div>

            {getCardView('topItems') === 'chart' || globalView === 'split'
              ? renderTopItemsChart()
              : renderTopItemsTable()}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white border border-[#F3E5DC] p-5 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F3E5DC]">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FontAwesomeIcon icon={faCreditCard} className="text-[#F67009]" />
                  <span>Payment Channels Split</span>
                </h3>
                <span className="text-xs text-slate-400">Collection distribution</span>
              </div>

              <div className="inline-flex rounded-lg border border-[#F3E5DC] bg-[#FFF9F6] p-0.5">
                <button
                  type="button"
                  onClick={() => toggleCardView('payment')}
                  className={`px-2 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
                    getCardView('payment') === 'chart'
                      ? 'bg-white text-[#F67009] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FontAwesomeIcon icon={faChartColumn} />
                  <span>Chart</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleCardView('payment')}
                  className={`px-2 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
                    getCardView('payment') === 'table'
                      ? 'bg-white text-[#F67009] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FontAwesomeIcon icon={faTable} />
                  <span>Table</span>
                </button>
              </div>
            </div>

            {getCardView('payment') === 'chart' || globalView === 'split'
              ? renderPaymentChart()
              : renderPaymentTable()}
          </div>
        </div>
      </div>

      {/* Analytics Section 4: Table Occupancy & Real-Time Capacity Gauge */}
      <div className="bg-white border border-[#F3E5DC] p-5 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F3E5DC]">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FontAwesomeIcon icon={faChair} className="text-[#F67009]" />
              <span>Table Floor Occupancy & Real-Time Capacity</span>
            </h3>
            <span className="text-xs text-slate-400">Dining table utilization status</span>
          </div>

          <div className="inline-flex rounded-lg border border-[#F3E5DC] bg-[#FFF9F6] p-0.5">
            <button
              type="button"
              onClick={() => toggleCardView('occupancy')}
              className={`px-2 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
                getCardView('occupancy') === 'chart'
                  ? 'bg-white text-[#F67009] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FontAwesomeIcon icon={faChartColumn} />
              <span>Gauge</span>
            </button>
            <button
              type="button"
              onClick={() => toggleCardView('occupancy')}
              className={`px-2 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
                getCardView('occupancy') === 'table'
                  ? 'bg-white text-[#F67009] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FontAwesomeIcon icon={faTable} />
              <span>Table</span>
            </button>
          </div>
        </div>

        {globalView === 'split' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {renderOccupancyChart()}
            {renderOccupancyTable()}
          </div>
        ) : getCardView('occupancy') === 'chart' ? (
          renderOccupancyChart()
        ) : (
          renderOccupancyTable()
        )}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // SUB-RENDERERS FOR CHARTS AND TABLES
  // ---------------------------------------------------------------------------

  function renderTrendChart() {
    if (trendDays.length === 0) {
      return (
        <div className="text-center py-12 text-slate-400 text-xs">
          No trend transactions recorded yet. Take orders on POS to populate trend visualization!
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* SVG Bar Chart with Interactive Bars & Y-Guide Lines */}
        <div className="relative h-64 w-full bg-[#FFF9F6] border border-[#F3E5DC] rounded-2xl p-4 flex flex-col justify-between select-none">
          {/* Y-Axis Guide Lines */}
          <div className="absolute inset-x-4 top-4 bottom-10 flex flex-col justify-between pointer-events-none opacity-40">
            <div className="border-b border-dashed border-[#F67009]/40 flex justify-end">
              <span className="text-[10px] font-mono text-slate-500 bg-[#FFF9F6] px-1">
                {currency} {maxTrendRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="border-b border-dashed border-slate-300 flex justify-end">
              <span className="text-[10px] font-mono text-slate-400 bg-[#FFF9F6] px-1">
                {currency} {(maxTrendRevenue / 2).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="border-b border-slate-300"></div>
          </div>

          {/* Interactive Bars Container */}
          <div className="relative z-10 flex-1 flex items-end justify-around gap-2 px-2 pb-2">
            {trendDays.map((d, idx) => {
              const rev = Number(d.netRevenue || 0);
              const heightPercent = Math.max(6, Math.min(100, (rev / maxTrendRevenue) * 100));
              const isHovered = hoveredTrendIdx === idx;
              const dateObj = new Date(d.reportDate);
              const dayLabel = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
              const dateLabel = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  onMouseEnter={() => setHoveredTrendIdx(idx)}
                  onMouseLeave={() => setHoveredTrendIdx(null)}
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute -top-10 z-30 bg-slate-900 text-white text-[11px] font-semibold py-1 px-2.5 rounded-lg shadow-lg pointer-events-none whitespace-nowrap animate-in fade-in duration-150">
                      <span className="text-[#F88D3A] font-bold">{dayLabel}, {dateLabel}:</span> {currency} {rev.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({d.ordersCount} orders)
                    </div>
                  )}

                  {/* Revenue Value Badge above bar if active */}
                  {rev > 0 && (
                    <span className="text-[10px] font-bold text-[#F67009] mb-1 truncate">
                      {currency}{rev >= 1000 ? `${(rev / 1000).toFixed(1)}k` : rev.toFixed(0)}
                    </span>
                  )}

                  {/* Bar Element */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 shadow-sm ${
                      rev > 0
                        ? isHovered
                          ? 'bg-gradient-to-t from-[#ea580c] to-[#F67009] ring-2 ring-[#F88D3A]'
                          : 'bg-gradient-to-t from-[#F67009] to-[#F88D3A] hover:opacity-90'
                        : 'bg-slate-200/80 h-2'
                    }`}
                  />

                  {/* Day & Date Labels */}
                  <div className="mt-2 text-center">
                    <p className={`text-[11px] font-bold ${isHovered ? 'text-[#F67009]' : 'text-slate-700'}`}>
                      {dayLabel}
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono">{dateLabel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart Summary Footnote */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-gradient-to-r from-[#F67009] to-[#F88D3A]"></span>
            <span>Net Audited Daily Revenue</span>
          </div>
          <span className="font-semibold text-slate-700">
            Average: {currency} {(totalTrendRevenue / Math.max(1, trendDays.length)).toLocaleString('en-IN', { minimumFractionDigits: 2 })} / day
          </span>
        </div>
      </div>
    );
  }

  function renderTrendTable() {
    if (trendDays.length === 0) {
      return (
        <div className="text-center py-8 text-slate-400 text-xs">
          No records found for the past 7 days.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-2xl border border-[#F3E5DC]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FFF9F6] border-b border-[#F3E5DC] text-slate-700 uppercase font-bold text-[10px] tracking-wider">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3 text-center">Orders</th>
              <th className="p-3 text-right">Gross Subtotal</th>
              <th className="p-3 text-right">Tax</th>
              <th className="p-3 text-right">Net Revenue</th>
              <th className="p-3 text-center">Velocity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3E5DC] bg-white">
            {trendDays.map((d, idx) => {
              const rev = Number(d.netRevenue || 0);
              const dateObj = new Date(d.reportDate);
              const formattedDate = dateObj.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });

              return (
                <tr key={idx} className="hover:bg-[#FFF9F6]/60 transition-colors">
                  <td className="p-3 font-semibold text-slate-800">{formattedDate}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-[#FFF0E6] text-[#F67009] font-bold text-[11px] border border-[#FED7AA]">
                      {d.ordersCount}
                    </span>
                  </td>
                  <td className="p-3 text-right text-slate-600">
                    {currency} {Number(d.subTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-slate-500">
                    {currency} {Number(d.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right font-bold text-[#F67009]">
                    {currency} {rev.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-center">
                    <div className="w-16 bg-slate-100 rounded-full h-1.5 mx-auto overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, (rev / maxTrendRevenue) * 100)}%` }}
                        className="bg-gradient-to-r from-[#F67009] to-[#F88D3A] h-full rounded-full"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-[#FFF9F6] border-t-2 border-[#F3E5DC] font-bold text-slate-800">
            <tr>
              <td className="p-3">7-Day Total</td>
              <td className="p-3 text-center text-[#F67009]">{totalTrendOrders}</td>
              <td className="p-3 text-right text-slate-600" colSpan={2}>
                Sum Total:
              </td>
              <td className="p-3 text-right text-[#F67009]">
                {currency} {totalTrendRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  function renderTopItemsChart() {
    if (topItems.length === 0) {
      return (
        <div className="text-center py-10 text-slate-400 text-xs">
          No menu items sold yet today. Start orders from POS Billing!
        </div>
      );
    }

    return (
      <div className="space-y-3.5">
        {topItems.map((item, idx) => {
          const qty = Number(item.totalQty || 0);
          const rev = Number(item.totalRevenue || 0);
          const percentWidth = Math.max(12, Math.min(100, (qty / maxItemQty) * 100));

          return (
            <div key={idx} className="p-3 rounded-2xl bg-[#FFF9F6] border border-[#F3E5DC] transition-all hover:border-[#FED7AA]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                      idx === 0
                        ? 'bg-[#F67009] text-white shadow-xs'
                        : idx === 1
                        ? 'bg-[#F88D3A] text-white'
                        : 'bg-white text-slate-700 border border-[#F3E5DC]'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-800">{item.itemName}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#F67009]">
                    {currency} {rev.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Graphical Proportion Bar */}
              <div className="w-full bg-white rounded-full h-2.5 overflow-hidden border border-[#F3E5DC] flex items-center">
                <div
                  style={{ width: `${percentWidth}%` }}
                  className="bg-gradient-to-r from-[#F67009] to-[#F88D3A] h-full rounded-full transition-all duration-500"
                />
              </div>

              <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500 font-medium">
                <span>{qty} portions ordered</span>
                <span>{totalTopRevenue > 0 ? ((rev / totalTopRevenue) * 100).toFixed(1) : 0}% share</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderTopItemsTable() {
    if (topItems.length === 0) {
      return (
        <div className="text-center py-8 text-slate-400 text-xs">
          No item sales recorded today yet.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-2xl border border-[#F3E5DC]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FFF9F6] border-b border-[#F3E5DC] text-slate-700 uppercase font-bold text-[10px] tracking-wider">
            <tr>
              <th className="p-3 text-center">#</th>
              <th className="p-3">Dish / Item Name</th>
              <th className="p-3 text-center">Portions</th>
              <th className="p-3 text-right">Revenue</th>
              <th className="p-3 text-right">Avg / Item</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3E5DC] bg-white">
            {topItems.map((item, idx) => {
              const qty = Number(item.totalQty || 0);
              const rev = Number(item.totalRevenue || 0);
              const avg = qty > 0 ? rev / qty : 0;

              return (
                <tr key={idx} className="hover:bg-[#FFF9F6]/60 transition-colors">
                  <td className="p-3 text-center font-bold text-slate-400">#{idx + 1}</td>
                  <td className="p-3 font-bold text-slate-800">{item.itemName}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-[#FFF0E6] text-[#F67009] font-bold text-[11px] border border-[#FED7AA]">
                      {qty}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-[#F67009]">
                    {currency} {rev.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-slate-500">
                    {currency} {avg.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function renderPaymentChart() {
    if (paymentBreakdown.length === 0) {
      return (
        <div className="text-center py-10 text-slate-400 text-xs">
          No settled payments today. Settle bills to view payment distribution!
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* SVG Donut Visualizer */}
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 bg-[#FFF9F6] border border-[#F3E5DC] rounded-2xl p-4">
          <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              {/* Background Ring */}
              <circle
                cx="80"
                cy="80"
                r={donutRadius}
                fill="none"
                stroke="#E5D7CE"
                strokeWidth="16"
              />
              {/* Slices */}
              {donutSlices.map((slice, idx) => (
                <circle
                  key={idx}
                  cx="80"
                  cy="80"
                  r={donutRadius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={hoveredPaymentIdx === idx ? '20' : '16'}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredPaymentIdx(idx)}
                  onMouseLeave={() => setHoveredPaymentIdx(null)}
                />
              ))}
            </svg>

            {/* Donut Center Metrics */}
            <div className="absolute text-center select-none pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
              <p className="text-sm font-black text-slate-900 leading-tight">
                {currency}{totalPaymentAmount.toFixed(0)}
              </p>
              <span className="text-[9px] text-[#F67009] font-bold">{totalTransactions} bills</span>
            </div>
          </div>

          {/* Slices Legend Badges */}
          <div className="flex-1 space-y-2 w-full">
            {donutSlices.map((slice, idx) => {
              const isHovered = hoveredPaymentIdx === idx;
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isHovered ? 'border-[#F67009] bg-white shadow-xs' : 'border-[#F3E5DC] bg-white'
                  }`}
                  onMouseEnter={() => setHoveredPaymentIdx(idx)}
                  onMouseLeave={() => setHoveredPaymentIdx(null)}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }} />
                    <span className="text-xs font-bold text-slate-800">{slice.paymentMode}</span>
                    <span className="text-[10px] text-slate-400">({slice.count} bills)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900">
                      {currency} {Number(slice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-bold text-[#F67009] ml-1.5">
                      {slice.percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderPaymentTable() {
    if (paymentBreakdown.length === 0) {
      return (
        <div className="text-center py-8 text-slate-400 text-xs">
          No payments recorded today yet.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-2xl border border-[#F3E5DC]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FFF9F6] border-b border-[#F3E5DC] text-slate-700 uppercase font-bold text-[10px] tracking-wider">
            <tr>
              <th className="p-3">Payment Channel</th>
              <th className="p-3 text-center">Transactions</th>
              <th className="p-3 text-right">Collected Amount</th>
              <th className="p-3 text-right">Share %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3E5DC] bg-white">
            {donutSlices.map((slice, idx) => (
              <tr key={idx} className="hover:bg-[#FFF9F6]/60 transition-colors">
                <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }}></span>
                  <span>{slice.paymentMode}</span>
                </td>
                <td className="p-3 text-center font-bold text-slate-600">{slice.count}</td>
                <td className="p-3 text-right font-bold text-slate-900">
                  {currency} {Number(slice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3 text-right font-bold text-[#F67009]">
                  {slice.percent.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[#FFF9F6] border-t-2 border-[#F3E5DC] font-bold text-slate-800">
            <tr>
              <td className="p-3">Total Collection</td>
              <td className="p-3 text-center text-[#F67009]">{totalTransactions}</td>
              <td className="p-3 text-right text-[#F67009]">
                {currency} {totalPaymentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td className="p-3 text-right">100%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  function renderOccupancyChart() {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 bg-[#FFF9F6] border border-[#F3E5DC] rounded-2xl p-5">
          {/* Circular Occupancy Meter */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={donutRadius}
                fill="none"
                stroke="#E5D7CE"
                strokeWidth="14"
              />
              <circle
                cx="80"
                cy="80"
                r={donutRadius}
                fill="none"
                stroke="#F67009"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${(occupancyRate / 100) * donutCircumference} ${donutCircumference}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute text-center select-none">
              <span className="text-2xl font-black text-slate-900 leading-none">{occupancyRate}%</span>
              <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">Occupancy</p>
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <div className="p-3 rounded-xl bg-white border border-[#F3E5DC] text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Tables</span>
              <h4 className="text-xl font-black text-slate-900 mt-0.5">{totalTables}</h4>
              <span className="text-[10px] text-slate-500">Configured</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#FED7AA] text-center">
              <span className="text-[10px] font-bold uppercase text-[#F67009]">Occupied</span>
              <h4 className="text-xl font-black text-[#F67009] mt-0.5">{occupiedTables}</h4>
              <span className="text-[10px] text-[#F67009] font-medium">Currently dining</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-emerald-200 text-center">
              <span className="text-[10px] font-bold uppercase text-emerald-600">Available</span>
              <h4 className="text-xl font-black text-emerald-600 mt-0.5">{availableTables}</h4>
              <span className="text-[10px] text-emerald-600 font-medium">Ready for guests</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderOccupancyTable() {
    return (
      <div className="overflow-x-auto rounded-2xl border border-[#F3E5DC]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FFF9F6] border-b border-[#F3E5DC] text-slate-700 uppercase font-bold text-[10px] tracking-wider">
            <tr>
              <th className="p-3">Dining Metric / Parameter</th>
              <th className="p-3 text-center">Tables Count</th>
              <th className="p-3 text-right">Floor Share %</th>
              <th className="p-3 text-center">Real-Time Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3E5DC] bg-white">
            <tr className="hover:bg-[#FFF9F6]/60 transition-colors">
              <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F67009]"></span>
                <span>Occupied Tables (Active Dining)</span>
              </td>
              <td className="p-3 text-center font-bold text-[#F67009]">{occupiedTables}</td>
              <td className="p-3 text-right font-bold text-slate-700">{occupancyRate}%</td>
              <td className="p-3 text-center">
                <span className="px-2 py-0.5 rounded-full bg-[#FFF0E6] text-[#F67009] font-bold text-[10px] border border-[#FED7AA]">
                  Billed / Dining
                </span>
              </td>
            </tr>
            <tr className="hover:bg-[#FFF9F6]/60 transition-colors">
              <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Available Vacant Tables</span>
              </td>
              <td className="p-3 text-center font-bold text-emerald-600">{availableTables}</td>
              <td className="p-3 text-right font-bold text-slate-700">
                {totalTables > 0 ? ((availableTables / totalTables) * 100).toFixed(1) : 0}%
              </td>
              <td className="p-3 text-center">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                  Ready for Seating
                </span>
              </td>
            </tr>
            <tr className="hover:bg-[#FFF9F6]/60 transition-colors">
              <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>Total Registered Dining Tables</span>
              </td>
              <td className="p-3 text-center font-bold text-slate-800">{totalTables}</td>
              <td className="p-3 text-right font-bold text-slate-700">100.0%</td>
              <td className="p-3 text-center">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                  Total Floor Capacity
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
};

export default DashboardPage;
