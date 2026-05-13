'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, AlertTriangle, CheckCircle, Plus, Filter } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  type: 'certification_expiry' | 'renewal_due' | 'audit' | 'meeting' | 'reminder';
  date: string;
  time?: string;
  status: 'upcoming' | 'due' | 'overdue' | 'completed';
  certificationId?: string;
  frameworkId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, [currentDate, filterType]);

  const fetchEvents = async () => {
    try {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await fetch(`/api/calendar/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}&type=${filterType}`);
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'certification_expiry': return <AlertTriangle className="w-4 h-4" />;
      case 'renewal_due': return <Clock className="w-4 h-4" />;
      case 'audit': return <CheckCircle className="w-4 h-4" />;
      case 'meeting': return <CalendarIcon className="w-4 h-4" />;
      case 'reminder': return <Clock className="w-4 h-4" />;
      default: return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string, priority: string) => {
    const priorityColors: Record<string, string> = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-blue-100 text-blue-700 border-blue-200',
    };

    const typeColors: Record<string, string> = {
      certification_expiry: 'bg-red-50 text-red-600 border-red-200',
      renewal_due: 'bg-orange-50 text-orange-600 border-orange-200',
      audit: 'bg-green-50 text-green-600 border-green-200',
      meeting: 'bg-blue-50 text-blue-600 border-blue-200',
      reminder: 'bg-purple-50 text-purple-600 border-purple-200',
    };

    return priority === 'critical' || priority === 'high' ? priorityColors[priority] : typeColors[type];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'due': return 'bg-orange-100 text-orange-700';
      case 'upcoming': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const today = new Date();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 border border-gray-100"></div>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === today.toDateString();

      days.push(
        <div
          key={day}
          className={`h-24 border border-gray-100 p-2 overflow-hidden hover:bg-gray-50 transition-colors ${
            isToday ? 'bg-blue-50 border-blue-200' : ''
          }`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
              {day}
            </span>
            {dayEvents.length > 0 && (
              <Badge className="bg-blue-100 text-blue-700 text-xs">
                {dayEvents.length}
              </Badge>
            )}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded border truncate ${getEventColor(event.type, event.priority)}`}
                title={event.title}
              >
                <div className="flex items-center gap-1">
                  {getEventIcon(event.type)}
                  <span>{event.title}</span>
                </div>
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div key={i} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">
              {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </h3>
            {isToday && <Badge className="bg-blue-100 text-blue-700">Today</Badge>}
          </div>
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className={`p-3 rounded-lg border ${getEventColor(event.type, event.priority)}`}
              >
                <div className="flex items-start gap-2">
                  {getEventIcon(event.type)}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    <p className="text-xs opacity-75">{event.description}</p>
                    {event.time && <p className="text-xs opacity-75">{event.time}</p>}
                  </div>
                  <Badge className={getStatusColor(event.status)} size="sm">
                    {event.status}
                  </Badge>
                </div>
              </div>
            ))}
            {dayEvents.length === 0 && (
              <p className="text-gray-500 text-sm">No events scheduled</p>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h2>
        
        {dayEvents.length === 0 ? (
          <Card className="p-8 text-center">
            <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No events scheduled</h3>
            <p className="text-gray-600">There are no events for this day.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {dayEvents.map((event) => (
              <Card key={event.id} className={`p-6 border-l-4 ${getEventColor(event.type, event.priority).replace('bg-', 'border-l-').replace(' text-', '')}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${getEventColor(event.type, event.priority)}`}>
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h3>
                      <p className="text-gray-600 mb-2">{event.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {event.time && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{event.time}</span>
                          </div>
                        )}
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-700">
                          {event.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
              <p className="text-gray-600">View and manage compliance events and deadlines</p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Events</option>
                <option value="certification_expiry">Certification Expiry</option>
                <option value="renewal_due">Renewal Due</option>
                <option value="audit">Audit</option>
                <option value="meeting">Meeting</option>
                <option value="reminder">Reminder</option>
              </select>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </div>
          </div>

          {/* Calendar Controls */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                >
                  Month
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === 'day' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('day')}
                >
                  Day
                </Button>
              </div>
            </div>
          </Card>

          {/* Calendar View */}
          <Card className="p-6">
            {viewMode === 'month' && (
              <div>
                <div className="grid grid-cols-7 gap-0 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-gray-700 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0">
                  {renderMonthView()}
                </div>
              </div>
            )}
            
            {viewMode === 'week' && (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {renderWeekView()}
              </div>
            )}
            
            {viewMode === 'day' && renderDayView()}
          </Card>

          {/* Events Summary */}
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['certification_expiry', 'renewal_due', 'audit', 'meeting'].map((type) => {
                const typeEvents = events.filter(e => e.type === type);
                return (
                  <div key={type} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{typeEvents.length}</div>
                    <div className="text-sm text-gray-600 capitalize">{type.replace(/_/g, ' ')}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
