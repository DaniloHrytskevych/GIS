import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ScrollArea } from './components/ui/scroll-area';
import { Progress } from './components/ui/progress';
import { Checkbox } from './components/ui/checkbox';
import { Separator } from './components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion';
import { getScoreColor, getCategoryColor } from './utils/potentialCalculator';
import { Map, BarChart3, Download, Building2, TreePine, Car, Hospital, Wifi, Users, TrendingUp, AlertTriangle, CheckCircle2, XCircle, MapPin, Layers, Filter, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell } from 'recharts';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const createIcon = (color, size = 24) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

// Ukraine center coordinates
const UKRAINE_CENTER = [48.5, 31.0];
const DEFAULT_ZOOM = 6;

// Region coordinates (approximate centers)
const REGION_CENTERS = {
  'Київська область': [50.45, 30.52],
  'Львівська область': [49.84, 24.03],
  'Закарпатська область': [48.62, 22.29],
  'Одеська область': [46.48, 30.73],
  'Харківська область': [49.99, 36.23],
  'Дніпропетровська область': [48.46, 35.04],
  'Житомирська область': [50.25, 28.66],
  'Волинська область': [50.75, 25.32],
  'Івано-Франківська область': [48.92, 24.71],
  'Вінницька область': [49.23, 28.47],
  'Чернігівська область': [51.50, 31.29],
  'Рівненська область': [50.62, 26.23],
  'Чернівецька область': [48.29, 25.93],
  'Полтавська область': [49.59, 34.55],
  'Черкаська область': [49.44, 32.06],
  'Сумська область': [50.91, 34.80],
  'Хмельницька область': [49.42, 26.98],
  'Тернопільська область': [49.55, 25.59],
  'Миколаївська область': [46.97, 32.00],
  'Херсонська область': [46.64, 32.62],
  'Кіровоградська область': [48.51, 32.26],
  'Запорізька область': [47.84, 35.14],
  'Донецька область': [48.02, 37.80],
  'Луганська область': [48.57, 39.31],
};

// Map controller component
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 8, { duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
};

