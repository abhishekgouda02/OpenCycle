import React, { useState, useEffect } from 'react';
import { 
  Flag, 
  Eye, 
  Check, 
  X, 
  AlertTriangle, 
  Clock,
  User,
  Package,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Report {
  id: string;
  reporter_id: string | null;
  reported_item_id: string | null;
  reported_user_id: string | null;
  reason: 'inappropriate' | 'spam' | 'fake' | 'scam' | 'other';
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  reporter?: {
    full_name: string;
    email: string;
  };
  reported_item?: {
    title: string;
    description: string;
  };
  reported_user?: {
    full_name: string;
    email: string;
  };
}

const ReportsManagement: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:users!reports_reporter_id_fkey(full_name, email),
          reported_item:items!reports_reported_item_id_fkey(title, description),
          reported_user:users!reports_reported_user_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReportStatus = async (reportId: string, status: Report['status'], notes?: string) => {
    setActionLoading(reportId);
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          status,
          admin_notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status, admin_notes: notes || null, updated_at: new Date().toISOString() }
          : report
      ));

      if (selectedReport?.id === reportId) {
        setSelectedReport(prev => prev ? { ...prev, status, admin_notes: notes || null } : null);
      }
    } catch (error) {
      console.error('Error updating report:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReports = reports.filter(report => 
    !filterStatus || report.status === filterStatus
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: Report['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      dismissed: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status];
  };

  const getReasonColor = (reason: Report['reason']) => {
    const colors = {
      inappropriate: 'bg-red-100 text-red-800',
      spam: 'bg-orange-100 text-orange-800',
      fake: 'bg-purple-100 text-purple-800',
      scam: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[reason];
  };

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'reviewed':
        return <Eye className="h-4 w-4" />;
      case 'resolved':
        return <Check className="h-4 w-4" />;
      case 'dismissed':
        return <X className="h-4 w-4" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Reports Management</h1>
          <p className="text-gray-600">Review and manage user reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <span className="text-sm text-gray-500">{filteredReports.length} reports</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['pending', 'reviewed', 'resolved', 'dismissed'].map(status => {
          const count = reports.filter(r => r.status === status).length;
          return (
            <div key={status} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">{status}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
                <div className={`p-2 rounded-lg ${getStatusColor(status as Report['status']).replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                  {getStatusIcon(status as Report['status'])}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reporter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getReasonColor(report.reason)}`}>
                          {report.reason}
                        </span>
                      </div>
                      {report.description && (
                        <p className="text-sm text-gray-600 max-w-xs truncate">
                          {report.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {report.reporter?.full_name || 'Anonymous'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.reporter?.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          {report.reported_item_id ? (
                            <Package className="h-4 w-4 text-gray-600" />
                          ) : (
                            <User className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {report.reported_item_id ? 'Item' : 'User'}
                        </div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {report.reported_item?.title || report.reported_user?.full_name || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                      {getStatusIcon(report.status)}
                      <span className="ml-1 capitalize">{report.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(report.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setAdminNotes(report.admin_notes || '');
                          setShowReportModal(true);
                        }}
                        className="text-teal-600 hover:text-teal-900 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                            disabled={actionLoading === report.id}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Mark as resolved"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                            disabled={actionLoading === report.id}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Dismiss report"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Detail Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Report Details</h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Report Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Reason</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getReasonColor(selectedReport.reason)}`}>
                      {selectedReport.reason}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedReport.status)}`}>
                      {getStatusIcon(selectedReport.status)}
                      <span className="ml-1 capitalize">{selectedReport.status}</span>
                    </span>
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedReport.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="mt-1 text-gray-900">{selectedReport.description}</p>
                </div>
              )}

              {/* Reporter */}
              <div>
                <label className="text-sm font-medium text-gray-500">Reporter</label>
                <div className="mt-2 flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {selectedReport.reporter?.full_name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedReport.reporter?.email || 'No email'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reported Target */}
              <div>
                <label className="text-sm font-medium text-gray-500">Reported {selectedReport.reported_item_id ? 'Item' : 'User'}</label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  {selectedReport.reported_item_id ? (
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{selectedReport.reported_item?.title}</h4>
                        <a
                          href={`/item/${selectedReport.reported_item_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.reported_item?.description}</p>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedReport.reported_user?.full_name}</h4>
                      <p className="text-sm text-gray-600">{selectedReport.reported_user?.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="text-sm font-medium text-gray-500">Admin Notes</label>
                <textarea
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  rows={3}
                  placeholder="Add notes about this report..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="font-medium text-gray-500">Reported</label>
                  <p className="text-gray-900">{formatDate(selectedReport.created_at)}</p>
                </div>
                <div>
                  <label className="font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900">{formatDate(selectedReport.updated_at)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                {selectedReport.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleUpdateReportStatus(selectedReport.id, 'dismissed', adminNotes);
                        setShowReportModal(false);
                      }}
                      disabled={actionLoading === selectedReport.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateReportStatus(selectedReport.id, 'resolved', adminNotes);
                        setShowReportModal(false);
                      }}
                      disabled={actionLoading === selectedReport.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Resolve
                    </button>
                  </>
                )}
                {selectedReport.status !== 'pending' && (
                  <button
                    onClick={() => {
                      handleUpdateReportStatus(selectedReport.id, selectedReport.status, adminNotes);
                      setShowReportModal(false);
                    }}
                    disabled={actionLoading === selectedReport.id}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    Update Notes
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsManagement;