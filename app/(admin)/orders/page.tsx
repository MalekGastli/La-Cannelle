"use client";

import React, { useState, useEffect } from 'react';
import { 
   Menu, X, ChevronRight, Package, Calendar, DollarSign, 
   Users, TrendingUp, Clock, CheckCircle, AlertCircle, XCircle,
   Search, Filter, Eye, Edit, Archive, RefreshCw, Truck,
   MessageCircle, Phone, Mail, MapPin, User, ShoppingBag, BarChart3, Briefcase,
   AlertTriangle, Info, Trash2
 } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/hooks/useTranslation';
import AdminLanguageToggle from '../components/AdminLanguageToggle';
import AdminLayout from '../components/AdminLayout';
import { ordersApi, Order } from '@/lib/api/orders';
import { useBodyScrollLock } from '../components/useBodyScrollLock';
import { formatIsoDate, formatIsoDateTime, formatTimeHHmm } from '@/lib/utils/datetime';

// Confirmation Modal Component
type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  reasonValue?: string;
  onReasonChange?: (value: string) => void;
  reasonPlaceholder?: string;
  reasonError?: string;
  confirmDisabled?: boolean;
  type?: 'warning' | 'info';
};

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText, 
  cancelText,
  reasonValue,
  onReasonChange,
  reasonPlaceholder,
  reasonError,
  confirmDisabled = false,
  type = 'warning'
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-scale-in">
        <div className={`p-6 ${type === 'warning' ? 'bg-amber-50' : 'bg-blue-50'} rounded-t-xl`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-full ${type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'}`}>
              <AlertTriangle size={24} className={type === 'warning' ? 'text-amber-600' : 'text-blue-600'} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-700">{message}</p>
        </div>
        
        <div className="p-6 space-y-4">
          {typeof onReasonChange === 'function' && (
            <div>
              <textarea
                value={reasonValue || ''}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder={reasonPlaceholder}
                rows={3}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-amber-500 text-gray-900 bg-white transition-colors ${
                  reasonError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-amber-500 hover:border-gray-400'
                }`}
              />
              {reasonError ? <p className="mt-1 text-sm text-red-600">{reasonError}</p> : null}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex gap-3">
              <button
                onClick={onConfirm}
                disabled={Boolean(confirmDisabled) || (typeof onReasonChange === 'function' && !(reasonValue || '').trim())}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                {confirmText}
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminOrders() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const { language, toggleLanguage } = useTranslation('admin');

  // State for confirmation modal
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<{ id: string; reason?: string | null } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; client?: string } | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState('');
  const [deleteAllError, setDeleteAllError] = useState('');

  useBodyScrollLock(Boolean(selectedOrder) || showCancelConfirm || showDeleteConfirm || showDeleteAllConfirm);

  const copy = {
    EN: {
      nav: {
        dashboard: 'Dashboard',
        orders: 'Orders',
        menu: 'Menu Management',
        services: 'Services',
        accessories: 'Accessories',
        system: 'System Control',
        customers: 'Customers',
        reports: 'Reports',
      },
      admin: {
        user: 'Admin User',
        role: 'Administrator',
      },
      header: {
        title: 'Orders Management',
      },
      filters: {
        searchPlaceholder: 'Search orders...',
        allStatus: 'All Status',
        allDates: 'All Dates',
        today: 'Today',
        upcoming: 'Upcoming',
        refresh: 'Refresh',
        refreshing: 'Refreshing...',
      },
      table: {
        title: 'All Orders',
        orderId: 'Order ID',
        client: 'Client',
        event: 'Event',
        dateTime: 'Date & Time',
        guests: 'Guests',
        total: 'Total',
        status: 'Status',
        actions: 'Actions',
        paymentPaid: 'Paid',
        paymentPending: 'Pending',
      },
      modal: {
        title: 'Order Details',
        clientInfo: 'Client Information',
        eventDetails: 'Event Details',
        clientLabel: 'Client',
        eventType: 'Event Type',
        orderItems: 'Order Items',
        quantity: 'Qty',
        total: 'Total',
        specialRequests: 'Special Requests',
        statusManagement: 'Status Management',
        restoreOrder: 'Restore Order',
        restoreHint: 'This order is cancelled. Choose a new status to restore it.',
        cancelOrder: 'Cancel Order',
        cancelPlaceholder: 'Reason for cancellation...',
        cancelNoReasonAction: 'Cancel Without Reason',
        cancelAction: 'Cancel Order & Process Refund',
      },
      status: {
        pending: 'Pending',
        confirmed_paid: 'Confirmed (Paid)',
        confirmed_unpaid: 'Confirmed (Unpaid)',
        preparation: 'In Preparation',
        delivery: 'Out for Delivery',
        completed: 'Completed',
        cancelled: 'Cancelled',
      },
      labels: {
        guests: 'guests',
        emptyState: 'No orders found matching your criteria',
        viewDetails: 'View Details',
        markComplete: 'Mark Complete',
        cancelOrder: 'Cancel Order',
        deleteOrder: 'Delete Order',
        deleteAll: 'Delete All',
      },
      confirmation: {
        cancelTitle: 'Confirm Cancellation',
        cancelMessage: 'Are you sure you want to cancel this order? A refund will be processed automatically.',
        confirmCancel: 'Yes, Cancel Order',
        cancelCancel: 'No, Keep Order',
        deleteTitle: 'Confirm Deletion',
        deleteMessage: 'Delete this order permanently? This action cannot be undone.',
        confirmDelete: 'Yes, Delete',
        cancelDelete: 'No, Keep',
        deleteAllTitle: 'Delete All Orders',
        deleteAllMessage: 'This will permanently delete ALL orders and their items. This action cannot be undone.',
        deleteAllPlaceholder: 'Type DELETE to confirm',
      }
    },
    DE: {
      nav: {
        dashboard: 'Übersicht',
        orders: 'Bestellungen',
        menu: 'Menüverwaltung',
        services: 'Dienstleistungen',
        accessories: 'Zubehör',
        system: 'Systemsteuerung',
        customers: 'Kunden',
        reports: 'Berichte',
      },
      admin: {
        user: 'Admin Benutzer',
        role: 'Administrator',
      },
      header: {
        title: 'Bestellverwaltung',
      },
      filters: {
        searchPlaceholder: 'Bestellungen suchen...',
        allStatus: 'Alle Status',
        allDates: 'Alle Daten',
        today: 'Heute',
        upcoming: 'Bevorstehend',
        refresh: 'Aktualisieren',
        refreshing: 'Aktualisiere...',
      },
      table: {
        title: 'Alle Bestellungen',
        orderId: 'Bestell-ID',
        client: 'Kunde',
        event: 'Event',
        dateTime: 'Datum & Uhrzeit',
        guests: 'Gäste',
        total: 'Gesamt',
        status: 'Status',
        actions: 'Aktionen',
        paymentPaid: 'Bezahlt',
        paymentPending: 'Ausstehend',
      },
      modal: {
        title: 'Bestelldetails',
        clientInfo: 'Kundeninformationen',
        eventDetails: 'Eventdetails',
        clientLabel: 'Kunde',
        eventType: 'Eventtyp',
        orderItems: 'Bestellpositionen',
        quantity: 'Menge',
        total: 'Gesamt',
        specialRequests: 'Besondere Wünsche',
        statusManagement: 'Statusverwaltung',
        restoreOrder: 'Bestellung wiederherstellen',
        restoreHint: 'Diese Bestellung ist storniert. Wählen Sie einen neuen Status, um sie wiederherzustellen.',
        cancelOrder: 'Bestellung stornieren',
        cancelPlaceholder: 'Grund für die Stornierung...',
        cancelNoReasonAction: 'Ohne Grund stornieren',
        cancelAction: 'Bestellung stornieren und Rückerstattung auslösen',
      },
      status: {
        pending: 'Ausstehend',
        confirmed_paid: 'Bestätigt (Bezahlt)',
        confirmed_unpaid: 'Bestätigt (Ausstehend)',
        preparation: 'In Vorbereitung',
        delivery: 'In Lieferung',
        completed: 'Abgeschlossen',
        cancelled: 'Storniert',
      },
      labels: {
        guests: 'Gäste',
        emptyState: 'Keine Bestellungen gefunden, die den Kriterien entsprechen',
        viewDetails: 'Details ansehen',
        markComplete: 'Als abgeschlossen markieren',
        cancelOrder: 'Bestellung stornieren',
        deleteOrder: 'Bestellung löschen',
        deleteAll: 'Alle löschen',
      },
      confirmation: {
        cancelTitle: 'Stornierung bestätigen',
        cancelMessage: 'Möchten Sie diese Bestellung wirklich stornieren? Eine Rückerstattung wird automatisch verarbeitet.',
        confirmCancel: 'Ja, Bestellung stornieren',
        cancelCancel: 'Nein, Bestellung behalten',
        deleteTitle: 'Löschung bestätigen',
        deleteMessage: 'Diese Bestellung endgültig löschen? Dies kann nicht rückgängig gemacht werden.',
        confirmDelete: 'Ja, löschen',
        cancelDelete: 'Nein, behalten',
        deleteAllTitle: 'Alle Bestellungen löschen',
        deleteAllMessage: 'Dies löscht ALLE Bestellungen und Positionen endgültig. Dies kann nicht rückgängig gemacht werden.',
        deleteAllPlaceholder: 'Tippen Sie DELETE zur Bestätigung',
      }
    },
  } as const;
  const t = copy[language] ?? copy.EN;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Helper function to format price with 2 decimal places
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Helper function to format order ID for display
  const formatOrderId = (id: string) => {
    // If it's a UUID, show first 8 chars and last 4 chars
    if (id.length > 12) {
      return `#${id.substring(0, 8)}...${id.substring(id.length - 4)}`;
    }
    return `#${id}`;
  };

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const apiOrders = await ordersApi.getOrders();
      const normalized: LocalOrder[] = apiOrders.map((order: Order) => ({
        id: order.id,
        client: order.clientName,
        contact: order.contactEmail,
        phone: order.phone,
        eventType: order.eventType,
        eventDate: formatIsoDate(order.eventDate),
        eventTime: formatTimeHHmm(order.eventTime),
        guests: order.guests,
        location: order.location,
        total: order.total,
        status: order.status.toLowerCase(),
        payment: order.paymentStatus.toLowerCase(),
        specialRequests: order.specialRequests,
        createdAt: formatIsoDateTime(order.createdAt),
        dishes: order.items?.map((it) => ({
          name: it.name,
          quantity: it.quantity,
          price: it.price
        })) || [],
        beverages: [],
        cancellationReason: (order as any).cancellationReason ?? null
      }));
      setOrders(normalized);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string, duration = 2500) => {
    setNotification({ type, message });
    if (duration > 0) {
      setTimeout(() => setNotification(null), duration);
    }
  };

  type LocalOrder = {
    id: string;
    client: string;
    contact: string;
    phone: string;
    eventType: string;
    eventDate: string;
    eventTime: string;
    guests: number;
    location: string;
    total: number;
    status: string;
    payment: string;
    specialRequests?: string;
    createdAt?: string;
    dishes?: { name: string; quantity: number; price: number }[];
    beverages?: { name: string; quantity: number; price: number }[];
    cancellationReason?: string | null;
  };

  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const statusOptions = [
    { value: 'pending', label: t.status.pending, color: 'bg-amber-100 text-amber-800' },
    { value: 'confirmed_unpaid', label: t.status.confirmed_unpaid, color: 'bg-sky-100 text-sky-800' },
    { value: 'confirmed_paid', label: t.status.confirmed_paid, color: 'bg-blue-100 text-blue-800' },
    { value: 'preparation', label: t.status.preparation, color: 'bg-purple-100 text-purple-800' },
    { value: 'delivery', label: t.status.delivery, color: 'bg-indigo-100 text-indigo-800' },
    { value: 'completed', label: t.status.completed, color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: t.status.cancelled, color: 'bg-red-100 text-red-800' }
  ];
  const statusOptionsForUpdate = statusOptions.filter((s) => s.value !== 'cancelled');

  const navigation = [
    { id: 'dashboard', name: t.nav.dashboard, icon: TrendingUp, path: '/dashboard' },
    { id: 'orders', name: t.nav.orders, icon: Package, path: '/orders' },
    { id: 'menu', name: t.nav.menu, icon: Menu, path: '/menu_management' },
    { id: 'services', name: t.nav.services, icon: Briefcase, path: '/services_management' },
    { id: 'accessories', name: t.nav.accessories, icon: ShoppingBag, path: '/accessories' },
    { id: 'system', name: t.nav.system, icon: Clock, path: '/system_control' },
    { id: 'customers', name: t.nav.customers, icon: Users, path: '/customers' },
    { id: 'reports', name: t.nav.reports, icon: BarChart3, path: '/reports' }
  ];

  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesDate = dateFilter === 'all' || 
                       (dateFilter === 'today' && order.eventDate === new Date().toISOString().split('T')[0]) ||
                       (dateFilter === 'upcoming' && order.eventDate > new Date().toISOString().split('T')[0]);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const updated = await ordersApi.updateOrderStatus(orderId, newStatus);
      const shouldClearCancellationReason = newStatus !== 'cancelled';
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: newStatus, ...(shouldClearCancellationReason ? { cancellationReason: null } : {}) }
            : o
        )
      );
      setSelectedOrder((prev) =>
        prev && prev.id === orderId
          ? {
              ...prev,
              status: updated.status.toLowerCase?.() || newStatus,
              ...(shouldClearCancellationReason ? { cancellationReason: null } : {})
            }
          : prev
      );
      showNotification('success', 
        language === 'DE' 
          ? `Status für Bestellung ${formatOrderId(orderId)} aktualisiert`
          : `Order ${formatOrderId(orderId)} status updated`,
        2000
      );
    } catch (err) {
      console.error('Failed to update status', err);
      showNotification('error', 
        language === 'DE' 
          ? 'Fehler beim Aktualisieren des Status'
          : 'Failed to update status',
        3000
      );
    }
  };

  const cancelOrder = async (orderId: string, reason?: string | null) => {
    try {
      await ordersApi.updateOrderStatus(orderId, 'cancelled', reason || undefined);
      
      showNotification(
        'success',
        language === 'DE'
          ? `Bestellung ${formatOrderId(orderId)} wurde storniert. Erstattung wird verarbeitet.`
          : `Order ${formatOrderId(orderId)} has been cancelled. Refund is being processed.`,
        3000
      );
      
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: 'cancelled', cancellationReason: reason || null } : o))
      );
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: 'cancelled', cancellationReason: reason || null } : null);
      }
      
      setShowCancelConfirm(false);
      setOrderToCancel(null);
      
    } catch (error: any) {
      console.error('Failed to cancel order:', error);
      showNotification(
        'error',
        language === 'DE'
          ? `Fehler beim Stornieren der Bestellung: ${error.message || 'Unbekannter Fehler'}`
          : `Failed to cancel order: ${error.message || 'Unknown error'}`,
        3000
      );
    }
  };

  const openCancelConfirmation = (orderId: string, reason?: string) => {
    const trimmed = String(reason || '').trim();
    setOrderToCancel({ id: orderId, reason: trimmed ? trimmed : null });
    setShowCancelConfirm(true);
  };

  const confirmCancelOrder = () => {
    if (!orderToCancel) return;
    cancelOrder(orderToCancel.id, orderToCancel.reason ?? null);
  };

  const openDeleteConfirmation = (order: { id: string; client?: string }) => {
    setOrderToDelete(order);
    setShowDeleteConfirm(true);
  };

  const deleteOrderById = async (orderId: string) => {
    try {
      await ordersApi.deleteOrder(orderId);

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }

      showNotification(
        'success',
        language === 'DE'
          ? `Bestellung ${formatOrderId(orderId)} wurde gelöscht.`
          : `Order ${formatOrderId(orderId)} has been deleted.`,
        2500
      );
    } catch (error: any) {
      console.error('Failed to delete order:', error);
      showNotification(
        'error',
        language === 'DE'
          ? `Fehler beim Löschen der Bestellung: ${error.message || 'Unbekannter Fehler'}`
          : `Failed to delete order: ${error.message || 'Unknown error'}`,
        3000
      );
    } finally {
      setShowDeleteConfirm(false);
      setOrderToDelete(null);
    }
  };

  const openDeleteAllConfirmation = () => {
    setShowDeleteAllConfirm(true);
    setDeleteAllConfirmText('');
    setDeleteAllError('');
  };

  const deleteAllOrders = async () => {
    try {
      const result = await ordersApi.deleteAllOrders();
      setOrders([]);
      setSelectedOrder(null);

      showNotification(
        'success',
        language === 'DE'
          ? `Alle Bestellungen gelöscht. (${result.deletedOrders} Bestellungen, ${result.deletedOrderItems} Positionen)`
          : `All orders deleted. (${result.deletedOrders} orders, ${result.deletedOrderItems} items)`,
        3000
      );
    } catch (error: any) {
      console.error('Failed to delete all orders:', error);
      showNotification(
        'error',
        language === 'DE'
          ? `Fehler beim Löschen aller Bestellungen: ${error.message || 'Unbekannter Fehler'}`
          : `Failed to delete all orders: ${error.message || 'Unknown error'}`,
        3000
      );
    } finally {
      setShowDeleteAllConfirm(false);
      setDeleteAllConfirmText('');
      setDeleteAllError('');
    }
  };

  const confirmDeleteAllOrders = () => {
    const token = (deleteAllConfirmText || '').trim().toUpperCase();
    if (token !== 'DELETE') {
      setDeleteAllError(
        language === 'DE' ? 'Bitte DELETE zur Bestätigung eingeben.' : 'Please type DELETE to confirm.'
      );
      return;
    }

    deleteAllOrders();
  };

  const OrderDetailsModal = ({ order, onClose }) => {
    const [localCancellationReason, setLocalCancellationReason] = useState('');
    const [localCancellationError, setLocalCancellationError] = useState('');

    const handleCancellationChange = (e) => {
      const value = e.target.value;
      setLocalCancellationReason(value);

      if (value.trim()) {
        setLocalCancellationError('');
      }
    };

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-6 border-b border-gray-300 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-elegant mb-1">
                  {t.modal.title}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {formatOrderId(order.id)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {order.createdAt}
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors">
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Client Information & Event Details Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{t.modal.clientInfo}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <User size={18} className="text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{order.client}</p>
                      <p className="text-sm text-gray-700">{t.modal.clientLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Mail size={18} className="text-gray-600" />
                    <p className="text-sm text-gray-900">{order.contact}</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Phone size={18} className="text-gray-600" />
                    <p className="text-sm text-gray-900">{order.phone}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">{t.modal.eventDetails}</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-900">{order.eventType}</p>
                    <p className="text-sm text-gray-700">{t.modal.eventType}</p>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Calendar size={18} className="text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{order.eventDate}</p>
                      <p className="text-sm text-gray-700">{order.eventTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Users size={18} className="text-gray-600" />
                    <p className="text-gray-900">{order.guests} {t.labels.guests}</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <MapPin size={18} className="text-gray-600 mt-1" />
                    <p className="text-sm text-gray-900">{order.location}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation Reason Display (if order is cancelled) */}
            {order.status === 'cancelled' && order.cancellationReason && (
              <div className="border border-red-200 bg-red-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={20} className="text-red-600" />
                  <h4 className="font-semibold text-red-800">
                    {language === 'DE' ? 'Stornierungsgrund' : 'Cancellation Reason'}
                  </h4>
                </div>
                <p className="text-red-700 text-sm bg-white p-3 rounded-lg border border-red-100">
                  {order.cancellationReason}
                </p>
              </div>
            )}

            {/* Order Items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">{t.modal.orderItems}</h3>
              <div className="space-y-3">
                {order.dishes.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-700 mt-1">
                        <span>{t.modal.quantity}: {item.quantity}</span>
                        <span>€{formatPrice(item.price)}/each</span>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 text-lg">€{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
                {order.beverages && order.beverages.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-700 mt-1">
                        <span>{t.modal.quantity}: {item.quantity}</span>
                        <span>€{formatPrice(item.price)}/each</span>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 text-lg">€{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center p-4 border-t border-gray-300 mt-4 bg-gradient-to-r from-gray-50 to-white rounded-lg">
                <p className="text-lg font-bold text-gray-900">{t.modal.total}</p>
                <p className="text-2xl font-bold text-gray-900">€{formatPrice(order.total)}</p>
              </div>
            </div>

            {/* Special Requests */}
            {order.specialRequests && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-2">{t.modal.specialRequests}</h3>
                <p className="text-gray-900 bg-amber-50 p-4 rounded-lg border border-amber-200">{order.specialRequests}</p>
              </div>
            )}

            {/* Status Management / Restore */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                {order.status === 'cancelled' ? t.modal.restoreOrder : t.modal.statusManagement}
              </h3>
              {order.status === 'cancelled' ? (
                <p className="text-sm text-gray-700 mb-3">{t.modal.restoreHint}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {statusOptionsForUpdate.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => updateOrderStatus(order.id, status.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors border ${
                      order.status === status.value
                        ? `${status.color} border-gray-300 shadow-sm`
                        : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cancellation Section (only if not already cancelled) */}
            {order.status !== 'cancelled' && (
              <div className="border-t border-gray-300 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={20} className="text-red-600" />
                  <h3 className="text-lg font-semibold text-red-800">{t.modal.cancelOrder}</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openCancelConfirmation(order.id)}
                      className="px-4 py-2 rounded-lg font-medium transition-colors border bg-red-100 text-red-800 border-red-200 hover:bg-red-200 hover:border-red-300 shadow-sm"
                    >
                      {t.modal.cancelNoReasonAction}
                    </button>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      {language === 'DE' ? 'Optional: Grund angeben' : 'Optional: Provide a reason'}
                    </p>
                    <textarea
                      placeholder={t.modal.cancelPlaceholder}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-red-500 text-gray-900 bg-white transition-colors ${
                        localCancellationError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500 hover:border-gray-400'
                      }`}
                      rows={3}
                      value={localCancellationReason}
                      onChange={handleCancellationChange}
                    />
                    {localCancellationError && (
                      <p className="mt-1 text-sm text-red-600">{localCancellationError}</p>
                    )}
                    <button
                      onClick={() => {
                        if (!localCancellationReason.trim()) {
                          setLocalCancellationError(
                            language === 'DE' ? 'Bitte geben Sie einen Grund ein oder nutzen Sie die obere Schaltfläche.' : 'Enter a reason or use the button above.'
                          );
                          return;
                        }
                        openCancelConfirmation(order.id, localCancellationReason);
                      }}
                      className="mt-3 w-full px-6 py-3 rounded-lg font-medium transition-colors bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg"
                    >
                      {t.modal.cancelAction}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout
      navigation={navigation}
      title={t.header.title}
      adminUserLabel={t.admin.user}
      adminRoleLabel={t.admin.role}
      languageToggle={<AdminLanguageToggle language={language} onToggle={toggleLanguage} />}
      locale={language === 'DE' ? 'de-DE' : 'en-US'}
      openMenuLabel={language === 'DE' ? 'Menü öffnen' : 'Open menu'}
      closeMenuLabel={language === 'DE' ? 'Menü schließen' : 'Close menu'}
    >
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 animate-slide-in ${
          notification.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : 'bg-red-100 border-red-400 text-red-800'
        } border rounded-xl p-4 shadow-lg max-w-sm`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle className="text-green-600" size={20} />
            ) : (
              <XCircle className="text-red-600" size={20} />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className={`mb-6 flex flex-col lg:flex-row gap-4 items-stretch ${
        isVisible ? 'animate-fade-in-up' : 'opacity-0'
      }`}>
        <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                placeholder={t.filters.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 bg-white hover:border-gray-400 transition-colors"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 bg-white hover:border-gray-400 transition-colors"
            >
              <option value="all">{t.filters.allStatus}</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 bg-white hover:border-gray-400 transition-colors"
            >
              <option value="all">{t.filters.allDates}</option>
              <option value="today">{t.filters.today}</option>
              <option value="upcoming">{t.filters.upcoming}</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-56 lg:justify-start lg:items-stretch">
          <button
            onClick={loadOrders}
            disabled={isLoading}
            className="px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all font-medium inline-flex items-center justify-center gap-2 border border-amber-800 shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? t.filters.refreshing : t.filters.refresh}
          </button>

          <button
            type="button"
            onClick={openDeleteAllConfirmation}
            disabled={isLoading || orders.length === 0}
            className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-medium inline-flex items-center justify-center gap-2 border border-red-800 shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
            title={t.labels.deleteAll}
          >
            <Trash2 size={16} />
            {t.labels.deleteAll}
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-300 ${
        isVisible ? 'animate-fade-in-up' : 'opacity-0'
      }`} style={{ animationDelay: '200ms' }}>
        <div className="p-6 border-b border-gray-300 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 font-elegant">{t.table.title} ({filteredOrders.length})</h2>
            <div className="text-sm text-gray-600">
              {language === 'DE' ? 'Letzte Aktualisierung' : 'Last updated'}: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">{t.table.orderId}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">{t.table.client}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">{t.table.event}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">{t.table.dateTime}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">{t.table.guests}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">{t.table.total}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300">{t.table.status}</th>
                <th className="w-40 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider sticky right-0 bg-gray-100 z-20 border-l border-gray-300 shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.35)]">
                  {t.table.actions}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-300">
              {filteredOrders.map((order) => {
                const statusConfig = statusOptions.find(s => s.value === order.status);
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-4 border-r border-gray-300 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                          <Package size={16} className="text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded-md inline-block">
                            {formatOrderId(order.id)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 truncate">{order.createdAt}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-r border-gray-300 overflow-hidden">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{order.client}</div>
                        <div className="text-xs text-gray-700 truncate">{order.contact}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-r border-gray-300 overflow-hidden">
                      <div className="text-sm text-gray-900 truncate">{order.eventType}</div>
                    </td>
                    <td className="px-4 py-4 border-r border-gray-300 overflow-hidden">
                      <div className="text-sm text-gray-900 font-medium truncate">{order.eventDate}</div>
                      <div className="text-sm text-gray-700 truncate">{order.eventTime}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-gray-500" />
                        <span className="font-medium">{order.guests}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-r border-gray-300 overflow-hidden">
                      <div className="text-sm font-semibold text-gray-900">€{formatPrice(order.total)}</div>
                      <div className={`text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full mt-1 ${
                        order.payment === 'paid' 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {order.payment === 'paid' ? (
                          <>
                            <CheckCircle size={10} />
                            {t.table.paymentPaid}
                          </>
                        ) : (
                          <>
                            <Clock size={10} />
                            {t.table.paymentPending}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 border-r border-gray-300 overflow-hidden">
                      <span className={`max-w-full px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1 ${statusConfig?.color} border-gray-300 overflow-hidden`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                        <span className="min-w-0 truncate">{statusConfig?.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white group-hover:bg-gray-50 border-l border-gray-300 shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.35)]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300 hover:shadow-sm"
                          title={t.labels.viewDetails}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="p-2 text-green-700 hover:bg-green-50 rounded-lg transition-colors border border-green-200 hover:border-green-300 hover:shadow-sm"
                          title={t.labels.markComplete}
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirmation({ id: order.id, client: order.client })}
                          className="p-2 text-red-800 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300 hover:shadow-sm"
                          title={t.labels.deleteOrder}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-16 border-t border-gray-300">
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full opacity-20"></div>
              <Package size={64} className="mx-auto text-gray-400 relative z-10" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {t.labels.emptyState}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {language === 'DE' 
                ? 'Versuchen Sie, Ihre Suchfilter zu ändern oder eine andere Zeitspanne auszuwählen.' 
                : 'Try changing your search filters or selecting a different time period.'}
            </p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}

      {/* Cancellation Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelConfirm}
        onClose={() => {
          setShowCancelConfirm(false);
          setOrderToCancel(null);
        }}
        onConfirm={confirmCancelOrder}
        title={t.confirmation.cancelTitle}
        message={t.confirmation.cancelMessage}
        confirmText={t.confirmation.confirmCancel}
        cancelText={t.confirmation.cancelCancel}
        type="warning"
      />

      {/* Delete Order Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setOrderToDelete(null);
        }}
        onConfirm={() => {
          if (orderToDelete) {
            deleteOrderById(orderToDelete.id);
          }
        }}
        title={t.confirmation.deleteTitle}
        message={orderToDelete
          ? `${t.confirmation.deleteMessage}\n\n${t.table.client}: ${orderToDelete.client || '-'}\n${t.table.orderId}: ${formatOrderId(orderToDelete.id)}`
          : t.confirmation.deleteMessage}
        confirmText={t.confirmation.confirmDelete}
        cancelText={t.confirmation.cancelDelete}
        type="warning"
      />

      {/* Delete All Orders Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteAllConfirm}
        onClose={() => {
          setShowDeleteAllConfirm(false);
          setDeleteAllConfirmText('');
          setDeleteAllError('');
        }}
        onConfirm={confirmDeleteAllOrders}
        title={t.confirmation.deleteAllTitle}
        message={t.confirmation.deleteAllMessage}
        confirmText={t.confirmation.confirmDelete}
        cancelText={t.confirmation.cancelDelete}
        reasonValue={deleteAllConfirmText}
        onReasonChange={(value) => {
          setDeleteAllConfirmText(value);
          setDeleteAllError('');
        }}
        reasonPlaceholder={t.confirmation.deleteAllPlaceholder}
        reasonError={deleteAllError}
        confirmDisabled={(deleteAllConfirmText || '').trim().toUpperCase() !== 'DELETE'}
        type="warning"
      />
    </AdminLayout>
  );
}
