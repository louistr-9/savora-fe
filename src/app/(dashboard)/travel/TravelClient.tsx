'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, Plus, Plane, UtensilsCrossed, ShoppingBag, Sparkles,
  Loader2, Trash2, Check, ChevronRight, X, Pencil,
  Wallet, TrendingUp, CalendarDays, Target, Zap, RefreshCw,
  AlertCircle, ArrowRight, Flame, Clock, MapPin, ChevronLeft, Printer, List, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchPlaces } from '@/lib/api';
import { Plan, PlanType, createPlan, updatePlan, deletePlan, generateAISuggestions, chatWithPlanAI, PlanAIChatTurn } from './actions';
import { useDialog } from '@/components/ui/DialogProvider';
import dynamic from 'next/dynamic';

const TrackingMap = dynamic(() => import('@/components/TrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 dark:bg-slate-900 animate-pulse flex items-center justify-center text-slate-400 font-bold border border-[var(--border)] rounded-2xl">
      Đang tải bản đồ...
    </div>
  )
});
// ─── Types ───────────────────────────────────────────────────────────────────

interface FinancialContext {
  netBalance: number;
  avgMonthlyExpense: number;
  availableBudget: number;
  income: number;
  assets: any[];
}

interface Props {
  initialPlans: Plan[];
  financialContext: FinancialContext;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TRAVEL_STYLES = ['Biển', 'Núi & Thác', 'Phố cổ & Văn hóa', 'Nước ngoài', 'Hàn Quốc', 'Nhật Bản', 'Thái Lan'];

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}

function formatMoneyInput(value: string): string {
  const num = value.replace(/[^0-9]/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('vi-VN').format(Number(num));
}

function parseMoneyInput(value: any): string {
  if (value === undefined || value === null) return '';
  return String(value).replace(/[^0-9]/g, '');
}

function getWeatherEmoji(code: number) {
  if (code === 0) return '☀️';
  if (code >= 1 && code <= 3) return '⛅';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2-lat1);
  const dLon = deg2rad(lon2-lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; 
  return d;
}

async function fetchGeocodeAPI(q: string) {
  const goongKey = process.env.NEXT_PUBLIC_GOONG_API_KEY;
  if (goongKey) {
    try {
      const res = await fetch(`https://rsapi.goong.io/geocode?address=${encodeURIComponent(q)}&api_key=${goongKey}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return { lat: data.results[0].geometry.location.lat, lon: data.results[0].geometry.location.lng };
      }
    } catch (e) {}
  }

  try {
    const searchQ = buildOsmSearchQuery(q);
    
    // First try Nominatim (more accurate for full addresses)
    try {
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQ)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'SavoraApp/1.0' }
      });
      const nomData = await nomRes.json();
      if (nomData && nomData.length > 0) {
        return { lat: Number(nomData[0].lat), lon: Number(nomData[0].lon) };
      }
    } catch (e) {}

    // Fallback to Photon
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchQ)}&limit=1`);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      return { lat: data.features[0].geometry.coordinates[1], lon: data.features[0].geometry.coordinates[0] };
    }
  } catch (e) {}

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`, {
      headers: { 'Accept-Language': 'vi,en' }
    });
    const data = await res.json();
    if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch (e) {}

  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=vi&format=json`);
    const data = await res.json();
    if (data.results?.[0]) return { lat: data.results[0].latitude, lon: data.results[0].longitude };
  } catch (e) {}
  return null;
}

function buildOsmSearchQuery(baseQuery: string, destination?: string) {
  let cleaned = baseQuery;
  if (destination) {
    const idx = cleaned.toLowerCase().indexOf(destination.toLowerCase());
    if (idx !== -1) {
      cleaned = cleaned.substring(0, idx).trim().replace(/,+$/, '').trim();
    }
  }
  // Remove common confusing suffixes that Google Maps adds
  cleaned = cleaned.replace(/,?\s*(Hồ Chí Minh|Ho Chi Minh City|Ho Chi Minh|Vietnam|Việt Nam|Hanoi|Hà Nội)$/ig, '').trim();
  
  if (destination && cleaned) {
    return `${cleaned}, ${destination}`;
  }
  return cleaned || destination || '';
}

async function geocodeLocation(query: string): Promise<{ lat: number, lon: number } | null> {
  if (!query) return null;
  // 1. Direct coordinate format
  const coordMatch = query.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (coordMatch) {
    return { lat: parseFloat(coordMatch[1]), lon: parseFloat(coordMatch[3]) };
  }
  
  // 2. Try full query
  let result = await fetchGeocodeAPI(query);
  if (result) return result;
  
  // 3. Fallback: Drop the first segment (usually specific house number/street) which often fails in free APIs
  if (query.includes(',')) {
    const parts = query.split(',').map(s => s.trim());
    if (parts.length > 1) {
      const broaderQuery = parts.slice(1).join(', ');
      result = await fetchGeocodeAPI(broaderQuery);
      if (result) return result;
    }
  }

  return null;
}

