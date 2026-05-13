'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCertificationMetrics, useFrameworkMetrics, useCertifications, useComplianceReport, useCompanies } from '@/lib/hooks';
import { formatDate } from '@/lib/utils';
import { BarChart3, Award, CheckCircle, Clock, AlertTriangle, Shield, TrendingUp, Target, Activity, Zap, ArrowRight } from 'lucide-react';

// Use dynamic metrics from API instead of hardcoded values
const metricCards = [
  { label: 'Total Certifications', key: 'totalCertifications' },
  { label: 'Active Certifications', key: 'activeCertifications' },
  { label: 'Expiring Soon', key: 'expiringSoon' },
  { label: 'Expired', key: 'expired' },
  { label: 'Total Companies', key: 'totalCompanies' },
];

export default function Dashboard() {
  const router = useRouter();
  const metricsQuery = useCertificationMetrics();
  const frameworkMetricsQuery = useFrameworkMetrics();
  const certificationsQuery = useCertifications();
  const companiesQuery = useCompanies();

  return (
    <div className="space-y-8">
      {/* Dashboard Overview Feature Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
      >
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"
          >
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </motion.div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-1">Compliance Intelligence Dashboard</h3>
            <p className="text-blue-700 text-sm mb-3">
              Real-time insights into your certification status and framework coverage
            </p>
            
            {/* Dashboard Analytics Flow Visualization */}
            <div className="flex items-center gap-2 flex-wrap">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-blue-200 shadow-sm"
              >
                <Target className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">Track Metrics</span>
              </motion.div>
              
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <ArrowRight className="w-4 h-4 text-blue-400" />
              </motion.div>
              
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-indigo-200 shadow-sm"
              >
                <Activity className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-medium text-indigo-800">Analyze Trends</span>
              </motion.div>
              
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              >
                <ArrowRight className="w-4 h-4 text-indigo-400" />
              </motion.div>
              
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-green-200 shadow-sm"
              >
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-800">Drive Decisions</span>
              </motion.div>
            </div>
          </div>
          
          <motion.div
            animate={{ 
              rotate: [0, 15, -15, 0],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="hidden md:block"
          >
            <Zap className="w-8 h-8 text-blue-400" />
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass p-6 text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3"
          >
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </motion.div>
          <div className="text-2xl font-bold text-foreground">{metricsQuery.data?.total || 0}</div>
          <div className="text-sm text-muted-foreground">Total Certifications</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass p-6 text-center"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3"
          >
            <CheckCircle className="w-6 h-6 text-green-600" />
          </motion.div>
          <div className="text-2xl font-bold text-foreground">{metricsQuery.data?.active || 0}</div>
          <div className="text-sm text-muted-foreground">Active</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass p-6 text-center"
        >
          <motion.div
            animate={{ 
              y: [0, -5, 0],
            }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3"
          >
            <Clock className="w-6 h-6 text-yellow-600" />
          </motion.div>
          <div className="text-2xl font-bold text-foreground">{metricsQuery.data?.expiringSoon || 0}</div>
          <div className="text-sm text-muted-foreground">Expiring Soon</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass p-6 text-center"
        >
          <motion.div
            animate={{ 
              opacity: [1, 0.5, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3"
          >
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </motion.div>
          <div className="text-2xl font-bold text-foreground">{metricsQuery.data?.expired || 0}</div>
          <div className="text-sm text-muted-foreground">Expired</div>
        </motion.div>
      </div>

      <section className="grid gap-6 xl:grid-cols-5 lg:grid-cols-3 md:grid-cols-2">
        {metricCards.map((metric, index) => {
          const getIconAndColor = (key: string) => {
            switch (key) {
              case 'totalCertifications': return { icon: Award, color: 'text-green-600 bg-green-100' };
              case 'activeCertifications': return { icon: CheckCircle, color: 'text-blue-600 bg-blue-100' };
              case 'expiringSoon': return { icon: Clock, color: 'text-yellow-600 bg-yellow-100' };
              case 'expired': return { icon: AlertTriangle, color: 'text-red-600 bg-red-100' };
              case 'totalCompanies': return { icon: Shield, color: 'text-purple-600 bg-purple-100' };
              default: return { icon: BarChart3, color: 'text-gray-600 bg-gray-100' };
            }
          };
          
          const { icon: Icon, color } = getIconAndColor(metric.key);
          
          const handleClick = () => {
            if (metric.key === 'totalCompanies') {
              router.push('/companies');
            }
          };

          return (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`glass p-6 hover-lift ${metric.key === 'totalCompanies' ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
              onClick={handleClick}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-semibold text-foreground">
                {(() => {
                  if (metric.key === 'totalCompanies') {
                    return companiesQuery.isLoading ? '—' : companiesQuery.data?.companies?.length ?? 0;
                  }
                  if (metric.key === 'totalCertifications') {
                    return metricsQuery.isLoading ? '—' : metricsQuery.data?.total ?? 0;
                  }
                  if (metric.key === 'activeCertifications') {
                    return metricsQuery.isLoading ? '—' : metricsQuery.data?.active ?? 0;
                  }
                  if (metric.key === 'expiringSoon') {
                    return metricsQuery.isLoading ? '—' : metricsQuery.data?.expiringSoon ?? 0;
                  }
                  if (metric.key === 'expired') {
                    return metricsQuery.isLoading ? '—' : metricsQuery.data?.expired ?? 0;
                  }
                  return metricsQuery.isLoading ? '—' : metricsQuery.data?.[metric.key] ?? 0;
                })()}
              </p>
              {metric.key === 'totalCompanies' && (
                <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                  Click to view all companies
                  <ArrowRight className="w-3 h-3" />
                </p>
              )}
            </motion.div>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <motion.div className="glass p-6 col-span-2">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Expiry Trend</h2>
              <p className="text-sm text-muted-foreground">Monitor certificate renewals and expiration risk.</p>
            </div>
            <motion.div
              animate={{ 
                y: [0, -3, 0],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </motion.div>
          </div>
          <div className="h-72 rounded-3xl bg-slate-950/5 p-4 flex items-center justify-center">
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-center"
            >
              <BarChart3 className="w-12 h-12 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Interactive Chart Placeholder</p>
            </motion.div>
          </div>
        </motion.div>

              </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <motion.div className="glass p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Upcoming Renewals</h2>
          </div>
          <div className="space-y-4">
            {certificationsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading certifications...</p>
            ) : (
              certificationsQuery.data?.certifications.slice(0, 3).map((cert: any) => (
                <div key={cert.id} className="rounded-3xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{cert.name}</p>
                      <p className="text-xs text-muted-foreground">{cert.issuingBody}</p>
                    </div>
                    <p className="text-sm text-slate-500">{formatDate(cert.expiryDate)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div className="glass p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">No recent activity to display.</p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