function App() {
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [allAnalysis, setAllAnalysis] = useState([]);
  const [recreationalPoints, setRecreationalPoints] = useState([]);
  const [recommendedZones, setRecommendedZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState(UKRAINE_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [activeTab, setActiveTab] = useState('map');
  
  // Layer visibility
  const [layers, setLayers] = useState({
    recreationalPoints: true,
    recommendedZones: true,
    regionScores: true,
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [regionsRes, pointsRes, allAnalysisRes, zonesRes] = await Promise.all([
        axios.get(`${API}/regions`),
        axios.get(`${API}/recreational-points`),
        axios.get(`${API}/analyze-all`),
        axios.get(`${API}/recommended-zones`)
      ]);
      
      setRegions(regionsRes.data.regions || []);
      setRecreationalPoints(pointsRes.data.features || []);
      setAllAnalysis(allAnalysisRes.data.results || []);
      setRecommendedZones(zonesRes.data.zones || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const analyzeRegion = async (regionName) => {
    if (!regionName) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API}/analyze/${encodeURIComponent(regionName)}`);
      setAnalysisResult(response.data);
      
      // Center map on region
      const center = REGION_CENTERS[regionName];
      if (center) {
        setMapCenter(center);
        setMapZoom(8);
      }
    } catch (error) {
      console.error('Error analyzing region:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegionChange = (value) => {
    setSelectedRegion(value);
    analyzeRegion(value);
  };

  const toggleLayer = (layerName) => {
    setLayers(prev => ({ ...prev, [layerName]: !prev[layerName] }));
  };

  // Export PDF
  const exportPDF = async () => {
    if (!analysisResult) return;
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Аналіз рекреаційного потенціалу`, pageWidth / 2, 20, { align: 'center' });
    pdf.setFontSize(14);
    pdf.text(analysisResult.region, pageWidth / 2, 30, { align: 'center' });
    
    // Score
    pdf.setFontSize(24);
    pdf.text(`${analysisResult.total_score}/100`, pageWidth / 2, 45, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    let y = 60;
    
    // Scores breakdown
    pdf.text(`Попит: ${analysisResult.demand_score}/25`, 20, y); y += 8;
    pdf.text(`ПЗФ: ${analysisResult.pfz_score}/20`, 20, y); y += 8;
    pdf.text(`Природа: ${analysisResult.nature_score}/15`, 20, y); y += 8;
    pdf.text(`Транспорт: ${analysisResult.accessibility_score}/15`, 20, y); y += 8;
    pdf.text(`Інфраструктура: ${analysisResult.infrastructure_score}/10`, 20, y); y += 8;
    pdf.text(`Насиченість: ${analysisResult.saturation_penalty}`, 20, y); y += 15;
    
    // Category and recommendation
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Категорія: ${analysisResult.category}`, 20, y); y += 10;
    pdf.setFont('helvetica', 'normal');
    
    // Wrap recommendation text
    const splitRecommendation = pdf.splitTextToSize(analysisResult.recommendation, pageWidth - 40);
    pdf.text(splitRecommendation, 20, y);
    
    pdf.save(`recreational_analysis_${analysisResult.region}.pdf`);
  };

  // Get points for selected region
  const filteredPoints = selectedRegion 
    ? recreationalPoints.filter(p => p.properties?.region === selectedRegion)
    : recreationalPoints;

  // Radar chart data
  const getRadarData = () => {
    if (!analysisResult) return [];
    return [
      { factor: 'Попит', value: (analysisResult.demand_score / 25) * 100, fullMark: 100 },
      { factor: 'ПЗФ', value: (analysisResult.pfz_score / 20) * 100, fullMark: 100 },
      { factor: 'Природа', value: (analysisResult.nature_score / 15) * 100, fullMark: 100 },
      { factor: 'Транспорт', value: (analysisResult.accessibility_score / 15) * 100, fullMark: 100 },
      { factor: 'Інфра', value: (analysisResult.infrastructure_score / 10) * 100, fullMark: 100 },
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" data-testid="app-container">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50" data-testid="header">
        <div className="max-w-screen-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Map className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">ГІС аналіз рекреаційного потенціалу</h1>
                <p className="text-sm text-slate-500">Україна • {recreationalPoints.length} рекреаційних пунктів</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedRegion || ''} onValueChange={handleRegionChange} data-testid="region-select">
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Оберіть область" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {analysisResult && (
                <Button onClick={exportPDF} variant="outline" className="gap-2" data-testid="export-pdf-btn">
                  <Download className="w-4 h-4" />
                  Експорт PDF
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Sidebar - Filters & Layers */}
          <aside className="col-span-12 lg:col-span-2">
            <Card className="sticky top-24" data-testid="filters-panel">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Шари карти
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="layer-points" 
                    checked={layers.recreationalPoints}
                    onCheckedChange={() => toggleLayer('recreationalPoints')}
                  />
                  <label htmlFor="layer-points" className="text-sm cursor-pointer">
                    Рекреаційні пункти
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="layer-zones" 
                    checked={layers.recommendedZones}
                    onCheckedChange={() => toggleLayer('recommendedZones')}
                  />
                  <label htmlFor="layer-zones" className="text-sm cursor-pointer">
                    Рекомендовані зони
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="layer-scores" 
                    checked={layers.regionScores}
                    onCheckedChange={() => toggleLayer('regionScores')}
                  />
                  <label htmlFor="layer-scores" className="text-sm cursor-pointer">
                    Скори областей
                  </label>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-500">Легенда</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-xs">Існуючий рекреаційний пункт</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border-2 border-dashed border-amber-500 bg-amber-100"></div>
                      <span className="text-xs">Рекомендована зона (будувати)</span>
                    </div>
                    <Separator className="my-2" />
                    <p className="text-xs font-medium text-slate-500">Пріоритет будівництва</p>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-xs">Критичний</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-xs">Високий</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-xs">Середній</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content - Map */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="overflow-hidden" data-testid="map-container">
              <div className="h-[calc(100vh-180px)]">
                <MapContainer
                  center={UKRAINE_CENTER}
                  zoom={DEFAULT_ZOOM}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapController center={mapCenter} zoom={mapZoom} />
                  
                  {/* Recreational Points */}
                  {layers.recreationalPoints && filteredPoints.map((point, idx) => (
                    point.geometry?.coordinates && (
                      <CircleMarker
                        key={idx}
                        center={[point.geometry.coordinates[1], point.geometry.coordinates[0]]}
                        radius={6}
                        pathOptions={{
                          fillColor: '#22c55e',
                          color: '#fff',
                          weight: 2,
                          opacity: 1,
                          fillOpacity: 0.8,
                        }}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold">{point.properties?.name || 'Рекреаційний пункт'}</p>
                            <p className="text-slate-500">{point.properties?.region}</p>
                            {point.properties?.capacity && (
                              <p>Місткість: {point.properties.capacity}</p>
                            )}
                          </div>
                        </Popup>
                      </CircleMarker>
                    )
                  ))}

                  {/* Recommended Zones for Building */}
                  {layers.recommendedZones && recommendedZones
                    .filter(zone => !selectedRegion || zone.region === selectedRegion)
                    .map((zone, idx) => {
                      const priorityColors = {
                        'критичний': '#ef4444',
                        'високий': '#f97316',
                        'середній': '#eab308',
                        'низький': '#22c55e'
                      };
                      const color = priorityColors[zone.priority] || '#f97316';
                      
                      return (
                        <CircleMarker
                          key={`zone-${idx}`}
                          center={zone.coordinates}
                          radius={12}
                          pathOptions={{
                            fillColor: color,
                            color: color,
                            weight: 3,
                            opacity: 1,
                            fillOpacity: 0.3,
                            dashArray: '5, 5',
                          }}
                        >
                          <Popup>
                            <div className="text-sm min-w-[220px]">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                                <p className="font-bold text-base">Рекомендована зона</p>
                              </div>
                              <p className="text-slate-600 mb-2">{zone.region}</p>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Пріоритет:</span>
                                  <span className="font-medium" style={{ color }}>{zone.priority.toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Тип:</span>
                                  <span className="font-medium">{zone.zone_type}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Потенціал:</span>
                                  <span className="font-medium">{zone.total_score}/100</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Рек. місткість:</span>
                                  <span className="font-medium">{zone.recommended_capacity} осіб</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Масштаб інвестицій:</span>
                                  <span className="font-medium text-xs">{zone.investment_scale}</span>
                                </div>
                                {zone.notable_objects_nearby?.length > 0 && (
                                  <div className="mt-2 pt-2 border-t">
                                    <p className="text-slate-500 mb-1">Поблизу ПЗФ:</p>
                                    {zone.notable_objects_nearby.slice(0, 2).map((obj, i) => (
                                      <p key={i} className="text-emerald-600 text-xs">• {obj}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}

                  {/* Region markers with scores */}
                  {layers.regionScores && allAnalysis.map((analysis, idx) => {
                    const center = REGION_CENTERS[analysis.region];
                    if (!center) return null;
                    return (
                      <Marker
                        key={idx}
                        position={center}
                        icon={createIcon(getScoreColor(analysis.total_score), 32)}
                        eventHandlers={{
                          click: () => handleRegionChange(analysis.region)
                        }}
                      >
                        <Popup>
                          <div className="text-sm min-w-[200px]">
                            <p className="font-bold text-base mb-2">{analysis.region}</p>
                            <div className="flex items-center justify-between mb-2">
                              <span>Потенціал:</span>
                              <Badge style={{ backgroundColor: getScoreColor(analysis.total_score) }}>
                                {analysis.total_score}/100
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500">{analysis.category}</p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </Card>
          </div>

          {/* Right Sidebar - Analysis Results */}
          <aside className="col-span-12 lg:col-span-4">
            <Card className="h-[calc(100vh-180px)] flex flex-col" data-testid="analysis-panel">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Результати аналізу
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="map" data-testid="tab-region">Область</TabsTrigger>
                    <TabsTrigger value="compare" data-testid="tab-compare">Порівняння</TabsTrigger>
                    <TabsTrigger value="chart" data-testid="tab-chart">Графіки</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="map" className="flex-1 overflow-hidden mt-4">
                    <ScrollArea className="h-[calc(100vh-340px)]">
                      {loading ? (
                        <div className="flex items-center justify-center h-40">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                        </div>
                      ) : analysisResult ? (
                        <div className="space-y-4 animate-fadeIn pr-4" data-testid="analysis-result">
                          {/* Score Header */}
                          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100">
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">{analysisResult.region}</h3>
                            <div 
                              className="inline-flex items-center justify-center w-24 h-24 rounded-full text-white text-3xl font-bold mb-2"
                              style={{ backgroundColor: getScoreColor(analysisResult.total_score) }}
                            >
                              {analysisResult.total_score}
                            </div>
                            <p className="text-sm text-slate-500">зі 100 балів</p>
                            <Badge 
                              className="mt-2 text-white"
                              style={{ backgroundColor: getCategoryColor(analysisResult.category) }}
                            >
                              {analysisResult.category}
                            </Badge>
                          </div>

                          {/* Score Breakdown */}
                          <div className="space-y-3">
                            <ScoreBar label="Попит" value={analysisResult.demand_score} max={25} icon={<Users className="w-4 h-4" />} />
                            <ScoreBar label="ПЗФ" value={analysisResult.pfz_score} max={20} icon={<TreePine className="w-4 h-4" />} />
                            <ScoreBar label="Природа" value={analysisResult.nature_score} max={15} icon={<TreePine className="w-4 h-4" />} />
                            <ScoreBar label="Транспорт" value={analysisResult.accessibility_score} max={15} icon={<Car className="w-4 h-4" />} />
                            <ScoreBar label="Інфраструктура" value={analysisResult.infrastructure_score} max={10} icon={<Building2 className="w-4 h-4" />} />
                            <ScoreBar label="Насиченість" value={Math.abs(analysisResult.saturation_penalty)} max={15} icon={<AlertTriangle className="w-4 h-4" />} negative />
                          </div>

                          {/* Details Accordion */}
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="population">
                              <AccordionTrigger className="text-sm">
                                <span className="flex items-center gap-2">
                                  <Users className="w-4 h-4" /> Населення та попит
                                </span>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-2 text-sm">
                                  <DetailRow label="Населення" value={analysisResult.details.population.total?.toLocaleString()} />
                                  <DetailRow label="Площа" value={`${analysisResult.details.population.area_km2?.toLocaleString()} км²`} />
                                  <DetailRow label="Річний попит" value={analysisResult.details.population.annual_demand?.toLocaleString()} />
                                  <DetailRow label="Річна пропозиція" value={analysisResult.details.population.annual_supply?.toLocaleString()} />
                                  <DetailRow label="Співвідношення" value={analysisResult.details.population.supply_demand_ratio} />
                                  <DetailRow 
                                    label="Статус" 
                                    value={analysisResult.details.population.gap_status}
                                    status={analysisResult.details.population.gap > 0 ? 'warning' : 'success'}
                                  />
                                </div>
                              </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="pfz">
                              <AccordionTrigger className="text-sm">
                                <span className="flex items-center gap-2">
                                  <TreePine className="w-4 h-4" /> Природно-заповідний фонд
                                </span>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-2 text-sm">
                                  <DetailRow label="НПП" value={analysisResult.details.pfz.national_parks} />
                                  <DetailRow label="Заповідники" value={analysisResult.details.pfz.nature_reserves} />
                                  <DetailRow label="РЛП" value={analysisResult.details.pfz.regional_landscape_parks} />
                                  <DetailRow label="Заказники" value={analysisResult.details.pfz.zakazniks} />
                                  <DetailRow label="% території" value={`${analysisResult.details.pfz.percent_of_region}%`} />
                                  <DetailRow label="Рейтинг ПЗФ" value={analysisResult.details.pfz.pfz_rating} />
                                  {analysisResult.details.pfz.notable_objects?.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs text-slate-500 mb-1">Відомі об&apos;єкти:</p>
                                      <ul className="text-xs space-y-1">
                                        {analysisResult.details.pfz.notable_objects.slice(0, 3).map((obj, i) => (
                                          <li key={i} className="text-emerald-600">• {obj}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="transport">
                              <AccordionTrigger className="text-sm">
                                <span className="flex items-center gap-2">
                                  <Car className="w-4 h-4" /> Транспортна доступність
                                </span>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-2 text-sm">
                                  <DetailRow label="Рейтинг доступності" value={`${analysisResult.details.transport.accessibility_score}/10`} />
                                  <DetailRow label="Щільність доріг" value={`${analysisResult.details.transport.highway_density} км/1000км²`} />
                                  <DetailRow label="Міжнародні траси" value={analysisResult.details.transport.international_roads_count} />
                                  <DetailRow label="Залізничні станції" value={analysisResult.details.transport.railway_stations} />
                                  <DetailRow label="Аеропорти" value={analysisResult.details.transport.airports} />
                                  <DetailRow label="Час до міста" value={`${analysisResult.details.transport.avg_travel_time_minutes} хв`} />
                                </div>
                              </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="infrastructure">
                              <AccordionTrigger className="text-sm">
                                <span className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4" /> Інфраструктура
                                </span>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-2 text-sm">
                                  <DetailRow label="Лікарні/100к" value={analysisResult.details.infrastructure.hospitals_per_100k} />
                                  <DetailRow label="Заправки/100км²" value={analysisResult.details.infrastructure.gas_stations_per_100km2} />
                                  <DetailRow label="Моб. зв'язок" value={`${analysisResult.details.infrastructure.mobile_coverage_percent}%`} />
                                  <DetailRow label="Інтернет" value={`${analysisResult.details.infrastructure.internet_coverage_percent}%`} />
                                  <DetailRow label="Готелі" value={analysisResult.details.infrastructure.hotels_total} />
                                  <DetailRow label="Ресторани/кафе" value={analysisResult.details.infrastructure.restaurants_cafes} />
                                </div>
                              </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="investment">
                              <AccordionTrigger className="text-sm">
                                <span className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4" /> Інвестиційний прогноз
                                </span>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-2 text-sm">
                                  <DetailRow 
                                    label="Рекомендація" 
                                    value={analysisResult.details.investment.should_build ? 'Будувати' : 'Не будувати'}
                                    status={analysisResult.details.investment.should_build ? 'success' : 'error'}
                                  />
                                  <DetailRow label="Рівень ризику" value={analysisResult.details.investment.risk_level} />
                                  <DetailRow label="Масштаб" value={analysisResult.details.investment.investment_scale} />
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>

                          {/* Recommendation */}
                          <div className="p-4 rounded-lg bg-slate-50 border">
                            <p className="text-sm text-slate-600">
                              <span className="font-medium">Висновок: </span>
                              {analysisResult.recommendation}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                          <MapPin className="w-12 h-12 mb-2" />
                          <p>Оберіть область для аналізу</p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="compare" className="flex-1 overflow-hidden mt-4">
                    <ScrollArea className="h-[calc(100vh-340px)]">
                      <div className="space-y-2 pr-4" data-testid="comparison-table">
                        {allAnalysis.map((analysis, idx) => (
                          <div 
                            key={idx}
                            className={`p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-colors ${
                              selectedRegion === analysis.region ? 'border-emerald-500 bg-emerald-50' : ''
                            }`}
                            onClick={() => handleRegionChange(analysis.region)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{analysis.region}</p>
                                <p className="text-xs text-slate-500">{analysis.category}</p>
                              </div>
                              <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: getScoreColor(analysis.total_score) }}
                              >
                                {analysis.total_score}
                              </div>
                            </div>
                            <div className="mt-2 grid grid-cols-5 gap-1">
                              <MiniScore label="Поп" value={analysis.demand_score} max={25} />
                              <MiniScore label="ПЗФ" value={analysis.pfz_score} max={20} />
                              <MiniScore label="Пр" value={analysis.nature_score} max={15} />
                              <MiniScore label="Тр" value={analysis.accessibility_score} max={15} />
                              <MiniScore label="Ін" value={analysis.infrastructure_score} max={10} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="chart" className="flex-1 overflow-hidden mt-4">
                    <ScrollArea className="h-[calc(100vh-340px)]">
                      <div className="space-y-6 pr-4">
                        {analysisResult && (
                          <>
                            {/* Radar Chart */}
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={getRadarData()}>
                                  <PolarGrid />
                                  <PolarAngleAxis dataKey="factor" tick={{ fontSize: 12 }} />
                                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                  <Radar
                                    name="Потенціал"
                                    dataKey="value"
                                    stroke="#22c55e"
                                    fill="#22c55e"
                                    fillOpacity={0.5}
                                  />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          </>
                        )}

                        {/* All regions bar chart */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Порівняння областей</h4>
                          <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={allAnalysis.slice(0, 10)}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis dataKey="region" type="category" tick={{ fontSize: 11 }} width={95} />
                                <Tooltip />
                                <Bar dataKey="total_score" name="Потенціал">
                                  {allAnalysis.slice(0, 10).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getScoreColor(entry.total_score)} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

// Helper Components
const ScoreBar = ({ label, value, max, icon, negative = false }) => {
  const percentage = (value / max) * 100;
  const color = negative ? '#ef4444' : getScoreColor((value / max) * 100);
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-slate-600">
          {icon}
          {label}
        </span>
        <span className="font-medium">{value}/{max}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, status }) => (
  <div className="flex items-center justify-between">
    <span className="text-slate-500">{label}</span>
    <span className={`font-medium ${
      status === 'success' ? 'text-emerald-600' : 
      status === 'warning' ? 'text-amber-600' : 
      status === 'error' ? 'text-red-600' : ''
    }`}>
      {status === 'success' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
      {status === 'error' && <XCircle className="w-3 h-3 inline mr-1" />}
      {status === 'warning' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
      {value}
    </span>
  </div>
);

const MiniScore = ({ label, value, max }) => {
  const percentage = (value / max) * 100;
  return (
    <div className="text-center">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="h-1 bg-slate-200 rounded-full mt-1">
        <div 
          className="h-full rounded-full"
          style={{ 
            width: `${percentage}%`, 
            backgroundColor: getScoreColor(percentage) 
          }}
        />
      </div>
    </div>
  );
};

export default App;