function LocationAutocomplete({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder: string }) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const fetchSuggestions = async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }

    const goongKey = process.env.NEXT_PUBLIC_GOONG_API_KEY;
    if (goongKey) {
      try {
        const res = await fetch(`https://rsapi.goong.io/Place/AutoComplete?api_key=${goongKey}&input=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data.predictions) {
          // Note: Autocomplete doesn't return lat/lon directly, we mock it or fetch detail, 
          // but for this input we just need display_name. The geocode will be called later when used.
          const mapped = data.predictions.map((p: any) => ({
            display_name: p.description,
            lat: 0, 
            lon: 0,
            place_id: p.place_id
          }));
          setSuggestions(mapped);
          return;
        }
      } catch (e) {}
    }

    try {
      const q = buildOsmSearchQuery(query);
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      if (data.features) {
        const mapped = data.features.map((f: any) => {
          const p = f.properties;
          const nameParts = [p.name, p.street, p.district, p.city, p.state, p.country].filter(Boolean);
          const unique = Array.from(new Set(nameParts));
          return { display_name: unique.join(', '), lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] };
        });
        setSuggestions(mapped);
        return;
      }
    } catch (e) {}

    // Fallback to nominatim
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=vn`, {
        headers: { 'Accept-Language': 'vi,en' }
      });
      const data = await res.json();
      setSuggestions(data || []);
    } catch (e) {
      setSuggestions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setShowDropdown(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 500);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => { if (query) setShowDropdown(true); }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-[var(--border)] focus:border-blue-400 focus:outline-none text-sm"
      />
      <AnimatePresence>
        {showDropdown && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-60 overflow-y-auto"
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => {
                  // use onMouseDown instead of onClick to prevent onBlur from closing it too early
                  e.preventDefault(); 
                  setQuery(s.display_name);
                  onChange(s.display_name);
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-start gap-3 border-b border-slate-50 dark:border-slate-800 last:border-0"
              >
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-snug">{s.display_name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Plan Card ─────────────────────────────────────────────────────────────

function PlanCard({ plan, onEdit, onDelete, onComplete, onClick, onViewTracking }: {
  plan: Plan;
  onEdit: (p: Plan) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onClick: (p: Plan) => void;
  onViewTracking?: (p: Plan) => void;
}) {
  const TypeIcon = Plane;
  
  let displayBudget = Number(plan.budget) || 0;
  if (displayBudget === 0 && plan.metadata?.itinerary) {
     Object.values(plan.metadata.itinerary).forEach((dayArr: any) => {
        dayArr.forEach((loc: any) => {
           displayBudget += Number(loc.cost) || 0;
        });
     });
  }

  const progress = displayBudget > 0 ? Math.min((plan.current_saved / displayBudget) * 100, 100) : 0;
  const isDone = plan.status === 'completed';

  const daysLeft = plan.deadline
    ? (() => {
        const deadlineDate = new Date(plan.deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.round((deadlineDate.getTime() - today.getTime()) / 86400000);
      })()
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onClick(plan)}
      className={cn(
        'group relative bg-card border rounded-2xl p-5 transition-all duration-200 hover:shadow-md cursor-pointer',
        isDone ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-600'
      )}
    >
      {/* Status badge */}
      {isDone && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-[11px] font-bold">
          <Check className="w-3 h-3" /> Hoàn thành
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', typeInfo.bg)}>
          <TypeIcon className={cn('w-5 h-5', typeInfo.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-[15px] leading-tight truncate pr-6">{plan.title}</h3>
          <p className={cn('text-xs font-medium mt-0.5', typeInfo.color)}>{typeInfo.label}</p>
        </div>
      </div>

      {/* Budget + Progress */}
      {displayBudget > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-foreground/50">Đã tiêu / Tổng phí</span>
            <span className="text-xs font-bold text-foreground">
              {formatNumber(plan.current_saved)} / {formatNumber(displayBudget)}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={cn('h-full rounded-full', typeInfo.solid)}
            />
          </div>
          <p className="text-right text-[11px] text-foreground/40 mt-1">{progress.toFixed(0)}%</p>
        </div>
      )}

      {/* Footer info */}
      <div className="flex items-center gap-3 text-[11px] text-foreground/50">
        {daysLeft !== null && (
          <span className={cn(
            'flex items-center gap-1',
            daysLeft < 7 && daysLeft >= 0 ? 'text-amber-500 font-semibold' : '',
            daysLeft < 0 ? 'text-rose-500 font-semibold' : ''
          )}>
            <CalendarDays className="w-3 h-3" />
            {daysLeft < 0 ? 'Đã qua' : daysLeft === 0 ? 'Hôm nay!' : `${daysLeft} ngày nữa`}
          </span>
        )}
        {plan.ai_suggestions && (
          <span className="flex items-center gap-1 text-violet-500">
            <Sparkles className="w-3 h-3" /> AI đã gợi ý
          </span>
        )}
      </div>

      {/* Actions (hover) */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {plan.type === 'travel' && !isDone && (
          <button
            onClick={(e) => { e.stopPropagation(); onViewTracking?.(plan); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs transition-colors border border-blue-200 mr-1"
            title="Bắt đầu đi Tour"
          >
            <Map className="w-3.5 h-3.5" /> Đi Tour
          </button>
        )}
        {!isDone && (
          <button
            onClick={(e) => { e.stopPropagation(); onComplete(plan.id); }}
            className="p-1.5 rounded-lg text-foreground/30 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            title="Đánh dấu hoàn thành"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(plan); }}
          className="p-1.5 rounded-lg text-foreground/30 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          title="Chỉnh sửa"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(plan.id); }}
          className="p-1.5 rounded-lg text-foreground/30 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
          title="Xóa kế hoạch"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── AI Suggestion Card ───────────────────────────────────────────────────────

function AISuggestionCard({ suggestion, type, onSelect }: {
  suggestion: any;
  type: PlanType;
  onSelect?: () => void;
}) {
  const [showMap, setShowMap] = useState(false);
  const isTravel = type === 'travel';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-[var(--border)] rounded-2xl p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
      onClick={onSelect}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{suggestion.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-foreground">{suggestion.name}</h4>
            {suggestion.match_score && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                {suggestion.match_score}% phù hợp
              </span>
            )}
          </div>
          {isTravel && suggestion.location && (
            <p className="text-xs text-foreground/50 mt-0.5">{suggestion.location}</p>
          )}
          {!isTravel && suggestion.type && (
            <p className="text-xs text-foreground/50 mt-0.5">{suggestion.type}</p>
          )}
        </div>
      </div>

      {isTravel && suggestion.estimated_cost && (
        <div className="mb-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
            Ước tính: {formatCurrency(suggestion.estimated_cost)}
          </p>
        </div>
      )}

      {!isTravel && suggestion.price_range && (
        <div className="mb-3 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
          <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
            {suggestion.price_range}
          </p>
        </div>
      )}

      <p className="text-xs text-foreground/60 mb-3 italic">"{suggestion.vibe}"</p>

      {isTravel && suggestion.highlights && (
        <div className="flex flex-wrap gap-1">
          {suggestion.highlights.slice(0, 3).map((h: string, i: number) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-foreground/60">
              {h}
            </span>
          ))}
        </div>
      )}

      {!isTravel && suggestion.must_try && (
        <div className="flex flex-wrap gap-1 mb-3">
          {suggestion.must_try.slice(0, 2).map((m: string, i: number) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600">
              {m}
            </span>
          ))}
        </div>
      )}

      {/* Map Preview */}
      {suggestion.route?.waypoints?.length > 0 && (
        <div className="mt-2 mb-2">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowMap(!showMap); }}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-500 hover:text-blue-600 transition-colors"
          >
            <Map className="w-3.5 h-3.5" /> 
            {showMap ? 'Ẩn bản đồ' : 'Xem lộ trình trên bản đồ'}
            <span className="text-foreground/40 font-normal ml-1">({suggestion.route.distance_km}km - Dự kiến ~{formatCurrency(suggestion.route.estimated_gas_cost)} xăng)</span>
          </button>
          
          <AnimatePresence>
            {showMap && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-3"
              >
                <iframe
                  width="100%"
                  height="200"
                  style={{ border: 0, borderRadius: '12px' }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&origin=${encodeURIComponent(suggestion.route.waypoints[0]?.name || suggestion.route.waypoints[0])}&destination=${encodeURIComponent(suggestion.route.waypoints[suggestion.route.waypoints.length - 1]?.name || suggestion.route.waypoints[suggestion.route.waypoints.length - 1])}${suggestion.route.waypoints.length > 2 ? `&waypoints=${suggestion.route.waypoints.slice(1, -1).map((w: any) => encodeURIComponent(w.name || w)).join('|')}` : ''}`}
                ></iframe>
                
                {/* External Links for Waypoints */}
                <div className="mt-3 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider">Khám phá địa điểm:</span>
                  <div className="flex flex-wrap gap-2">
                    {suggestion.route.waypoints.map((w: any, idx: number) => {
                      const placeName = w.name || w;
                      if (!placeName) return null;
                      return (
                        <div key={idx} className="flex items-center gap-1.5 bg-background/50 p-1.5 rounded-md border border-border/50">
                          <span className="text-[11px] font-medium text-foreground truncate max-w-[100px]">{placeName}</span>
                          <a 
                            href={`https://www.tiktok.com/search?q=${encodeURIComponent(placeName + ' review')}`}
                            target="_blank" rel="noreferrer"
                            className="text-[10px] px-1.5 py-0.5 rounded bg-black text-white hover:bg-zinc-800 transition-colors flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                            TikTok
                          </a>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}`}
                            target="_blank" rel="noreferrer"
                            className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-teal text-white hover:bg-emerald-teal/90 transition-colors flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Map className="w-2.5 h-2.5" />
                            Maps
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {onSelect && (
        <div className="mt-3 flex items-center justify-end gap-1 text-xs font-semibold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
          Chọn gợi ý này <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TravelClient({ initialPlans, financialContext }: Props) {
  const router = useRouter();
  const { showAlert, showConfirm } = useDialog();
  const [isPending, startTransition] = useTransition();
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [filter, setFilter] = useState<'all' | PlanType>('all');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [step, setStep] = useState(1); // 1: info, 2: AI, 3: done
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [createdPlanId, setCreatedPlanId] = useState<string | null>(null);
  const [viewingPlan, setViewingPlan] = useState<Plan | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Manual Itinerary state
  const [activeDay, setActiveDay] = useState(1);
  const [previewMobileView, setPreviewMobileView] = useState<'timeline'|'map'>('timeline');
  const [editMobileView, setEditMobileView] = useState<'timeline'|'map'>('timeline');
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [actualCostModal, setActualCostModal] = useState<{ isOpen: boolean; item: any; day: number; actualCost: string } | null>(null);
  const [newLocationForm, setNewLocationForm] = useState<{
    id?: string;
    name: string;
    place_id: string;
    photo_url: string;
    address: string;
    cost: string;
    day: number;
    startTime: string;
    endTime: string;
    lat: string;
    lon: string;
    note?: string;
    isTimeEstimated?: boolean;
  }>({
    name: '',
    place_id: '',
    photo_url: '',
    address: '',
    cost: '',
    day: 1,
    startTime: '09:00',
    endTime: '10:00',
    lat: '',
    lon: '',
    note: '',
    isTimeEstimated: false
  });

  // Places Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Weather & Distance state
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);

  // AI Chat Assistant state
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<PlanAIChatTurn[]>([{ role: 'assistant', content: 'Chào bạn! Mình là Trợ lý AI Savora. Mình có thể giúp gì cho lịch trình của bạn hôm nay?' }]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, showAIChat]);


  useEffect(() => {
    if (viewingPlan?.metadata?.destination) {
      const fetchContextData = async () => {
        try {
          const dest = viewingPlan.metadata.destination;
          const destCoords = await geocodeLocation(dest);
          
          if (destCoords) {
            const { lat: latitude, lon: longitude } = destCoords;

            // 1. Calculate Real Distance using Departure Location
            if (viewingPlan.metadata.departureLocation) {
              const depCoords = await geocodeLocation(viewingPlan.metadata.departureLocation);
              if (depCoords) {
                const { lat: depLat, lon: depLon } = depCoords;
                
                try {
                  // Fetch real driving distance from OSRM
                  const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${depLon},${depLat};${longitude},${latitude}?overview=false`);
                  const osrmData = await osrmRes.json();
                  if (osrmData.routes?.[0]) {
                    setRouteDistance(osrmData.routes[0].distance / 1000);
                  } else {
                    // Fallback to straight line * 1.3 if routing fails
                    const dist = getDistanceFromLatLonInKm(depLat, depLon, latitude, longitude) * 1.3;
                    setRouteDistance(dist);
                  }
                } catch (e) {
                  const dist = getDistanceFromLatLonInKm(depLat, depLon, latitude, longitude) * 1.3;
                  setRouteDistance(dist);
                }
              } else {
                setRouteDistance(null);
              }
            } else {
              setRouteDistance(null);
            }

            // 2. Fetch Weather
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
            const weatherJson = await weatherRes.json();
            
            if (weatherJson.daily) {
              const formatted = weatherJson.daily.time.map((time: string, index: number) => ({
                date: time,
                code: weatherJson.daily.weathercode[index],
                tempMax: Math.round(weatherJson.daily.temperature_2m_max[index]),
                tempMin: Math.round(weatherJson.daily.temperature_2m_min[index]),
              }));
              setWeatherData(formatted);
            }
          }
        } catch (e) {
          console.error("Failed to fetch weather/distance", e);
        }
      };
      fetchContextData();
    } else {
      setWeatherData([]);
      setRouteDistance(null);
    }
  }, [viewingPlan]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    
    setShowSearchDropdown(true);
    setIsSearchingPlaces(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const goongKey = process.env.NEXT_PUBLIC_GOONG_API_KEY;
        if (goongKey) {
          try {
            const res = await fetch(`https://rsapi.goong.io/Place/AutoComplete?api_key=${goongKey}&input=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data.predictions) {
              const mapped = data.predictions.map((p: any) => ({
                place_id: p.place_id,
                name: p.description.split(',')[0],
                address: p.description
              }));
              setSearchResults(mapped);
              return;
            }
          } catch (e) {
            console.log("Goong API failed, falling back to Photon...");
          }
        }

        const q = buildOsmSearchQuery(searchQuery, viewingPlan?.metadata?.destination);
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=10`);
        const data = await res.json();
        if (data.features) {
          const mapped = data.features.map((f: any) => {
            const p = f.properties;
            const nameParts = [p.street, p.district, p.city, p.state, p.country].filter(Boolean);
            const unique = Array.from(new Set(nameParts));
            return {
              place_id: f.properties.osm_id?.toString() || Math.random().toString(),
              name: p.name || p.street || 'Địa điểm',
              address: unique.join(', ') || '',
              lat: f.geometry?.coordinates?.[1],
              lon: f.geometry?.coordinates?.[0]
            };
          });
          setSearchResults(mapped);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'travel' as PlanType,
    budget: '',
    current_saved: '',
    deadline: '',
    notes: '',
    // Shared metadata
    departureLocation: '',
    destination: '',
    days: '3',
    people: '2',
    // Funding
    fundingSourceType: 'available' as 'available' | 'asset' | 'borrowed',
    fundingAssetId: '',
  });

  const filteredPlans = filter === 'all' ? plans : plans.filter(p => p.type === filter);
  const activePlans = plans.filter(p => p.status === 'active');
  const totalBudget = activePlans.reduce((s, p) => s + Number(p.budget), 0);
  const totalSaved = activePlans.reduce((s, p) => s + Number(p.current_saved), 0);

  // Compute funding source limit and color
  const budgetVal = Number(parseMoneyInput(formData.budget)) || 0;
  let fundingMax = 0;
  if (formData.fundingSourceType === 'available') fundingMax = financialContext.netBalance;
  else if (formData.fundingSourceType === 'asset') fundingMax = financialContext.assets?.find(a => a.id === formData.fundingAssetId)?.value || 0;

  let fundingColorClass = 'border-[var(--border)] bg-slate-50 dark:bg-slate-900/50';
  if (budgetVal > 0 && formData.fundingSourceType !== 'borrowed') {
    if (budgetVal > fundingMax) fundingColorClass = 'border-rose-500 bg-rose-50 dark:bg-rose-900/20';
    else if (budgetVal >= fundingMax * 0.8 && fundingMax > 0) fundingColorClass = 'border-amber-500 bg-amber-50 dark:bg-amber-900/20';
    else fundingColorClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
  }

  function resetForm() {
    setFormData({ title: '', type: 'travel', budget: '', current_saved: '', deadline: '', notes: '', departureLocation: '', destination: '', days: '3', people: '2', fundingSourceType: 'available', fundingAssetId: '' });
    setStep(1);
    setAiResult(null);
    setCreatedPlanId(null);
    setEditingPlan(null);
  }

  function openCreateModal() {
    resetForm();
    setShowCreateModal(true);
  }

  function openEditModal(plan: Plan) {
    setFormData({
      title: plan.title,
      type: plan.type,
      budget: plan.budget.toString(),
      current_saved: plan.current_saved.toString(),
      deadline: plan.deadline || '',
      notes: plan.notes || '',
      departureLocation: plan.metadata?.departureLocation || '',
      destination: plan.metadata?.destination || '',
      days: plan.metadata?.days?.toString() || '3',
      people: plan.metadata?.people?.toString() || '2',
      fundingSourceType: plan.metadata?.fundingSourceType || 'available',
      fundingAssetId: plan.metadata?.fundingAssetId || '',
    });
    setEditingPlan(plan);
    setStep(1);
    setShowCreateModal(true);
  }

  async function handleSavePlan() {
    if (!formData.title.trim()) return showAlert('Vui lòng nhập tên kế hoạch');

    const metadata = {
      departureLocation: formData.departureLocation,
      destination: formData.destination,
      days: Number(formData.days),
      people: Number(formData.people),
      fundingSourceType: formData.fundingSourceType,
      fundingAssetId: formData.fundingAssetId,
    };

    const payload = {
      title: formData.title.trim(),
      type: formData.type,
      budget: Number(parseMoneyInput(formData.budget)) || 0,
      current_saved: Number(parseMoneyInput(formData.current_saved)) || 0,
      deadline: formData.deadline || null,
      notes: formData.notes || null,
      metadata,
    };

    startTransition(async () => {
      try {
        if (editingPlan) {
          const updated = await updatePlan(editingPlan.id, payload);
          setPlans(prev => prev.map(p => p.id === editingPlan.id ? { ...p, ...payload } : p));
          setShowCreateModal(false);
          resetForm();
        } else {
          const created = await createPlan(payload);
          setCreatedPlanId(created.id);
          setPlans(prev => [created, ...prev]);
          setShowCreateModal(false);
          resetForm();
        }
      } catch (e) {
        showAlert('Có lỗi xảy ra, vui lòng thử lại');
      }
    });
  }

  async function handleSendAIChat() {
    if (!chatInput.trim() || !viewingPlan || isChatting) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    
    const newUserTurn: PlanAIChatTurn = { role: 'user', content: userMessage };
    const updatedHistory = [...chatHistory, newUserTurn];
    setChatHistory(updatedHistory);
    setIsChatting(true);

    const dest = viewingPlan.metadata?.destination || 'Việt Nam';
    const days = Number(viewingPlan.metadata?.days) || 3;
    const budget = Number(viewingPlan.budget) || 0;

    const res = await chatWithPlanAI(viewingPlan.id, dest, days, budget, chatHistory, userMessage);
    
    setIsChatting(false);

    if (res.error === 'no_api_key') {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Bạn cần cài đặt Gemini API Key trong phần Cài đặt để sử dụng mình nhé! 🔑' }]);
      return;
    }

    if (!res.success || !res.response) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Xin lỗi, mình đang gặp sự cố kết nối. Lỗi: ${res.error || 'Không rõ'}` }]);
      return;
    }

    setChatHistory(prev => [...prev, { 
      role: 'assistant', 
      content: JSON.stringify(res.response) // We'll parse this in the render function
    }]);
  }

  async function handleAddSuggestedLocation(loc: any) {
    if (!viewingPlan) return;
    
    const itinerary = viewingPlan.metadata?.itinerary || {};
    const dayLocations = itinerary[activeDay] || [];
    
    let lat = '';
    let lon = '';
    try {
      const q = buildOsmSearchQuery(loc.name, viewingPlan.metadata?.destination);
      const coords = await geocodeLocation(q);
      if (coords) {
        lat = coords.lat.toString();
        lon = coords.lon.toString();
      } else {
        const fallbackCoords = await geocodeLocation(loc.name);
        if (fallbackCoords) {
          lat = fallbackCoords.lat.toString();
          lon = fallbackCoords.lon.toString();
        }
      }
    } catch (e) {}

    const newLoc = {
      id: 'loc_' + Date.now(),
      name: loc.name,
      place_id: '',
      photo_url: '',
      address: loc.address,
      cost: loc.cost || 0,
      startTime: loc.duration ? loc.duration.split('-')[0].trim() : '09:00',
      endTime: loc.duration ? loc.duration.split('-')[1]?.trim() : '10:00',
      lat,
      lon,
      note: ''
    };
    
    const newItinerary = {
      ...itinerary,
      [activeDay]: [...dayLocations, newLoc].sort((a, b) => a.startTime.localeCompare(b.startTime))
    };
    
    const newMetadata = { ...viewingPlan.metadata, itinerary: newItinerary };
    const updatedPlan = { ...viewingPlan, metadata: newMetadata };
    
    setViewingPlan(updatedPlan);
    setPlans(prev => prev.map(p => p.id === viewingPlan.id ? updatedPlan : p));
    
    try {
      startTransition(async () => {
        await updatePlan(viewingPlan.id, { metadata: newMetadata });
      });
      showAlert(`Đã thêm "${loc.name}" vào Ngày ${activeDay}!`);
    } catch {
      showAlert('Có lỗi khi lưu lịch trình');
    }
  }

  async function handleAddManualLocation() {
    if (!newLocationForm.name.trim()) return showAlert('Vui lòng nhập tên địa điểm');
    if (!viewingPlan) return;
    
    const itinerary = viewingPlan.metadata?.itinerary || {};
    const dayLocations = itinerary[newLocationForm.day] || [];
    
    let lat = newLocationForm.lat || '';
    let lon = newLocationForm.lon || '';
    if (!lat || !lon) {
      try {
        const searchStr = newLocationForm.address.trim() || newLocationForm.name.trim();
        const q = buildOsmSearchQuery(searchStr, viewingPlan.metadata?.destination);
        const coords = await geocodeLocation(q);
        if (coords) {
          lat = coords.lat.toString();
          lon = coords.lon.toString();
        } else if (newLocationForm.name.trim()) {
          // Fallback to name only
          const qName = buildOsmSearchQuery(newLocationForm.name.trim(), viewingPlan.metadata?.destination);
          const nameCoords = await geocodeLocation(qName);
          if (nameCoords) {
            lat = nameCoords.lat.toString();
            lon = nameCoords.lon.toString();
          }
        }
      } catch (e) {}
    }

    const newLoc = {
      id: newLocationForm.id || 'loc_' + Date.now(),
      name: newLocationForm.name.trim(),
      place_id: newLocationForm.place_id,
      photo_url: newLocationForm.photo_url,
      address: newLocationForm.address,
      cost: Number(parseMoneyInput(newLocationForm.cost)) || 0,
      startTime: newLocationForm.startTime,
      endTime: newLocationForm.endTime,
      lat,
      lon,
      note: newLocationForm.note?.trim() || ''
    };
    
    let newItinerary = { ...itinerary };

    if (newLocationForm.id) {
      Object.keys(newItinerary).forEach(d => {
        newItinerary[Number(d)] = newItinerary[Number(d)].filter((l: any) => l.id !== newLocationForm.id);
      });
    }

    const currentDayLocations = newItinerary[newLocationForm.day] || [];
    newItinerary[newLocationForm.day] = [...currentDayLocations, newLoc].sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    const newMetadata = { ...viewingPlan.metadata, itinerary: newItinerary };
    const updatedPlan = { ...viewingPlan, metadata: newMetadata };
    
    setViewingPlan(updatedPlan);
    setPlans(prev => prev.map(p => p.id === viewingPlan.id ? updatedPlan : p));
    setShowAddLocationModal(false);
    setNewLocationForm({ name: '', place_id: '', photo_url: '', address: '', note: '', cost: '', day: activeDay, startTime: '09:00', endTime: '10:00', lat: '', lon: '' });
    
    try {
      await updatePlan(viewingPlan.id, { metadata: newMetadata });
    } catch {
      showAlert('Có lỗi khi lưu lịch trình');
    }
  }

  async function handleDeleteManualLocation(day: number, locId: string) {
    if (!viewingPlan) return;
    const confirmed = await showConfirm('Xóa địa điểm này khỏi lịch trình?');
    if (!confirmed) return;

    const itinerary = viewingPlan.metadata?.itinerary || {};
    const dayLocations = itinerary[day] || [];
    
    const newItinerary = {
      ...itinerary,
      [day]: dayLocations.filter((l: any) => l.id !== locId)
    };
    
    const newMetadata = { ...viewingPlan.metadata, itinerary: newItinerary };
    const updatedPlan = { ...viewingPlan, metadata: newMetadata };
    
    setViewingPlan(updatedPlan);
    setPlans(prev => prev.map(p => p.id === viewingPlan.id ? updatedPlan : p));
    
    try {
      await updatePlan(viewingPlan.id, { metadata: newMetadata });
    } catch {
      showAlert('Có lỗi khi xóa địa điểm');
    }
  }

  async function handleToggleVisitedLocation(day: number, locId: string) {
    if (!viewingPlan) return;

    const itinerary = viewingPlan.metadata?.itinerary || {};
    const dayLocations = itinerary[day] || [];
    
    const newItinerary = {
      ...itinerary,
      [day]: dayLocations.map((l: any) => l.id === locId ? { ...l, visited: !l.visited } : l)
    };
    
    const newMetadata = { ...viewingPlan.metadata, itinerary: newItinerary };
    const updatedPlan = { ...viewingPlan, metadata: newMetadata };
    
    setViewingPlan(updatedPlan);
    setPlans(prev => prev.map(p => p.id === viewingPlan.id ? updatedPlan : p));
    
    try {
      startTransition(async () => {
        await updatePlan(viewingPlan.id, { metadata: newMetadata });
      });
    } catch {
      showAlert('Có lỗi khi lưu trạng thái');
    }
  }

  async function handleSaveActualCost() {
    if (!viewingPlan || !actualCostModal) return;
    const { item, day, actualCost } = actualCostModal;
    
    const itinerary = viewingPlan.metadata?.itinerary || {};
    const dayLocations = itinerary[day] || [];
    
    const updatedDayLocations = dayLocations.map((loc: any) => {
      if (loc.id === item.id) {
        return { ...loc, isDone: true, actualCost: Number(parseMoneyInput(actualCost)) || 0 };
      }
      return loc;
    });
    
    const newItinerary = {
      ...itinerary,
      [day]: updatedDayLocations
    };
    
    const newMetadata = { ...viewingPlan.metadata, itinerary: newItinerary };
    const updatedPlan = { ...viewingPlan, metadata: newMetadata };
    
    setViewingPlan(updatedPlan);
    setPlans(prev => prev.map(p => p.id === viewingPlan.id ? updatedPlan : p));
    setActualCostModal(null);
    
    startTransition(async () => {
      try {
        await updatePlan(viewingPlan.id, { metadata: newMetadata });
        showAlert(`Đã đánh dấu hoàn thành "${item.name}"!`);
      } catch {
        showAlert('Có lỗi khi cập nhật', { destructive: true });
      }
    });
  }

  async function handleDelete(id: string) {
    const confirmed = await showConfirm('Hành động này không thể hoàn tác.', { title: 'Xóa kế hoạch này?', destructive: true });
    if (!confirmed) return;
    startTransition(async () => {
      await deletePlan(id);
      setPlans(prev => prev.filter(p => p.id !== id));
    });
  }

  async function handleComplete(id: string) {
    const confirmed = await showConfirm('Đánh dấu kế hoạch đã hoàn thành?');
    if (!confirmed) return;
    startTransition(async () => {
      await updatePlan(id, { status: 'completed' });
      setPlans(prev => prev.map(p => p.id === id ? { ...p, status: 'completed' } : p));
    });
  }



  // Dynamic calculation for viewing plan budget status
  let viewingTotalCost = 0;
  let viewingFundingMax = 0;
  let viewingBudgetColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600';
  let viewingTotalItineraryDistance = 0;
  
  if (viewingPlan) {
    if (viewingPlan.metadata?.itinerary) {
      const allLocs = Object.values(viewingPlan.metadata.itinerary).flatMap((arr: any) => arr);
      allLocs.forEach((loc: any, idx: number) => {
        viewingTotalCost += Number(loc.cost) || 0;
        const nextLoc = allLocs[idx + 1];
        if (nextLoc && loc.lat && loc.lon && nextLoc.lat && nextLoc.lon) {
          const R = 6371; // km
          const dLat = (Number(nextLoc.lat) - Number(loc.lat)) * Math.PI / 180;
          const dLon = (Number(nextLoc.lon) - Number(loc.lon)) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(Number(loc.lat) * Math.PI / 180) * Math.cos(Number(nextLoc.lat) * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          viewingTotalItineraryDistance += R * c;
        }
      });
    }
    
    viewingFundingMax = viewingPlan.metadata?.fundingSourceType === 'available' 
      ? financialContext.netBalance 
      : viewingPlan.metadata?.fundingSourceType === 'borrowed' 
        ? Infinity 
        : (financialContext.assets?.find(a => a.id === viewingPlan.metadata?.fundingAssetId)?.value || 0);

    if (viewingTotalCost > 0 && viewingFundingMax > 0 && viewingFundingMax !== Infinity) {
      if (viewingTotalCost > viewingFundingMax) {
         viewingBudgetColor = 'bg-rose-50 dark:bg-rose-900/20 text-rose-600';
      } else if (viewingTotalCost > viewingFundingMax * 0.8) {
         viewingBudgetColor = 'bg-amber-50 dark:bg-amber-900/20 text-amber-600';
      } else {
         viewingBudgetColor = 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600';
      }
    }
  }

  const getMainMapSrc = () => {
    if (!viewingPlan) return '';
    const departure = viewingPlan.metadata?.departureLocation;
    const dest = viewingPlan.metadata?.destination || 'Vietnam';
    
    const itinerary = viewingPlan.metadata?.itinerary || {};
    const days = Object.keys(itinerary).sort((a,b) => Number(a) - Number(b));
    const allLocs = days.flatMap(day => itinerary[day as any]);

    if (allLocs.length > 0) {
      if (departure) {
        const waypoints = allLocs.map((l: any) => l.address || l.name);
        const lastLoc = waypoints.pop()!;
        if (waypoints.length > 0) {
          return `https://maps.google.com/maps?saddr=${encodeURIComponent(departure)}&daddr=${waypoints.map(w => encodeURIComponent(w)).join('+to:')}+to:${encodeURIComponent(lastLoc)}&t=&z=10&ie=UTF8&iwloc=&output=embed`;
        } else {
          return `https://maps.google.com/maps?saddr=${encodeURIComponent(departure)}&daddr=${encodeURIComponent(lastLoc)}&t=&z=10&ie=UTF8&iwloc=&output=embed`;
        }
      } else {
        if (allLocs.length > 1) {
          const waypoints = allLocs.map((l: any) => l.address || l.name);
          const firstLoc = waypoints.shift()!;
          const lastLoc = waypoints.pop()!;
          if (waypoints.length > 0) {
            return `https://maps.google.com/maps?saddr=${encodeURIComponent(firstLoc)}&daddr=${waypoints.map(w => encodeURIComponent(w)).join('+to:')}+to:${encodeURIComponent(lastLoc)}&t=&z=12&ie=UTF8&iwloc=&output=embed`;
          } else {
            return `https://maps.google.com/maps?saddr=${encodeURIComponent(firstLoc)}&daddr=${encodeURIComponent(lastLoc)}&t=&z=12&ie=UTF8&iwloc=&output=embed`;
          }
        } else {
          return `https://maps.google.com/maps?q=${encodeURIComponent(allLocs[0].address || allLocs[0].name)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
        }
      }
    } else {
      if (departure) {
        return `https://maps.google.com/maps?saddr=${encodeURIComponent(departure)}&daddr=${encodeURIComponent(dest)}&t=&z=10&ie=UTF8&iwloc=&output=embed`;
      } else {
        return `https://maps.google.com/maps?q=${encodeURIComponent(dest)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* ── HEADER ── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Map className="w-5 h-5 text-blue-500" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Kế Hoạch</h1>
          </div>
          <p className="text-sm text-foreground/50 ml-13">Lên kế hoạch thông minh theo ngân sách thực tế của bạn</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Tạo kế hoạch
        </button>
      </div>

      {/* ── BUDGET SUMMARY BAR ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-[var(--border)] rounded-2xl p-4">
          <p className="text-xs text-foreground/50 mb-1">Số dư khả dụng</p>
          <p className="text-xl font-bold font-heading text-emerald-500">{formatNumber(financialContext.netBalance)}</p>
          <p className="text-[11px] text-foreground/40 mt-0.5">Có thể dùng cho plan</p>
        </div>
        <div className="bg-card border border-[var(--border)] rounded-2xl p-4">
          <p className="text-xs text-foreground/50 mb-1">Gợi ý dành cho plan</p>
          <p className="text-xl font-bold font-heading text-blue-500">{formatNumber(financialContext.availableBudget)}</p>
          <p className="text-[11px] text-foreground/40 mt-0.5">≈ 30% số dư hiện tại</p>
        </div>
        <div className="bg-card border border-[var(--border)] rounded-2xl p-4">
          <p className="text-xs text-foreground/50 mb-1">Tổng ngân sách plans</p>
          <p className="text-xl font-bold font-heading text-foreground">{formatNumber(totalBudget)}</p>
          <p className="text-[11px] text-foreground/40 mt-0.5">{activePlans.length} kế hoạch đang active</p>
        </div>
        <div className="bg-card border border-[var(--border)] rounded-2xl p-4">
          <p className="text-xs text-foreground/50 mb-1">Đã tiết kiệm được</p>
          <p className="text-xl font-bold font-heading text-violet-500">{formatNumber(totalSaved)}</p>
          <p className="text-[11px] text-foreground/40 mt-0.5">
            {totalBudget > 0 ? `${((totalSaved / totalBudget) * 100).toFixed(0)}% mục tiêu` : '—'}
          </p>
        </div>
      </div>


      {/* ── PLAN GRID ── */}
      {filteredPlans.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
            <Map className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="font-bold text-lg text-foreground mb-2">Chưa có kế hoạch nào</h3>
          <p className="text-sm text-foreground/50 max-w-sm mb-6">
            Hãy tạo kế hoạch đầu tiên — du lịch, ăn uống, hay mua sắm — và để Savora giúp bạn đạt được mục tiêu theo ngân sách thực tế.
          </p>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Tạo kế hoạch đầu tiên
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredPlans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onComplete={handleComplete}
                onClick={setViewingPlan}
                onViewTracking={(p: Plan) => { setViewingPlan(p); setShowPreview(true); }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[120] flex flex-col sm:items-center sm:justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-card w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[var(--border)]"
            >
              {/* Modal header */}
              <div className="p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', typeInfo.bg)}>
                    <typeInfo.icon className={cn('w-4 h-4', typeInfo.color)} />
                  </div>
                  <h3 className="font-heading font-bold text-base">
                    {editingPlan ? 'Sửa kế hoạch' : step === 1 ? 'Tạo kế hoạch' : step === 2 ? 'Gợi ý AI' : 'Gợi ý cho bạn'}
                  </h3>
                </div>
                <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <X className="w-5 h-5 text-foreground/50" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* STEP 1 — Form */}
                {step === 1 && (
                  <>


                    {/* Destination & Details */}
                    {formData.type === 'travel' && (
                      <div className="mb-4">
                        <label className="block text-xs font-semibold text-foreground/60 mb-2 uppercase tracking-wider">Vị trí xuất phát (Để tính km lộ trình)</label>
                        <LocationAutocomplete
                          value={formData.departureLocation}
                          onChange={val => setFormData(f => ({ ...f, departureLocation: val }))}
                          placeholder="VD: Sài Gòn, Hà Nội..."
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-foreground/60 mb-2 uppercase tracking-wider">Điểm đến</label>
                        <LocationAutocomplete
                          value={formData.destination}
                          onChange={val => setFormData(f => ({ ...f, destination: val }))}
                          placeholder={formData.type === 'travel' ? 'VD: Đà Lạt, Phú Quốc...' : 'VD: Quận 1, Gò Vấp...'}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {formData.type === 'travel' && (
                          <div>
                            <label className="block text-xs font-semibold text-foreground/60 mb-2 uppercase tracking-wider">Số ngày</label>
                            <input type="number" min="1" value={formData.days} onChange={e => setFormData(f => ({ ...f, days: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-[var(--border)] focus:border-blue-400 focus:outline-none text-sm" />
                          </div>
                        )}
                        <div className={formData.type !== 'travel' ? 'col-span-2' : ''}>
                          <label className="block text-xs font-semibold text-foreground/60 mb-2 uppercase tracking-wider">Số người</label>
                          <input type="number" min="1" value={formData.people} onChange={e => setFormData(f => ({ ...f, people: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-[var(--border)] focus:border-blue-400 focus:outline-none text-sm" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground/60 mb-2 uppercase tracking-wider">Tên kế hoạch</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                        placeholder={formData.type === 'travel' ? 'VD: Hè 2025 ở Đà Nẵng' : formData.type === 'dining' ? 'VD: Nhậu cuối tuần với hội bạn' : 'VD: Mua MacBook Pro'}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-[var(--border)] focus:border-blue-400 focus:outline-none text-sm"
                      />
                    </div>

                    {/* Funding Source Only */}
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-foreground/60 mb-2 uppercase tracking-wider">Nguồn tiền sử dụng</label>
                        <select
                          value={formData.fundingSourceType === 'asset' ? formData.fundingAssetId : formData.fundingSourceType}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === 'available' || val === 'borrowed') {
                              setFormData(f => ({ ...f, fundingSourceType: val as any, fundingAssetId: '', budget: '0' }));
                            } else {
                              setFormData(f => ({ ...f, fundingSourceType: 'asset', fundingAssetId: val, budget: '0' }));
                            }
                          }}
                          className={cn("w-full px-4 py-3 rounded-xl border focus:outline-none text-sm transition-colors", fundingColorClass)}
                        >
                          <optgroup label="Khuyên dùng">
                            <option value="available">Số dư khả dụng ({formatCurrency(financialContext.netBalance)})</option>
                          </optgroup>
                          <optgroup label="Từ Hũ / Ví cụ thể">
                            {financialContext.assets && financialContext.assets.length > 0 ? (
                              financialContext.assets.map(a => (
                                <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.value)})</option>
                              ))
                            ) : (
                              <option value="" disabled>Chưa có Hũ/Ví nào</option>
                            )}
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    {/* Removed Alerts directly under the grid */}

                    {/* Deadline */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground/60 mb-2 uppercase tracking-wider">
                        {formData.type === 'travel' ? 'Ngày đi (tùy chọn)' : 'Deadline (tùy chọn)'}
                      </label>
                      <input
                        type="date"
                        value={formData.deadline}
                        onChange={e => setFormData(f => ({ ...f, deadline: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-[var(--border)] focus:border-blue-400 focus:outline-none text-sm"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Modal footer */}
              <div className="p-5 border-t border-[var(--border)] flex gap-3 shrink-0">
                {step === 1 && (
                  <>
                    <button
                      onClick={() => { setShowCreateModal(false); resetForm(); }}
                      className="flex-1 py-3 rounded-xl border border-[var(--border)] text-sm font-semibold text-foreground/70 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSavePlan}
                      disabled={isPending || !formData.title.trim()}
                      className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {editingPlan ? 'Lưu thay đổi' : 'Tạo kế hoạch'}
                    </button>
                  </>
                )}
                {step === 3 && (
                  <button
                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
                  >
                    Xong, về trang kế hoạch
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DETAIL MODAL (LOCALGO CLONE) ── */}
      <AnimatePresence>
        {viewingPlan && (
          <div className="fixed inset-0 z-[120] flex flex-col sm:items-center sm:justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-card w-full h-full sm:w-[98vw] sm:h-[96vh] sm:max-w-none sm:rounded-[2rem] shadow-2xl flex flex-col sm:flex-row overflow-hidden border border-[var(--border)]"
            >
              {/* CỘT TRÁI: QUẢN LÝ LỊCH TRÌNH */}
              <div className={cn("w-full sm:w-[45%] lg:w-[40%] flex flex-col h-full bg-white dark:bg-slate-950 relative z-10 border-r border-[var(--border)]", editMobileView === 'map' ? 'hidden sm:flex' : 'flex')}>
                
                {/* 1. Header Chips & Title */}
                <div className="px-6 pt-8 pb-4 shrink-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[12px] font-bold flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                          {viewingPlan.metadata?.destination || 'Chưa rõ'}
                        </div>
                        <div className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[12px] font-bold text-foreground/60 flex items-center">
                          {viewingPlan.metadata?.days || 1} Ngày
                        </div>
                        <div className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[12px] font-bold text-foreground/60 flex items-center gap-1.5" title="Tổng quãng đường di chuyển dự kiến">
                          <Map className="w-3.5 h-3.5" />
                          {((routeDistance || 0) + viewingTotalItineraryDistance).toFixed(1)} KM
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={cn("px-4 py-2 rounded-full text-[14px] font-bold flex items-center gap-2 border shadow-sm", viewingBudgetColor.replace('text-', 'border-').replace('bg-', 'border-').split(' ')[0], viewingBudgetColor)}>
                          <Wallet className="w-4 h-4" />
                          {formatCurrency(viewingTotalCost)}
                        </div>
                      </div>
                    </div>

                  </div>
                  
                  <h2 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight">
                    {viewingPlan.title}
                  </h2>
                </div>

                {/* 2. Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 hide-scrollbar relative">
                  
                  {/* Day Tabs */}
                  <div className="flex gap-3 mb-6 overflow-x-auto hide-scrollbar pb-2 pt-1 -mx-2 px-2">
                    {Array.from({ length: Number(viewingPlan.metadata?.days) || 1 }).map((_, i) => {
                      const isActive = activeDay === i + 1;
                      // Calculate date based on deadline, or default to today
                      const mockDate = viewingPlan.deadline ? new Date(viewingPlan.deadline) : new Date();
                      mockDate.setDate(mockDate.getDate() + i);
                      const dayStr = `Thứ ${mockDate.getDay() === 0 ? 'CN' : mockDate.getDay() + 1}, ${mockDate.getDate().toString().padStart(2,'0')}-${(mockDate.getMonth()+1).toString().padStart(2,'0')}`;
                      
                      // Calculate cost for this day
                      const dayLocations = viewingPlan.metadata?.itinerary?.[i + 1] || [];
                      const dayCost = dayLocations.reduce((sum: number, loc: any) => sum + (Number(loc.cost) || 0), 0);

                      return (
                        <button
                          key={i}
                          onClick={() => setActiveDay(i + 1)}
                          className={cn(
                            'shrink-0 w-28 p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all',
                            isActive 
                              ? 'border-emerald-400 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:bg-slate-900 z-10 scale-105' 
                              : 'border-[var(--border)] bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 opacity-70 hover:opacity-100'
                          )}
                        >
                          <h4 className="font-bold text-[15px]">Ngày {i + 1}</h4>
                          <p className="text-[10px] text-foreground/50 font-medium">{dayStr}</p>
                          <div className="flex items-center gap-1 mt-1 mb-1">
                            <span className="text-sm">{weatherData[i] ? getWeatherEmoji(weatherData[i].code) : '🌤️'}</span>
                            <span className="text-[11px] font-bold text-amber-500">
                              {weatherData[i] ? `${weatherData[i].tempMin}° - ${weatherData[i].tempMax}°` : '32°C'}
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">{formatCurrency(dayCost)}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Scroll indicator bar (aesthetic) */}
                  <div className="w-full h-1.5 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-full mb-6 relative overflow-hidden">
                     <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-slate-400 dark:bg-slate-500 rounded-full" />
                  </div>

                  {/* Timeline / Places */}
                  <div className="space-y-0 relative">
                    {/* Vertical line for timeline */}
                    <div className="absolute left-[52px] top-4 bottom-4 w-px bg-slate-200 dark:bg-slate-800 z-0"></div>

                    {(viewingPlan.metadata?.itinerary?.[activeDay] || []).map((loc: any, index: number) => (
                      <div key={loc.id} className="relative z-10 mb-6 group flex items-start gap-4">
                        <div className="absolute top-0 bottom-0 left-3 w-[2px] bg-slate-200 dark:bg-slate-800"></div>
                        
                        <div className="relative w-6 h-6 rounded-full border-[3px] border-white dark:border-slate-950 flex items-center justify-center shrink-0 mt-0.5 z-10 bg-blue-100 dark:bg-blue-900/50 text-blue-600">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        </div>
                        
                        <div className="flex-1 bg-white dark:bg-slate-950 border border-[var(--border)] shadow-sm shadow-black/5 rounded-2xl p-4 transition-all hover:shadow-md group relative overflow-hidden">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm truncate pr-2">{loc.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="flex items-center gap-1 text-[11px] text-foreground/50"><Clock className="w-3 h-3" /> {loc.startTime}{loc.endTime ? ` - ${loc.endTime}` : ''}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setNewLocationForm({...loc, day: activeDay}); setShowAddLocationModal(true); }} className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-slate-50 text-foreground/60"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteManualLocation(activeDay, loc.id)} className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-rose-50 text-foreground/60 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                          
                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="text-xs text-foreground/60 line-clamp-1 pr-4">
                              <MapPin className="inline w-3 h-3 mr-1" />
                              <span>{loc.address || 'Chưa có địa chỉ'}</span>
                            </div>
                            <div className="text-sm font-bold font-heading shrink-0 text-blue-600">
                              {formatCurrency(loc.cost)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button 
                      onClick={() => { 
                        const dayLocs = viewingPlan?.metadata?.itinerary?.[activeDay] || [];
                        let nextStart = '09:00';
                        let nextEnd = '10:00';
                        if (dayLocs.length > 0) {
                          nextStart = dayLocs[dayLocs.length - 1].endTime || '09:00';
                          let [h, m] = nextStart.split(':').map(Number);
                          h = (h + 1) % 24;
                          nextEnd = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                        }
                        setNewLocationForm({ id: undefined, name: '', cost: '', address: '', note: '', photo_url: '', place_id: '', lat: '', lon: '', day: activeDay, startTime: nextStart, endTime: nextEnd }); 
                        setShowAddLocationModal(true); 
                      }}
                      className="w-full mt-4 py-4 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-800/50 text-[13px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" /> Thêm địa điểm vào Ngày {activeDay}
                    </button>
                  </div>

                </div>

                {/* 3. Sticky Bottom Bar */}
                <div className="p-4 bg-white dark:bg-slate-950 border-t border-[var(--border)] shrink-0 flex items-center gap-2 z-20">
                  <button onClick={() => setViewingPlan(null)} className="flex-1 min-w-0 h-[56px] rounded-full bg-slate-900 dark:bg-slate-800 text-white text-[13px] xl:text-[14px] font-bold hover:bg-black transition-colors flex items-center justify-center shadow-md px-2">
                    <span className="truncate">Đóng</span>
                  </button>
                  <button onClick={() => setViewingPlan(null)} className="flex-1 min-w-0 h-[56px] rounded-full bg-[#14B8A6] text-white text-[13px] xl:text-[14px] font-black tracking-wide hover:bg-teal-600 transition-colors shadow-[0_4px_20px_rgb(20,184,166,0.3)] flex items-center justify-center px-2">
                    <span className="truncate">LƯU</span>
                  </button>
                  <button onClick={() => { setActiveDay(0); setShowPreview(true); }} className="flex-1 min-w-0 h-[56px] rounded-full border border-[var(--border)] text-[13px] xl:text-[14px] font-bold hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-center px-2">
                    <span className="truncate">Xem trước</span>
                  </button>
                </div>
              </div>

              {/* CỘT PHẢI: BẢN ĐỒ FULL SCREEN */}
              <div className={cn("w-full sm:w-[55%] lg:w-[60%] h-full relative bg-slate-100 dark:bg-slate-900 overflow-hidden", editMobileView === 'timeline' ? 'hidden sm:block' : 'block')}>
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight={0}
                  marginWidth={0}
                  src={getMainMapSrc()}
                  className="w-full h-full border-0 outline-none mix-blend-multiply dark:mix-blend-lighten opacity-80"
                ></iframe>
                <div className="absolute inset-0 pointer-events-none bg-blue-500/10 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>
                
                <div className="absolute bottom-12 left-10 right-10 text-white pointer-events-none">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/20">Khám phá</span>
                  </div>
                  <h3 className="text-4xl font-black drop-shadow-xl">{viewingPlan?.metadata?.destination || 'Việt Nam'}</h3>
                  <p className="text-sm font-medium text-white/80 mt-2 max-w-md line-clamp-2 shadow-black drop-shadow-md">
                    Hành trình của bạn đã sẵn sàng. Trải nghiệm những địa điểm tuyệt vời nhất cùng Savora.
                  </p>
                </div>

                {/* Floating Search on Map */}
                <div className="absolute top-6 left-6 right-20 z-20 max-w-sm">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onFocus={() => setShowSearchDropdown(true)}
                      placeholder="Tìm địa điểm trên bản đồ..."
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 dark:border-slate-800/50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500"
                    />
                    
                    {/* Search Results Dropdown */}
                    {showSearchDropdown && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[300px] overflow-y-auto">
                        {searchResults.map((place, i) => (
                          <div
                            key={place.place_id || i}
                            onClick={() => {
                              const dayLocs = viewingPlan?.metadata?.itinerary?.[activeDay] || [];
                              let nextStart = '09:00';
                              let nextEnd = '10:00';
                              
                              if (dayLocs.length > 0 && place.lat && place.lon) {
                                const lastLoc = dayLocs[dayLocs.length - 1];
                                if (lastLoc.lat && lastLoc.lon && lastLoc.endTime) {
                                  const R = 6371;
                                  const dLat = (Number(place.lat) - Number(lastLoc.lat)) * Math.PI / 180;
                                  const dLon = (Number(place.lon) - Number(lastLoc.lon)) * Math.PI / 180;
                                  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                            Math.cos(Number(lastLoc.lat) * Math.PI / 180) * Math.cos(Number(place.lat) * Math.PI / 180) *
                                            Math.sin(dLon/2) * Math.sin(dLon/2);
                                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                                  const distance = R * c;
                                  const timeMins = Math.round((distance / 30) * 60);
                                  
                                  let [h, m] = lastLoc.endTime.split(':').map(Number);
                                  m += timeMins + 10;
                                  h += Math.floor(m / 60);
                                  m = m % 60;
                                  h = h % 24;
                                  
                                  m = Math.round(m / 5) * 5;
                                  if (m === 60) { m = 0; h = (h + 1) % 24; }
                                  
                                  nextStart = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                  nextEnd = `${((h + 1) % 24).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                } else {
                                  nextStart = lastLoc.endTime || '09:00';
                                  let [h, m] = nextStart.split(':').map(Number);
                                  h = (h + 1) % 24;
                                  nextEnd = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                }
                              } else if (dayLocs.length > 0) {
                                nextStart = dayLocs[dayLocs.length - 1].endTime || '09:00';
                                let [h, m] = nextStart.split(':').map(Number);
                                h = (h + 1) % 24;
                                nextEnd = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                              }
                              
                              setNewLocationForm({
                                id: undefined,
                                name: place.name,
                                address: place.address || '',
                                place_id: place.place_id || '',
                                photo_url: place.photo_url || '',
                                lat: place.lat || '',
                                lon: place.lon || '',
                                note: '',
                                cost: '',
                                day: activeDay,
                                startTime: nextStart,
                                endTime: nextEnd,
                                isTimeEstimated: (dayLocs.length > 0 && place.lat && place.lon)
                              });
                              setSearchQuery('');
                              setShowSearchDropdown(false);
                              setShowAddLocationModal(true);
                            }}
                            className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border-b border-slate-50 dark:border-slate-800/50 last:border-0 transition-colors flex items-start gap-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 mt-0.5">
                              <MapPin className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-[13px] text-slate-900 dark:text-white truncate">{place.name}</div>
                              {place.address && <div className="text-[11px] text-slate-500 truncate mt-0.5">{place.address}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Map Overlay Badges */}
                <div className="absolute top-6 right-6 flex flex-col gap-2 items-end z-10">
                  <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-lg rounded-full px-4 py-2 text-[11px] font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Điểm đến thịnh hành
                  </div>
                  
                  {!showAIChat && (
                    <button
                      onClick={() => setShowAIChat(true)}
                      className="mt-2 bg-[#8B5CF6] text-white rounded-full px-4 py-3 text-[13px] font-bold shadow-[0_8px_30px_rgb(139,92,246,0.4)] hover:bg-violet-600 hover:scale-105 transition-all flex items-center gap-2 animate-bounce hover:animate-none"
                    >
                      <Sparkles className="w-4 h-4" />
                      Trợ lý AI
                    </button>
                  )}
                </div>

                {/* AI Chat Sidebar */}
                <AnimatePresence>
                  {showAIChat && (
                    <motion.div
                      initial={{ x: '100%', opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: '100%', opacity: 0 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className="absolute inset-y-0 right-0 w-full sm:w-[400px] bg-white dark:bg-slate-950 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] border-l border-[var(--border)] flex flex-col z-20"
                    >
                      {/* Chat Header */}
                      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[#8B5CF6]/5 dark:bg-[#8B5CF6]/10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 p-0.5 flex items-center justify-center">
                            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-full flex items-center justify-center">
                              <Sparkles className="w-5 h-5 text-violet-500" />
                            </div>
                          </div>
                          <div>
                            <h3 className="font-bold text-sm">Savora AI</h3>
                            <p className="text-[11px] text-foreground/50">Trợ lý lên kế hoạch chuyên nghiệp</p>
                          </div>
                        </div>
                        <button onClick={() => setShowAIChat(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground/50 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Chat Body */}
                      <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                        {chatHistory.map((turn, i) => {
                          if (turn.role === 'user') {
                            return (
                              <div key={i} className="flex justify-end">
                                <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-2xl rounded-tr-sm text-[13px] max-w-[85%]">
                                  {turn.content}
                                </div>
                              </div>
                            );
                          } else {
                            let parsedObj = null;
                            try {
                              parsedObj = JSON.parse(turn.content);
                            } catch (e) {}

                            return (
                              <div key={i} className="flex justify-start">
                                <div className="max-w-[90%]">
                                  <div className="bg-white dark:bg-slate-800 border border-[var(--border)] px-4 py-3 rounded-2xl rounded-tl-sm text-[13px] text-foreground shadow-sm">
                                    <p className="whitespace-pre-wrap">{parsedObj ? parsedObj.text : turn.content}</p>
                                  </div>
                                  
                                  {/* Render suggested locations as cards */}
                                  {parsedObj?.suggestedLocations && parsedObj.suggestedLocations.length > 0 && (
                                    <div className="mt-3 flex flex-col gap-2">
                                      {parsedObj.suggestedLocations.map((loc: any, idx: number) => (
                                        <div key={idx} className="bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-900/50 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                                          <div className="flex items-start justify-between gap-2 mb-1">
                                            <h4 className="font-bold text-[13px] text-violet-700 dark:text-violet-400">{loc.name}</h4>
                                          </div>
                                          <p className="text-[11px] text-foreground/60 mb-2 line-clamp-1"><MapPin className="inline w-3 h-3 mr-0.5" />{loc.address}</p>
                                          
                                          <div className="flex items-center gap-2 mb-3 text-[11px] font-semibold">
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                                              <Clock className="inline w-3 h-3 mr-1" /> {loc.duration}
                                            </span>
                                            <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                                              {formatCurrency(loc.cost)}
                                            </span>
                                          </div>
                                          
                                          {loc.reason && <p className="text-[11px] text-foreground/50 italic mb-3">"{loc.reason}"</p>}
                                          
                                          <button 
                                            onClick={() => handleAddSuggestedLocation(loc)}
                                            className="w-full py-2 bg-violet-100 dark:bg-violet-900/30 hover:bg-violet-200 dark:hover:bg-violet-800/40 text-violet-700 dark:text-violet-300 rounded-lg text-[12px] font-bold transition-colors flex items-center justify-center gap-1.5"
                                          >
                                            <Plus className="w-3.5 h-3.5" /> Thêm vào Ngày {activeDay}
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        })}
                        
                        {isChatting && (
                          <div className="flex justify-start">
                            <div className="bg-white dark:bg-slate-800 border border-[var(--border)] px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                              <span className="text-[12px] text-foreground/50">AI đang suy nghĩ...</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat Footer */}
                      <div className="p-3 border-t border-[var(--border)] bg-white dark:bg-slate-950">
                        <form 
                          onSubmit={(e) => { e.preventDefault(); handleSendAIChat(); }}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Nhập yêu cầu gợi ý..."
                            className="flex-1 h-10 px-4 rounded-full bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-violet-500 text-[13px] outline-none"
                            disabled={isChatting}
                          />
                          <button 
                            type="submit"
                            disabled={!chatInput.trim() || isChatting}
                            className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center disabled:opacity-50 disabled:bg-slate-300 transition-colors"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Edit Mobile View Toggle */}
              <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[30] sm:hidden">
                <button 
                  onClick={() => setEditMobileView(v => v === 'timeline' ? 'map' : 'timeline')}
                  className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-6 py-3.5 rounded-full font-bold shadow-2xl flex items-center gap-2 transition-transform hover:scale-105"
                >
                  {editMobileView === 'timeline' ? (
                    <><Map className="w-4 h-4" /> Bản đồ & AI</>
                  ) : (
                    <><List className="w-4 h-4" /> Lịch trình</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ADD LOCATION MODAL (Localgo Clone) ── */}
      <AnimatePresence>
        {showAddLocationModal && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-[var(--border)] flex flex-col md:flex-row h-[90vh] md:h-[650px]"
            >
              {/* LEFT COLUMN: FORM */}
              <div className="w-full md:w-[55%] flex flex-col h-full bg-white dark:bg-slate-950">
                {/* Header */}
                <div className="p-6 pb-2 flex items-start justify-between">
                  <div>
                    <h4 className="font-black text-2xl mb-1">Thêm địa điểm</h4>
                    <p className="text-xs text-foreground/50">Chỉ chọn các địa danh, khách sạn, nhà hàng có trên hệ thống</p>
                  </div>
                  <button onClick={() => setShowAddLocationModal(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-foreground/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                  {/* Tên địa điểm / Tìm kiếm */}
                  <div className="relative z-20">
                    <label className="block text-[11px] font-bold text-foreground/50 mb-2 uppercase tracking-wider">Tên địa điểm / Tìm kiếm</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {isSearchingPlaces ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> : <MapPin className="w-4 h-4 text-blue-500" />}
                      </div>
                      <input
                        type="text"
                        value={newLocationForm.name || ''}
                        onChange={e => {
                          setNewLocationForm(f => ({...f, name: e.target.value, lat: '', lon: ''}));
                          setSearchQuery(e.target.value);
                        }}
                        onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
                        onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                        placeholder="VD: Nhập tên quán, khách sạn..."
                        className="w-full pl-9 pr-3 py-3.5 rounded-2xl border border-[var(--border)] bg-transparent focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-semibold transition-colors"
                      />
                      <AnimatePresence>
                        {showSearchDropdown && searchResults.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
                          >
                            {searchResults.map((place: any) => (
                              <div
                                key={place.place_id}
                                onClick={() => {
                                  setNewLocationForm(f => {
                                    let newStart = f.startTime;
                                    let newEnd = f.endTime;
                                    const dayLocs = viewingPlan?.metadata?.itinerary?.[f.day] || [];
                                    
                                    if (dayLocs.length > 0 && place.lat && place.lon) {
                                      let prevLoc = null;
                                      if (f.id) {
                                        const idx = dayLocs.findIndex((l: any) => l.id === f.id);
                                        if (idx > 0) prevLoc = dayLocs[idx - 1];
                                      } else {
                                        prevLoc = dayLocs[dayLocs.length - 1];
                                      }
                                      
                                      if (prevLoc && prevLoc.lat && prevLoc.lon && prevLoc.endTime) {
                                        const R = 6371;
                                        const dLat = (Number(place.lat) - Number(prevLoc.lat)) * Math.PI / 180;
                                        const dLon = (Number(place.lon) - Number(prevLoc.lon)) * Math.PI / 180;
                                        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                                  Math.cos(Number(prevLoc.lat) * Math.PI / 180) * Math.cos(Number(place.lat) * Math.PI / 180) *
                                                  Math.sin(dLon/2) * Math.sin(dLon/2);
                                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                                        const distance = R * c;
                                        const timeMins = Math.round((distance / 30) * 60); // 30km/h
                                        
                                        // add timeMins + 10 mins buffer to prevLoc.endTime
                                        let [h, m] = prevLoc.endTime.split(':').map(Number);
                                        m += timeMins + 10;
                                        h += Math.floor(m / 60);
                                        m = m % 60;
                                        h = h % 24;
                                        
                                        // round minutes to nearest 5 for cleaner UX
                                        m = Math.round(m / 5) * 5;
                                        if (m === 60) { m = 0; h = (h + 1) % 24; }
                                        
                                        newStart = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                        newEnd = `${((h + 1) % 24).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                      }
                                    }

                                    return {
                                      ...f,
                                      name: place.name,
                                      address: place.address || '',
                                      place_id: place.place_id || '',
                                      photo_url: place.photo_url || '',
                                      lat: place.lat || '',
                                      lon: place.lon || '',
                                      startTime: newStart,
                                      endTime: newEnd,
                                      isTimeEstimated: (dayLocs.length > 0 && place.lat && place.lon)
                                    };
                                  });
                                  setSearchQuery('');
                                  setShowSearchDropdown(false);
                                }}
                                className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-start gap-3 border-b border-[var(--border)] last:border-0 transition-colors"
                              >
                                <div className="mt-0.5 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl shrink-0">
                                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold truncate text-foreground">{place.name}</p>
                                  <p className="text-xs text-foreground/60 truncate mt-0.5">{place.address}</p>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  
                  {/* Address and Cost */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-foreground/50 mb-2 uppercase tracking-wider">Địa chỉ / Mô tả</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MapPin className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          value={newLocationForm.address || ''}
                          onChange={e => setNewLocationForm(f => ({...f, address: e.target.value, lat: '', lon: ''}))}
                          onBlur={async () => {
                            if (newLocationForm.address && !newLocationForm.lat && !newLocationForm.lon) {
                              try {
                                const q = buildOsmSearchQuery(newLocationForm.address, viewingPlan?.metadata?.destination);
                                const coords = await geocodeLocation(q);
                                if (coords) {
                                  const lat = coords.lat;
                                  const lon = coords.lon;
                                  
                                  const dayLocs = viewingPlan?.metadata?.itinerary?.[newLocationForm.day] || [];
                                  if (dayLocs.length > 0) {
                                    let prevLoc = null;
                                    if (newLocationForm.id) {
                                      const idx = dayLocs.findIndex((l: any) => l.id === newLocationForm.id);
                                      if (idx > 0) prevLoc = dayLocs[idx - 1];
                                    } else {
                                      prevLoc = dayLocs[dayLocs.length - 1];
                                    }
                                    
                                    if (prevLoc && prevLoc.lat && prevLoc.lon && prevLoc.endTime) {
                                      const R = 6371;
                                      const dLat = (Number(lat) - Number(prevLoc.lat)) * Math.PI / 180;
                                      const dLon = (Number(lon) - Number(prevLoc.lon)) * Math.PI / 180;
                                      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                                Math.cos(Number(prevLoc.lat) * Math.PI / 180) * Math.cos(Number(lat) * Math.PI / 180) *
                                                Math.sin(dLon/2) * Math.sin(dLon/2);
                                      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                                      const distance = R * c;
                                      const timeMins = Math.round((distance / 30) * 60);
                                      
                                      let [h, m] = prevLoc.endTime.split(':').map(Number);
                                      m += timeMins + 10;
                                      h += Math.floor(m / 60);
                                      m = m % 60;
                                      h = h % 24;
                                      
                                      m = Math.round(m / 5) * 5;
                                      if (m === 60) { m = 0; h = (h + 1) % 24; }
                                      
                                      const newStart = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                      const newEnd = `${((h + 1) % 24).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                      
                                      setNewLocationForm(f => ({...f, lat: String(lat), lon: String(lon), startTime: newStart, endTime: newEnd, isTimeEstimated: true}));
                                      return;
                                    }
                                  }
                                  setNewLocationForm(f => ({...f, lat: String(lat), lon: String(lon)}));
                                }
                              } catch(e) {}
                            }
                          }}
                          placeholder="Địa chỉ cụ thể"
                          className="w-full pl-9 pr-3 py-3 rounded-2xl border border-[var(--border)] bg-transparent focus:outline-none text-sm font-semibold truncate"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-foreground/50 mb-2 uppercase tracking-wider">Giá dự kiến (VNĐ)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Wallet className="w-4 h-4 text-emerald-500" />
                        </div>
                        <input
                          type="text"
                          value={newLocationForm.cost || ''}
                          onChange={e => setNewLocationForm(f => ({...f, cost: formatMoneyInput(e.target.value)}))}
                          placeholder="0"
                          className="w-full pl-9 pr-12 py-3 rounded-2xl border border-[var(--border)] bg-transparent focus:outline-none text-sm font-semibold"
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <span className="text-[11px] font-bold text-foreground/40">VNĐ</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-[11px] font-bold text-foreground/50 mb-2 uppercase tracking-wider">Ghi chú (Không bắt buộc)</label>
                    <textarea
                      value={newLocationForm.note || ''}
                      onChange={e => setNewLocationForm(f => ({...f, note: e.target.value}))}
                      placeholder="VD: Nhớ mang theo dù, gửi xe hẻm bên cạnh..."
                      className="w-full px-4 py-3 rounded-2xl border border-[var(--border)] bg-transparent focus:outline-none focus:border-blue-500 text-sm font-medium resize-none h-[72px]"
                    />
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-[var(--border)] w-full"></div>

                  {/* Time Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-foreground/50 mb-2 uppercase tracking-wider">Ngày</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CalendarDays className="w-4 h-4 text-blue-500" />
                        </div>
                        <select
                          value={newLocationForm.day || ''}
                          onChange={e => setNewLocationForm(f => ({...f, day: Number(e.target.value)}))}
                          className="w-full pl-9 pr-3 py-3 rounded-2xl border border-[var(--border)] bg-transparent focus:outline-none text-sm font-semibold appearance-none"
                        >
                          {Array.from({ length: Number(viewingPlan?.metadata?.days) || 1 }).map((_, i) => (
                            <option key={i} value={i + 1}>Ngày {i + 1}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
                        <label className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3 text-blue-500" /> Giờ bắt đầu</label>
                        {newLocationForm.isTimeEstimated && (
                          <span className="text-[9px] italic font-medium text-red-500 animate-pulse">
                            * Đã cộng hao thời gian di chuyển
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={newLocationForm.startTime?.split(':')[0] || '09'}
                          onChange={e => {
                            const currentMin = newLocationForm.startTime?.split(':')[1] || '00';
                            setNewLocationForm(f => ({...f, startTime: `${e.target.value}:${currentMin}`}));
                          }}
                          className="w-20 py-3 px-2 rounded-2xl border border-[var(--border)] bg-transparent focus:outline-none text-sm font-semibold appearance-none text-center"
                        >
                          {Array.from({length: 24}).map((_, i) => <option key={`start-h-${i}`} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>)}
                        </select>
                        <span className="font-bold text-foreground/50">:</span>
                        <select
                          value={newLocationForm.startTime?.split(':')[1] || '00'}
                          onChange={e => {
                            const currentHr = newLocationForm.startTime?.split(':')[0] || '09';
                            setNewLocationForm(f => ({...f, startTime: `${currentHr}:${e.target.value}`}));
                          }}
                          className="w-20 py-3 px-2 rounded-2xl border border-[var(--border)] bg-transparent focus:outline-none text-sm font-semibold appearance-none text-center"
                        >
                          {Array.from({length: 60}).map((_, i) => <option key={`start-m-${i}`} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[11px] font-bold text-foreground/50 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3 text-orange-500" /> Giờ kết thúc</label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={!!newLocationForm.endTime} onChange={e => setNewLocationForm(f => ({...f, endTime: e.target.checked ? (f.startTime || '10:00') : ''}))} className="w-3 h-3 rounded accent-orange-500" />
                          <span className="text-[10px] font-bold text-foreground/50">Có</span>
                        </label>
                      </div>
                      {newLocationForm.endTime ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={newLocationForm.endTime.split(':')[0] || '10'}
                            onChange={e => {
                              const currentMin = newLocationForm.endTime?.split(':')[1] || '00';
                              setNewLocationForm(f => ({...f, endTime: `${e.target.value}:${currentMin}`}));
                            }}
                            className="w-20 py-3 px-2 rounded-2xl border border-[var(--border)] bg-transparent focus:outline-none text-sm font-semibold appearance-none text-center"
                          >
                            {Array.from({length: 24}).map((_, i) => <option key={`end-h-${i}`} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>)}
                          </select>
                          <span className="font-bold text-foreground/50">:</span>
                          <select
                            value={newLocationForm.endTime.split(':')[1] || '00'}
                            onChange={e => {
                              const currentHr = newLocationForm.endTime?.split(':')[0] || '10';
                              setNewLocationForm(f => ({...f, endTime: `${currentHr}:${e.target.value}`}));
                            }}
                            className="w-20 py-3 px-2 rounded-2xl border border-[var(--border)] bg-transparent focus:outline-none text-sm font-semibold appearance-none text-center"
                          >
                            {Array.from({length: 60}).map((_, i) => <option key={`end-m-${i}`} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>)}
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-3 px-3 rounded-2xl border border-[var(--border)] border-dashed bg-slate-50 dark:bg-slate-900/50 text-sm font-semibold text-foreground/40 h-[46px]">
                          Không xác định
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 pt-4 flex gap-3 shrink-0">
                  <button onClick={() => setShowAddLocationModal(false)} className="px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm font-bold text-foreground/60 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    Hủy
                  </button>
                  <button onClick={handleAddManualLocation} className="flex-1 py-3.5 rounded-2xl bg-[#0EA5E9] text-white text-sm font-bold hover:bg-sky-600 transition-colors shadow-lg shadow-sky-500/20">
                    + Thêm vào lộ trình
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: MAP */}
              <div className="hidden md:flex flex-col md:w-[45%] bg-slate-100 dark:bg-slate-900 relative border-l border-[var(--border)]">


                
                {/* Bản đồ Free */}
                <div className="w-full flex-1 relative overflow-hidden bg-[#e5e3df] dark:bg-[#1a1a1a]">
                  {(() => {
                    let mapQueryStr = viewingPlan?.metadata?.destination || 'Vietnam';
                    if (newLocationForm.lat && newLocationForm.lon) {
                      mapQueryStr = `${newLocationForm.lat},${newLocationForm.lon}`;
                    } else if (newLocationForm.name || searchQuery || newLocationForm.address) {
                      const baseQuery = newLocationForm.name || searchQuery || newLocationForm.address || '';
                      const dest = viewingPlan?.metadata?.destination || '';
                      if (dest && !baseQuery.toLowerCase().includes(dest.toLowerCase())) {
                         mapQueryStr = `${baseQuery} ${dest}`;
                      } else {
                         mapQueryStr = baseQuery;
                      }
                    }
                    return (
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight={0}
                        marginWidth={0}
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQueryStr)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        className="absolute inset-0 w-full h-full border-0 outline-none"
                      ></iframe>
                    );
                  })()}
                  
                  {newLocationForm.name && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                      <div className="absolute bottom-8 left-6 right-6 text-white pointer-events-none">
                        <div className="flex items-center gap-2 mb-1.5">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-400 tracking-wide uppercase">Đã xác định tọa độ</span>
                        </div>
                        <h4 className="font-bold text-2xl truncate shadow-black drop-shadow-md">{newLocationForm.name}</h4>
                        <p className="text-xs text-white/90 mt-1 truncate drop-shadow-md">{newLocationForm.address || 'Đang cập nhật địa chỉ...'}</p>
                        {newLocationForm.lat && newLocationForm.lon && (
                          <p className="text-[10px] text-white/70 mt-1 font-mono">Tọa độ: {newLocationForm.lat}, {newLocationForm.lon}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Actual Cost Modal */}
      <AnimatePresence>
        {actualCostModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-[var(--border)]"
            >
              <div className="p-6">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-4">
                  <Check className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Hoàn thành địa điểm</h3>
                <p className="text-sm text-foreground/60 mb-6">Bạn đã chi trả bao nhiêu tại <strong className="text-foreground">{actualCostModal.item.name}</strong>?</p>
                
                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-foreground/50 font-bold">đ</span>
                  </div>
                  <input
                    type="text"
                    value={actualCostModal.actualCost}
                    onChange={e => setActualCostModal(prev => ({...prev!, actualCost: formatMoneyInput(e.target.value)}))}
                    className="w-full pl-10 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-[var(--border)] focus:border-emerald-500 focus:bg-white focus:outline-none text-xl font-bold font-heading text-emerald-600 transition-all"
                  />
                  <div className="absolute -top-2.5 left-4 px-1 bg-white dark:bg-slate-900 text-[10px] font-bold text-foreground/50 uppercase tracking-wider">Chi phí thực tế</div>
                </div>


                <div className="flex gap-3">
                  <button onClick={() => setActualCostModal(null)} className="flex-1 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-foreground/60 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Đóng</button>
                  <button onClick={handleSaveActualCost} className="flex-1 py-3.5 rounded-xl bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors">Xác nhận</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Page Modal */}
      <AnimatePresence>
        {showPreview && viewingPlan && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[130] bg-white dark:bg-slate-950 overflow-y-auto print:bg-white"
          >
            {/* Action Bar (Hidden in Print) */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-[var(--border)] p-4 flex items-center justify-between print:hidden">
              <button onClick={() => setShowPreview(false)} className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 font-bold text-sm transition-colors">
                <ChevronLeft className="w-5 h-5" /> Quay lại
              </button>
              <div className="flex items-center gap-3">
                <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm shadow-md hover:bg-black transition-colors">
                  <Printer className="w-4 h-4" /> Xuất / In
                </button>
              </div>
            </div>

            {/* Preview Content (Tracking Mode) */}
            <div className="w-full h-[calc(100vh-65px)] flex flex-col lg:flex-row print:block print:h-auto relative">
              
              {/* Left Column: Timeline */}
              <div className={cn(
                "w-full lg:w-1/2 h-full overflow-y-auto p-4 lg:p-10 border-r border-[var(--border)] print:border-none print:p-0 print:w-full print:overflow-visible pb-24 lg:pb-10",
                previewMobileView === 'map' ? 'hidden lg:block' : 'block'
              )}>
                {/* Header */}
                <div className="mb-12">
                  <div className="text-center">
                    <h1 className="text-4xl font-black font-heading mb-4 text-slate-900 dark:text-white print:text-black">{viewingPlan.title}</h1>
                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-slate-500 dark:text-slate-400 print:text-gray-600 mb-6">
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {viewingPlan.metadata?.destination || 'N/A'}</div>
                      <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4" /> {viewingPlan.metadata?.days} Ngày</div>
                    </div>
                  </div>

                  {/* 2-Column Totals Layout */}
                  {(() => {
                    let totalEstimatedDistance = 0;
                    let totalActualDistance = 0;
                    let totalEstimatedCost = 0;
                    let totalActualCost = 0;

                    if (viewingPlan?.metadata?.itinerary) {
                      const allLocs = Object.values(viewingPlan.metadata.itinerary).flatMap((arr: any) => arr);
                      
                      allLocs.forEach((loc: any, idx: number) => {
                        totalEstimatedCost += Number(loc.cost) || 0;
                        if (loc.isDone) {
                          totalActualCost += Number(loc.actualCost || loc.cost) || 0;
                        }

                        const nextLoc = allLocs[idx + 1];
                        if (nextLoc && loc.lat && loc.lon && nextLoc.lat && nextLoc.lon) {
                          const R = 6371; // km
                          const dLat = (Number(nextLoc.lat) - Number(loc.lat)) * Math.PI / 180;
                          const dLon = (Number(nextLoc.lon) - Number(loc.lon)) * Math.PI / 180;
                          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                    Math.cos(Number(loc.lat) * Math.PI / 180) * Math.cos(Number(nextLoc.lat) * Math.PI / 180) *
                                    Math.sin(dLon/2) * Math.sin(dLon/2);
                          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                          totalEstimatedDistance += R * c;
                        }
                      });

                      const hasStarted = allLocs.some((l: any) => l.isDone || l.isSkipped);
                      if (hasStarted) {
                        const activeLocs = allLocs.filter((l: any) => !l.isSkipped);
                        activeLocs.forEach((loc: any, idx: number) => {
                          const nextLoc = activeLocs[idx + 1];
                          if (nextLoc && loc.lat && loc.lon && nextLoc.lat && nextLoc.lon) {
                            const R = 6371; // km
                            const dLat = (Number(nextLoc.lat) - Number(loc.lat)) * Math.PI / 180;
                            const dLon = (Number(nextLoc.lon) - Number(loc.lon)) * Math.PI / 180;
                            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                      Math.cos(Number(loc.lat) * Math.PI / 180) * Math.cos(Number(nextLoc.lat) * Math.PI / 180) *
                                      Math.sin(dLon/2) * Math.sin(dLon/2);
                            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                            totalActualDistance += R * c;
                          }
                        });
                      }
                    }

                    const totalEstDistToUse = (routeDistance || 0) + totalEstimatedDistance;
                    const totalActDistToUse = totalActualDistance > 0 ? (routeDistance || 0) + totalActualDistance : 0;
                    
                    const totalEstDistStr = totalEstDistToUse < 1 ? `${Math.round(totalEstDistToUse * 1000)} m` : `${totalEstDistToUse.toFixed(1)} km`;
                    const totalActDistStr = totalActDistToUse > 0 ? `${totalActDistToUse.toFixed(1)} km` : '---';

                    return (
                      <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4 mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-[var(--border)] print:border-gray-200">
                        {/* Left Column: Distance */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 pb-2">
                            <span className="text-[11px] uppercase text-slate-500 font-bold">Tổng quãng đường dự kiến</span>
                            <span className="text-sm font-black text-slate-700 dark:text-slate-300 print:text-black">{totalEstDistStr}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] uppercase text-slate-500 font-bold">Tổng quãng đường thực tế</span>
                            <span className="text-sm font-black text-emerald-600 print:text-black">{totalActDistStr}</span>
                          </div>
                        </div>
                        
                        {/* Right Column: Budget */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700/50 pb-2">
                            <span className="text-[11px] uppercase text-slate-500 font-bold">Tổng ngân sách dự kiến</span>
                            <span className="text-sm font-black text-slate-700 dark:text-slate-300 print:text-black">{formatCurrency(totalEstimatedCost)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] uppercase text-slate-500 font-bold">Tổng chi phí thực tế</span>
                            <span className="text-sm font-black text-emerald-600 print:text-black">{totalActualCost > 0 ? formatCurrency(totalActualCost) : '---'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Day Tabs */}
                <div className="flex overflow-x-auto gap-2 pb-0 mb-6 scrollbar-hide print:hidden border-b border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setActiveDay(0)}
                    className={cn(
                      "px-6 py-3 rounded-t-xl font-bold text-sm whitespace-nowrap transition-all border-b-2",
                      activeDay === 0 
                        ? "bg-slate-100 dark:bg-slate-800/50 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400" 
                        : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/30 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    Tổng hành trình
                  </button>
                  {Array.from({ length: Number(viewingPlan.metadata?.days) || 1 }).map((_, i) => {
                    const dayNum = i + 1;
                    const isActive = activeDay === dayNum;
                    return (
                      <button
                        key={`tab-day-${dayNum}`}
                        onClick={() => setActiveDay(dayNum)}
                        className={cn(
                          "px-6 py-3 rounded-t-xl font-bold text-sm whitespace-nowrap transition-all border-b-2",
                          isActive 
                            ? "bg-slate-100 dark:bg-slate-800/50 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400" 
                            : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/30 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                      >
                        Ngày {dayNum}
                      </button>
                    );
                  })}
                </div>

                {/* Timeline */}
                <div className="space-y-10">
                  {Array.from({ length: Number(viewingPlan.metadata?.days) || 1 }).map((_, i) => {
                    const dayNum = i + 1;
                    const dayLocations = viewingPlan.metadata?.itinerary?.[dayNum] || [];
                    const isVisible = activeDay === 0 || activeDay === dayNum;
                    
                    return (
                      <div key={`preview-day-${dayNum}`} className={cn("break-inside-avoid", isVisible ? "block" : "hidden print:block")}>
                        {dayLocations.length === 0 ? (
                          <div className="text-center py-10 text-slate-500 font-medium">Chưa có lịch trình cho ngày này.</div>
                        ) : (
                          <>
                            <h3 className="text-xl font-black border-b-2 border-slate-100 dark:border-slate-800 pb-3 mb-6 items-center gap-3 hidden print:flex print:border-gray-200">
                              <span className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">{dayNum}</span> 
                              Ngày {dayNum}
                            </h3>
                            
                            <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-10 print:border-gray-200">
                          {dayLocations.map((loc: any, idx: number) => {
                            const nextLoc = dayLocations[idx + 1];
                            let distanceInfo = null;
                            if (nextLoc && loc.lat && loc.lon && nextLoc.lat && nextLoc.lon) {
                              const R = 6371; // km
                              const dLat = (Number(nextLoc.lat) - Number(loc.lat)) * Math.PI / 180;
                              const dLon = (Number(nextLoc.lon) - Number(loc.lon)) * Math.PI / 180;
                              const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                        Math.cos(Number(loc.lat) * Math.PI / 180) * Math.cos(Number(nextLoc.lat) * Math.PI / 180) *
                                        Math.sin(dLon/2) * Math.sin(dLon/2);
                              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                              const distance = R * c;
                              const distanceStr = distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
                              const timeMins = Math.round((distance / 30) * 60); // Assuming 30km/h for city driving
                              distanceInfo = { distance: distanceStr, time: timeMins < 1 ? '1 phút' : `${timeMins} phút` };
                            }

                            return (
                              <div key={loc.id} className="relative pl-6 group">
                                <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center ${loc.isDone ? 'bg-emerald-500' : loc.isSkipped ? 'bg-slate-400 dark:bg-slate-600' : 'bg-blue-500'} print:border-white print:bg-blue-500 transition-colors z-10`}>
                                  <span className="text-[9px] font-bold text-white leading-none">{idx + 1}</span>
                                </div>
                                <div className={`bg-white dark:bg-slate-900/50 p-4 rounded-2xl border ${loc.isDone ? 'border-emerald-200 dark:border-emerald-900/50 shadow-sm' : loc.isSkipped ? 'border-transparent opacity-60 grayscale' : 'border-transparent group-hover:border-[var(--border)]'} transition-all print:border-none print:p-0`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md print:bg-gray-100 ${loc.isSkipped ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 print:text-gray-500'}`}>{loc.startTime}{loc.endTime ? ` - ${loc.endTime}` : ''}</span>
                                  </div>
                                  <h4 className={`text-lg font-bold mb-1 ${loc.isDone ? 'text-emerald-700 dark:text-emerald-400' : loc.isSkipped ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-900 dark:text-white'} print:text-black`}>{loc.name}</h4>
                                  {loc.address && <p className={`text-sm mb-2 ${loc.isSkipped ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-500 dark:text-slate-400 print:text-gray-600'}`}>{loc.address}</p>}
                                  {loc.note && <p className={`text-sm font-bold mb-2 ${loc.isSkipped ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200 print:text-gray-800'}`}>Ghi chú: {loc.note}</p>}
                                  <div className={`inline-flex items-center gap-2 text-sm font-bold ${loc.isSkipped ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-emerald-600 print:text-black'}`}>
                                    <Wallet className="w-4 h-4" /> {formatCurrency(loc.actualCost || loc.cost)}
                                    {loc.isDone && <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full print:border print:border-emerald-300">Hoàn thành</span>}
                                    {loc.isSkipped && <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full print:border print:border-slate-300">Đã bỏ qua</span>}
                                    {loc.isDone && loc.actualCost !== loc.cost && (
                                      <span className="text-xs text-foreground/40 line-through ml-2">{formatCurrency(loc.cost)}</span>
                                    )}
                                  </div>

                                  {/* Actions (Tracking Mode Only) */}
                                  <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
                                    {!loc.isSkipped && (
                                      <a 
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(loc.lat && loc.lon ? `${loc.lat},${loc.lon}` : loc.address || loc.name)}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-blue-500/20"
                                      >
                                        <Plane className="w-4 h-4" /> Bắt đầu di chuyển
                                      </a>
                                    )}
                                    
                                    {!loc.isDone && !loc.isSkipped ? (
                                      <>
                                        <button 
                                          onClick={() => setActualCostModal({ isOpen: true, item: loc, day: dayNum, actualCost: formatCurrency(loc.cost).replace('đ', '') })} 
                                          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 rounded-xl text-xs font-bold transition-colors border border-emerald-200"
                                        >
                                          <Check className="w-4 h-4" /> Hoàn tất
                                        </button>
                                        <button 
                                          onClick={() => {
                                            const newPlan = { ...viewingPlan };
                                            if (!newPlan.metadata) newPlan.metadata = {};
                                            if (!newPlan.metadata.itinerary) newPlan.metadata.itinerary = {};
                                            const locs = newPlan.metadata.itinerary[dayNum] || [];
                                            const updatedLocs = locs.map((l: any) => l.id === loc.id ? { ...l, isSkipped: true, isDone: false, actualCost: 0 } : l);
                                            newPlan.metadata.itinerary[dayNum] = updatedLocs;
                                            setViewingPlan(newPlan);
                                            
                                            startTransition(async () => {
                                              try {
                                                await updatePlan(viewingPlan.id, { metadata: newPlan.metadata });
                                              } catch {}
                                            });
                                          }}
                                          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors"
                                        >
                                          <X className="w-4 h-4" /> Bỏ qua
                                        </button>
                                      </>
                                    ) : loc.isDone ? (
                                      <>
                                        <button 
                                          onClick={() => setActualCostModal({ isOpen: true, item: loc, day: dayNum, actualCost: formatCurrency(loc.actualCost || loc.cost).replace('đ', '') })} 
                                          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors border border-transparent"
                                        >
                                          <Pencil className="w-3.5 h-3.5" /> Sửa chi phí
                                        </button>
                                        <button 
                                          onClick={() => {
                                            const newPlan = { ...viewingPlan };
                                            const locs = newPlan.metadata.itinerary[dayNum] || [];
                                            const updatedLocs = locs.map((l: any) => l.id === loc.id ? { ...l, isSkipped: true, isDone: false, actualCost: 0 } : l);
                                            newPlan.metadata.itinerary[dayNum] = updatedLocs;
                                            setViewingPlan(newPlan);
                                            
                                            startTransition(async () => {
                                              try {
                                                await updatePlan(viewingPlan.id, { metadata: newPlan.metadata });
                                              } catch {}
                                            });
                                          }}
                                          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors"
                                        >
                                          <X className="w-4 h-4" /> Bỏ qua
                                        </button>
                                        <button 
                                          onClick={() => {
                                            const newPlan = { ...viewingPlan };
                                            const locs = newPlan.metadata.itinerary[dayNum] || [];
                                            const updatedLocs = locs.map((l: any) => l.id === loc.id ? { ...l, isDone: false, actualCost: 0 } : l);
                                            newPlan.metadata.itinerary[dayNum] = updatedLocs;
                                            setViewingPlan(newPlan);
                                            
                                            startTransition(async () => {
                                              try {
                                                await updatePlan(viewingPlan.id, { metadata: newPlan.metadata });
                                              } catch {}
                                            });
                                          }}
                                          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors"
                                        >
                                          <RefreshCw className="w-4 h-4" /> Hoàn tác
                                        </button>
                                      </>
                                    ) : loc.isSkipped ? (
                                      <button 
                                        onClick={() => {
                                          const newPlan = { ...viewingPlan };
                                          const locs = newPlan.metadata.itinerary[dayNum] || [];
                                          const updatedLocs = locs.map((l: any) => l.id === loc.id ? { ...l, isSkipped: false } : l);
                                          newPlan.metadata.itinerary[dayNum] = updatedLocs;
                                          setViewingPlan(newPlan);
                                          
                                          startTransition(async () => {
                                            try {
                                              await updatePlan(viewingPlan.id, { metadata: newPlan.metadata });
                                            } catch {}
                                          });
                                        }}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors"
                                      >
                                        <RefreshCw className="w-4 h-4" /> Hoàn tác
                                      </button>
                                    ) : null}
                                  </div>
                                </div>

                                {/* Distance & Time to next location */}
                                {distanceInfo && (
                                  <div className="absolute -bottom-8 left-[-4px] z-20 flex items-center gap-2 print:hidden">
                                    <div className="flex flex-col items-center">
                                      <div className="w-[2px] h-3 bg-blue-200 dark:bg-blue-800"></div>
                                      <div className="bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900 shadow-sm rounded-full px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 whitespace-nowrap">
                                        <Plane className="w-3 h-3" />
                                        {distanceInfo.distance} • {distanceInfo.time}
                                      </div>
                                      <div className="w-[2px] h-3 bg-blue-200 dark:bg-blue-800"></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
                  })}
                </div>
              </div>

              {/* Right Column: Interactive Map */}
              <div className={cn(
                "w-full lg:w-1/2 h-full bg-slate-100 dark:bg-slate-900 print:hidden relative z-0",
                previewMobileView === 'timeline' ? 'hidden lg:block' : 'block'
              )}>
                <TrackingMap 
                  locations={activeDay === 0 
                    ? Object.values(viewingPlan.metadata?.itinerary || {}).flatMap((arr: any) => arr) 
                    : (viewingPlan.metadata?.itinerary?.[activeDay] || [])} 
                  activeDay={activeDay} 
                />
              </div>

              {/* Mobile View Toggle */}
              <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] lg:hidden print:hidden">
                <button 
                  onClick={() => setPreviewMobileView(v => v === 'timeline' ? 'map' : 'timeline')}
                  className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-6 py-3.5 rounded-full font-bold shadow-2xl flex items-center gap-2 transition-transform hover:scale-105"
                >
                  {previewMobileView === 'timeline' ? (
                    <><Map className="w-4 h-4" /> Bản đồ</>
                  ) : (
                    <><List className="w-4 h-4" /> Lịch trình</>
                  )}
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

