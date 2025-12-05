import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ScrollArea } from './components/ui/scroll-area';
import { Checkbox } from './components/ui/checkbox';
import { Separator } from './components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion';
import { getScoreColor, getCategoryColor } from './utils/potentialCalculator';
import { Map, BarChart3, Download, Building2, TreePine, Car, Users, TrendingUp, AlertTriangle, CheckCircle2, XCircle, MapPin, Layers, Star, Waves, Fuel, Hospital, Wifi, Hotel, Navigation, FileText, Target, DollarSign, Clock, Building, Utensils, Zap, Droplets } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell } from 'recharts';
import LandingPage from './components/LandingPage';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createIcon = (color, size = 24) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

const createStarIcon = (color) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="color: ${color}; font-size: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">\u2605</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const UKRAINE_CENTER = [48.5, 31.0];
const DEFAULT_ZOOM = 6;

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

const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 8, { duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
};

function MapPage() {
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [allAnalysis, setAllAnalysis] = useState([]);
  const [recreationalPoints, setRecreationalPoints] = useState([]);
  const [recommendedZones, setRecommendedZones] = useState([]);
  const [pfzObjects, setPfzObjects] = useState([]);
  const [forestFires, setForestFires] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState(UKRAINE_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [activeTab, setActiveTab] = useState('analysis');
  
  const [layers, setLayers] = useState({
    recreationalPoints: true,
    recommendedZones: true,
    regionScores: true,
    pfzObjects: true,
    forestFires: true,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [regionsRes, pointsRes, allAnalysisRes, pfzRes, zonesRes, firesRes] = await Promise.all([
        axios.get(`${API}/regions`),
        axios.get(`${API}/recreational-points`),
        axios.get(`${API}/analyze-all`),
        axios.get(`${API}/pfz-objects`),
        axios.get(`${API}/recommended-zones`),
        axios.get(`${API}/forest-fires`)
      ]);
      
      setRegions(regionsRes.data.regions || []);
      setRecreationalPoints(pointsRes.data.features || []);
      setAllAnalysis(allAnalysisRes.data.results || []);
      setPfzObjects(pfzRes.data.objects || []);
      const zones = zonesRes.data.zones || [];
      console.log('Loaded recommended zones:', zones.length, zones);
      setRecommendedZones(zones);
      setForestFires(firesRes.data.features || []);
      console.log('Loaded forest fires:', firesRes.data.features?.length || 0);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const analyzeRegion = async (regionName) => {
    if (!regionName) return;
    setLoading(true);
    try {
      const analysisRes = await axios.get(`${API}/analyze/${encodeURIComponent(regionName)}`);
      setAnalysisResult(analysisRes.data);
      
      const center = REGION_CENTERS[regionName];
      if (center) {
        setMapCenter(center);
        setMapZoom(9);
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

  const focusOnLocation = (coords) => {
    setMapCenter(coords);
    setMapZoom(12);
  };

  const exportPDF = async () => {
    if (!analysisResult) return;
    
    // Create a temporary div for PDF content
    const pdfContent = document.createElement('div');
    pdfContent.style.cssText = 'position: absolute; left: -9999px; width: 800px; padding: 40px; background: white; font-family: Arial, sans-serif;';
    
    const d = analysisResult.details;
    const shouldBuild = d?.investment?.should_build;
    
    pdfContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1e293b; margin: 0; font-size: 24px;">АНАЛІЗ РЕКРЕАЦІЙНОГО ПОТЕНЦІАЛУ</h1>
        <h2 style="color: #475569; margin: 10px 0; font-size: 20px;">${analysisResult.region}</h2>
        <div style="display: inline-block; width: 100px; height: 100px; border-radius: 50%; background: ${getScoreColor(analysisResult.total_score)}; color: white; line-height: 100px; font-size: 32px; font-weight: bold; margin: 20px 0;">
          ${analysisResult.total_score}
        </div>
        <p style="color: #64748b; margin: 5px 0;">зі 100 балів</p>
        <span style="display: inline-block; padding: 6px 16px; border-radius: 20px; background: ${getCategoryColor(analysisResult.category)}; color: white; font-weight: bold;">${analysisResult.category}</span>
      </div>
      
      <h3 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">ОЦІНКА ЗА ФАКТОРАМИ</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr style="background: #f8fafc;">
          <td style="padding: 12px; border: 1px solid #e2e8f0;">Попит від населення</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${analysisResult.demand_score}/25</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #e2e8f0;">ПЗФ як атрактор</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${analysisResult.pfz_score}/20</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 12px; border: 1px solid #e2e8f0;">Природні ресурси</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${analysisResult.nature_score}/15</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #e2e8f0;">Транспортна доступність</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${analysisResult.accessibility_score}/15</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 12px; border: 1px solid #e2e8f0;">Інфраструктура</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${analysisResult.infrastructure_score}/10</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #e2e8f0; color: #dc2626;">Штраф за насиченість</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #dc2626;">${analysisResult.saturation_penalty}/15</td>
        </tr>
      </table>
      
      <h3 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">АНАЛІЗ ПОПИТУ</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">Населення</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${d?.population?.total?.toLocaleString() || 'N/A'} осіб</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 10px; border: 1px solid #e2e8f0;">Річний попит</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${d?.population?.annual_demand?.toLocaleString() || 'N/A'} відвідувань</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">Річна пропозиція</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${d?.population?.annual_supply?.toLocaleString() || 'N/A'} місць</td>
        </tr>
        <tr style="background: ${d?.population?.gap > 0 ? '#fef3c7' : '#d1fae5'};">
          <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">${d?.population?.gap_status || 'N/A'}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${Math.abs(d?.population?.gap || 0).toLocaleString()} відвідувань</td>
        </tr>
      </table>
      
      <h3 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">ІНВЕСТИЦІЙНИЙ ПРОГНОЗ</h3>
      <div style="background: ${shouldBuild ? '#d1fae5' : '#fee2e2'}; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: ${shouldBuild ? '#065f46' : '#991b1b'};">
          ${shouldBuild ? '✓ РЕКОМЕНДУЄТЬСЯ БУДУВАТИ' : '✗ БУДІВНИЦТВО РИЗИКОВАНЕ'}
        </p>
        <p style="margin: 0; color: #475569;">${analysisResult.recommendation}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">Рівень ризику</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${d?.investment?.risk_level || 'N/A'}</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 10px; border: 1px solid #e2e8f0;">Масштаб інвестицій</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${d?.investment?.investment_scale || 'N/A'}</td>
        </tr>
      </table>
      
      <p style="text-align: center; color: #94a3b8; margin-top: 30px; font-size: 12px;">
        Згенеровано: ${new Date().toLocaleDateString('uk-UA')} | ГІС аналіз рекреаційного потенціалу
      </p>
    `;
    
    document.body.appendChild(pdfContent);
    
    try {
      const canvas = await html2canvas(pdfContent, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Аналіз_${analysisResult.region}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Помилка експорту PDF');
    } finally {
      document.body.removeChild(pdfContent);
    }
  };

  const exportJSON = () => {
    if (!analysisResult) return;
    
    const d = analysisResult.details;
    const topZones = recommendedZones
      .filter(z => z.region === analysisResult.region)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5)
      .map(z => ({
        name: z.name,
        type: z.type,
        coordinates: z.coordinates,
        priority: z.priority,
        recommended_type: z.recommended_type,
        capacity: z.capacity,
        investment: z.investment,
        payback: z.payback,
      }));
    
    const exportData = {
      region: analysisResult.region,
      analysis_date: new Date().toISOString(),
      total_potential: {
        score: analysisResult.total_score,
        category: analysisResult.category,
        recommendation: analysisResult.recommendation
      },
      factors: {
        demand: {
          score: analysisResult.demand_score,
          max: 25,
          annual_demand: d?.population?.demand,
          annual_supply: d?.population?.supply,
          gap: d?.population?.gap
        },
        pfz_attraction: {
          score: analysisResult.pfz_score,
          max: 20,
          notable_objects: d?.pfz?.notable_objects || []
        },
        nature: {
          score: analysisResult.nature_score,
          max: 15
        },
        accessibility: {
          score: analysisResult.accessibility_score,
          max: 15
        },
        infrastructure: {
          score: analysisResult.infrastructure_score,
          max: 10
        },
        saturation_penalty: {
          score: analysisResult.saturation_penalty,
          max: -15
        }
      },
      investment_forecast: {
        should_build: d?.investment?.should_build,
        investment_scale: d?.investment?.investment_scale,
        points_needed: d?.population?.gap > 0 ? Math.ceil(d.population.gap / 18000) : 0
      },
      recommended_zones: topZones
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Analiz_${analysisResult.region.replace(/ /g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Calculate how many points needed to cover deficit
  const calculatePointsNeeded = (gap) => {
    if (gap <= 0) return 0;
    // Average capacity per point: 50 people, 180 days season, 2 shifts
    const avgCapacityPerPoint = 50 * 180 * 2; // = 18,000 visits per year
    return Math.ceil(gap / avgCapacityPerPoint);
  };

  // Export comparison report for all regions
  const exportComparisonPDF = async () => {
    if (allAnalysis.length === 0) return;
    
    const pdfContent = document.createElement('div');
    pdfContent.style.cssText = 'position: absolute; left: -9999px; width: 900px; padding: 30px; background: white; font-family: Arial, sans-serif;';
    
    // Summary stats
    const highPotential = allAnalysis.filter(a => a.total_score >= 70).length;
    const mediumPotential = allAnalysis.filter(a => a.total_score >= 55 && a.total_score < 70).length;
    const lowPotential = allAnalysis.filter(a => a.total_score < 55).length;
    const totalDeficit = allAnalysis.reduce((sum, a) => {
      const gap = a.details?.population?.gap || 0;
      return sum + (gap > 0 ? gap : 0);
    }, 0);
    const totalPointsNeeded = calculatePointsNeeded(totalDeficit);
    
    let tableRows = allAnalysis.map((a, idx) => {
      const gap = a.details?.population?.gap || 0;
      const pointsNeeded = calculatePointsNeeded(gap);
      const statusColor = a.total_score >= 70 ? '#22c55e' : a.total_score >= 55 ? '#eab308' : '#ef4444';
      return `
        <tr style="background: ${idx % 2 === 0 ? '#f8fafc' : 'white'};">
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${idx + 1}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 500;">${a.region}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">
            <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; background: ${statusColor}; color: white; font-weight: bold;">${a.total_score}</span>
          </td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${a.demand_score}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${a.pfz_score}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${a.nature_score}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${a.accessibility_score}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${a.infrastructure_score}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; color: ${a.saturation_penalty < -5 ? '#dc2626' : '#16a34a'};">${a.saturation_penalty}</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: right; color: ${gap > 0 ? '#dc2626' : '#16a34a'};">
            ${gap > 0 ? '+' : ''}${gap.toLocaleString()}
          </td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: ${pointsNeeded > 0 ? 'bold' : 'normal'}; color: ${pointsNeeded > 0 ? '#1e40af' : '#16a34a'};">
            ${pointsNeeded > 0 ? pointsNeeded : '—'}
          </td>
        </tr>
      `;
    }).join('');
    
    // Recommendations
    const topRegions = allAnalysis.filter(a => a.total_score >= 70 && a.details?.population?.gap > 0);
    const oversaturated = allAnalysis.filter(a => a.saturation_penalty <= -10);
    
    pdfContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 25px; border-bottom: 3px solid #22c55e; padding-bottom: 20px;">
        <h1 style="color: #1e293b; margin: 0; font-size: 22px;">ПОРІВНЯЛЬНИЙ АНАЛІЗ РЕКРЕАЦІЙНОГО ПОТЕНЦІАЛУ</h1>
        <h2 style="color: #475569; margin: 8px 0 0 0; font-size: 16px;">Області України</h2>
      </div>
      
      <div style="display: flex; gap: 15px; margin-bottom: 25px;">
        <div style="flex: 1; background: #d1fae5; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #065f46; font-size: 24px; font-weight: bold;">${highPotential}</p>
          <p style="margin: 5px 0 0 0; color: #047857; font-size: 12px;">Високий потенціал (70+)</p>
        </div>
        <div style="flex: 1; background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #92400e; font-size: 24px; font-weight: bold;">${mediumPotential}</p>
          <p style="margin: 5px 0 0 0; color: #b45309; font-size: 12px;">Середній потенціал (55-69)</p>
        </div>
        <div style="flex: 1; background: #fee2e2; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #991b1b; font-size: 24px; font-weight: bold;">${lowPotential}</p>
          <p style="margin: 5px 0 0 0; color: #b91c1c; font-size: 12px;">Низький потенціал (&lt;55)</p>
        </div>
        <div style="flex: 1; background: #dbeafe; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #1e40af; font-size: 24px; font-weight: bold;">${totalPointsNeeded}</p>
          <p style="margin: 5px 0 0 0; color: #1d4ed8; font-size: 12px;">Потрібно пунктів</p>
        </div>
      </div>
      
      <h3 style="color: #1e293b; font-size: 14px; margin: 20px 0 10px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">РЕЙТИНГ ОБЛАСТЕЙ</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
        <thead>
          <tr style="background: #1e293b; color: white;">
            <th style="padding: 8px; border: 1px solid #334155;">#</th>
            <th style="padding: 8px; border: 1px solid #334155; text-align: left;">Область</th>
            <th style="padding: 8px; border: 1px solid #334155;">Скор</th>
            <th style="padding: 8px; border: 1px solid #334155;">Поп</th>
            <th style="padding: 8px; border: 1px solid #334155;">ПЗФ</th>
            <th style="padding: 8px; border: 1px solid #334155;">Прир</th>
            <th style="padding: 8px; border: 1px solid #334155;">Трансп</th>
            <th style="padding: 8px; border: 1px solid #334155;">Інфр</th>
            <th style="padding: 8px; border: 1px solid #334155;">Насич</th>
            <th style="padding: 8px; border: 1px solid #334155;">Дефіцит</th>
            <th style="padding: 8px; border: 1px solid #334155;">Потр. пунктів</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <h3 style="color: #1e293b; font-size: 14px; margin: 20px 0 10px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">ЗАГАЛЬНІ ВИСНОВКИ</h3>
      
      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
        <h4 style="margin: 0 0 10px 0; color: #166534; font-size: 13px;">✓ РЕКОМЕНДОВАНО ДЛЯ БУДІВНИЦТВА (${topRegions.length} областей)</h4>
        <p style="margin: 0; font-size: 12px; color: #15803d;">
          ${topRegions.map(r => r.region.replace(' область', '')).join(', ') || 'Немає'}
        </p>
        ${topRegions.length > 0 ? `<p style="margin: 10px 0 0 0; font-size: 11px; color: #166534;">
          Загальний дефіцит: <strong>${topRegions.reduce((s, r) => s + (r.details?.population?.gap || 0), 0).toLocaleString()}</strong> відвідувань/рік.
          Для покриття потрібно <strong>${calculatePointsNeeded(topRegions.reduce((s, r) => s + (r.details?.population?.gap || 0), 0))}</strong> нових пунктів.
        </p>` : ''}
      </div>
      
      ${oversaturated.length > 0 ? `
      <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
        <h4 style="margin: 0 0 10px 0; color: #991b1b; font-size: 13px;">✗ НЕ РЕКОМЕНДОВАНО (перенасичені ринки)</h4>
        <p style="margin: 0; font-size: 12px; color: #b91c1c;">
          ${oversaturated.map(r => r.region.replace(' область', '')).join(', ')}
        </p>
        <p style="margin: 10px 0 0 0; font-size: 11px; color: #991b1b;">
          Пропозиція перевищує попит. Стандартне будівництво збиткове. Тільки преміум або унікальні концепти.
        </p>
      </div>` : ''}
      
      <div style="background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 15px;">
        <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 13px;">📊 ЗАГАЛЬНА СТАТИСТИКА</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
          <p style="margin: 0;"><span style="color: #64748b;">Загальний дефіцит України:</span> <strong>${totalDeficit.toLocaleString()}</strong> відвідувань/рік</p>
          <p style="margin: 0;"><span style="color: #64748b;">Потрібно побудувати:</span> <strong>${totalPointsNeeded}</strong> рекреаційних пунктів</p>
          <p style="margin: 0;"><span style="color: #64748b;">Середня місткість пункту:</span> <strong>50</strong> осіб</p>
          <p style="margin: 0;"><span style="color: #64748b;">Сезон роботи:</span> <strong>180</strong> днів/рік</p>
        </div>
      </div>
      
      <p style="text-align: center; color: #94a3b8; margin-top: 25px; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
        Згенеровано: ${new Date().toLocaleDateString('uk-UA')} | ГІС аналіз рекреаційного потенціалу територій України
      </p>
    `;
    
    document.body.appendChild(pdfContent);
    
    try {
      const canvas = await html2canvas(pdfContent, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, (pdfHeight - 20) / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      pdf.addImage(imgData, 'PNG', imgX, 10, imgWidth * ratio, imgHeight * ratio);
      pdf.save('Порівняльний_аналіз_областей.pdf');
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Помилка експорту PDF');
    } finally {
      document.body.removeChild(pdfContent);
    }
  };

  const filteredPoints = selectedRegion 
    ? recreationalPoints.filter(p => p.properties?.region === selectedRegion)
    : recreationalPoints;

  const filteredPfzObjects = selectedRegion
    ? pfzObjects.filter(p => p.region === selectedRegion)
    : pfzObjects;

  const getRadarData = () => {
    if (!analysisResult) return [];
    const data = [
      { factor: 'Попит', value: (analysisResult.demand_score / 25) * 100, fullMark: 100 },
      { factor: 'ПЗФ', value: (analysisResult.pfz_score / 20) * 100, fullMark: 100 },
      { factor: 'Природа', value: (analysisResult.nature_score / 15) * 100, fullMark: 100 },
      { factor: 'Транспорт', value: (analysisResult.accessibility_score / 15) * 100, fullMark: 100 },
      { factor: 'Інфра', value: (analysisResult.infrastructure_score / 10) * 100, fullMark: 100 },
    ];
    
    // Add fire score if available
    if (analysisResult.fire_score !== undefined) {
      data.push({ factor: 'Пожежі', value: (analysisResult.fire_score / 5) * 100, fullMark: 100 });
    }
    
    return data;
  };

  const getScoreIcon = (score, max) => {
    const percent = (score / max) * 100;
    if (percent >= 80) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (percent >= 60) return <CheckCircle2 className="w-4 h-4 text-lime-500" />;
    if (percent >= 40) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="app-container">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50" data-testid="header">
        <div className="max-w-screen-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Map className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">ГІС аналіз рекреаційного потенціалу</h1>
                <p className="text-xs text-slate-500">Україна • {recreationalPoints.length} пунктів • {pfzObjects.length} об&apos;єктів ПЗФ</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedRegion || ''} onValueChange={handleRegionChange}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="Оберіть область" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={exportComparisonPDF} variant="outline" size="sm" className="gap-2">
                <FileText className="w-4 h-4" />
                Звіт
              </Button>
              {analysisResult && (
                <>
                  <Button onClick={exportPDF} variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    PDF
                  </Button>
                  <Button onClick={exportJSON} variant="outline" size="sm" className="gap-2">
                    <FileText className="w-4 h-4" />
                    JSON
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto p-3">
        <div className="grid grid-cols-12 gap-3">
          {/* Left - Layers */}
          <aside className="col-span-12 lg:col-span-2">
            <Card className="sticky top-20">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Шари карти
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={layers.recreationalPoints} onCheckedChange={() => toggleLayer('recreationalPoints')} />
                  <span className="text-xs">Існуючі пункти</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={layers.recommendedZones} onCheckedChange={() => toggleLayer('recommendedZones')} />
                  <span className="text-xs">Рекомендовані зони</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={layers.pfzObjects} onCheckedChange={() => toggleLayer('pfzObjects')} />
                  <span className="text-xs">Об&apos;єкти ПЗФ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={layers.forestFires} onCheckedChange={() => toggleLayer('forestFires')} />
                  <span className="text-xs">Лісові пожежі (2024)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={layers.regionScores} onCheckedChange={() => toggleLayer('regionScores')} />
                  <span className="text-xs">Скори областей</span>
                </label>
                
                <Separator className="my-3" />
                
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 mb-2">Легенда</p>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs">Існуючий пункт</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-dashed border-red-300"></div>
                    <span className="text-xs">Критичний пріоритет</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-dashed border-orange-300"></div>
                    <span className="text-xs">Високий пріоритет</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 text-sm">★</span>
                    <span className="text-xs">НПП / Заповідник</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-orange-600" />
                    <span className="text-xs">Лісова пожежа</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Center - Map */}
          <div className="col-span-12 lg:col-span-5">
            <Card className="overflow-hidden">
              <div className="h-[calc(100vh-120px)]">
                <MapContainer 
                  center={UKRAINE_CENTER} 
                  zoom={DEFAULT_ZOOM} 
                  style={{ height: '100%', width: '100%' }} 
                  scrollWheelZoom={true}
                  maxBounds={[[44.0, 22.0], [52.5, 40.5]]}
                  minZoom={6}
                  maxZoom={18}
                >
                  <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapController center={mapCenter} zoom={mapZoom} />
                  
                  {/* Existing points */}
                  {layers.recreationalPoints && filteredPoints.map((point, idx) => (
                    point.geometry?.coordinates && (
                      <CircleMarker key={`pt-${idx}`} center={[point.geometry.coordinates[1], point.geometry.coordinates[0]]} radius={5}
                        pathOptions={{ fillColor: '#22c55e', color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.8 }}>
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold">{point.properties?.name || 'Рекреаційний пункт'}</p>
                            <p className="text-slate-500">{point.properties?.region}</p>
                            {point.properties?.capacity && <p>Місткість: {point.properties.capacity}</p>}
                          </div>
                        </Popup>
                      </CircleMarker>
                    )
                  ))}

                  {/* PFZ Objects */}
                  {layers.pfzObjects && filteredPfzObjects.map((obj, idx) => (
                    obj.coordinates && (
                      <Marker key={`pfz-${idx}`} position={obj.coordinates} icon={createStarIcon('#f59e0b')}>
                        <Popup>
                          <div className="text-sm min-w-[220px]">
                            <p className="font-bold text-amber-600">{obj.name}</p>
                            <p className="text-xs text-slate-500 mb-2">{obj.type} • {obj.region}</p>
                            <div className="space-y-1 text-xs">
                              <p><span className="text-slate-500">Площа:</span> {obj.area_ha?.toLocaleString()} га</p>
                              <p><span className="text-slate-500">Рік створення:</span> {obj.year_created}</p>
                              <p><span className="text-slate-500">Відвідуваність:</span> ~{obj.visitors_per_year?.toLocaleString()} осіб/рік</p>
                              {obj.warning && <p className="text-red-500 font-medium mt-2">{obj.warning}</p>}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  ))}

                  {/* Recommended Zones */}
                  {layers.recommendedZones && recommendedZones.filter(zone => !selectedRegion || zone.region === selectedRegion).map((zone, idx) => {
                    const color = zone.priority >= 85 ? '#ef4444' : zone.priority >= 70 ? '#f97316' : '#eab308';
                    
                    return (
                      <CircleMarker key={`zone-${idx}`} center={zone.coordinates} radius={14}
                        pathOptions={{ fillColor: color, color: color, weight: 3, opacity: 1, fillOpacity: 0.3, dashArray: '5, 5' }}>
                        <Popup maxWidth={400}>
                          <div className="p-4 min-w-[300px] max-w-[380px]">
                            {/* Header */}
                            <div className="border-b pb-2 mb-3">
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="text-green-600" size={20} />
                                <h3 className="font-bold text-lg">РЕКОМЕНДОВАНА ЗОНА</h3>
                              </div>
                            </div>

                            {/* Назва */}
                            <h4 className="text-xl font-bold mb-1">{zone.name}</h4>
                            {zone.type === "near_pfz" && zone.pfz_object && (
                              <p className="text-sm text-gray-600 mb-3">
                                Біля: {zone.pfz_object}
                              </p>
                            )}

                            {/* Пріоритет */}
                            <div className="mb-3">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium">Пріоритет:</span>
                                <span className="text-lg font-bold text-green-600">
                                  {zone.priority}/100
                                </span>
                              </div>
                              <div className="h-2 bg-slate-200 rounded-full">
                                <div className="h-full rounded-full" style={{ width: `${zone.priority}%`, backgroundColor: color }}></div>
                              </div>
                            </div>

                            {/* Статус */}
                            <div className="p-2 bg-green-50 border border-green-200 rounded mb-3">
                              <p className="text-sm font-medium text-green-800">
                                {zone.legal_status}
                              </p>
                            </div>

                            {/* Відстань до ПЗФ */}
                            {zone.type === "near_pfz" && zone.distance_from_pfz && (
                              <p className="text-sm mb-3">
                                🌲 Відстань до ПЗФ: <strong>{zone.distance_from_pfz} км</strong>
                              </p>
                            )}

                            {/* ОБҐРУНТУВАННЯ */}
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg mb-3">
                              <h4 className="font-semibold mb-2 flex items-center gap-1">
                                <BarChart3 size={16} />
                                Обґрунтування:
                              </h4>
                              <ul className="text-sm space-y-1">
                                <li>• {zone.reasoning.point1}</li>
                                <li>• {zone.reasoning.point2}</li>
                                <li>• {zone.reasoning.point3}</li>
                              </ul>
                            </div>

                            {/* РЕКОМЕНДОВАНА ІНФРАСТРУКТУРА */}
                            <div className="mt-3 p-3 bg-green-50 rounded-lg mb-3">
                              <h4 className="font-semibold mb-2 flex items-center gap-1">
                                <Building2 size={16} />
                                Рекомендована інфраструктура:
                              </h4>
                              <ul className="text-sm space-y-1">
                                {zone.recommended_facilities.map((facility, idx) => (
                                  <li key={idx}>• {facility}</li>
                                ))}
                              </ul>
                            </div>

                            {/* Базова інформація */}
                            <div className="space-y-1 text-sm mb-3">
                              <p>Тип: <strong>{zone.recommended_type}</strong></p>
                              <p>Місткість: <strong>{zone.capacity}</strong></p>
                              <p>Інвестиції: <strong>{zone.investment}</strong></p>
                              <p>Окупність: <strong>{zone.payback}</strong></p>
                              <p>Існуючих пунктів поблизу: <strong>{zone.competitors_nearby}</strong></p>
                            </div>

                            {/* ІНФРАСТРУКТУРА ПОБЛИЗУ */}
                            <div className="mt-3 border-t pt-3">
                              <h4 className="font-semibold mb-2">🌍 Інфраструктура поблизу:</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>🏥 Лікарня: {zone.infrastructure.hospital_distance} км</div>
                                <div>⛽ Заправка: {zone.infrastructure.gas_station_distance} км</div>
                                <div>🏪 Супермаркет: {zone.infrastructure.shop_distance} км</div>
                                <div>📡 Мобільний: {zone.infrastructure.mobile_coverage}%</div>
                                <div className="col-span-2">
                                  🚗 Дорога: {zone.infrastructure.nearest_road}
                                  ({zone.infrastructure.road_quality})
                                </div>
                              </div>
                            </div>

                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}

                  {/* Region score markers */}
                  {layers.regionScores && !selectedRegion && allAnalysis.map((analysis, idx) => {
                    const center = REGION_CENTERS[analysis.region];
                    if (!center) return null;
                    return (
                      <Marker key={`reg-${idx}`} position={center} icon={createIcon(getScoreColor(analysis.total_score), 28)}
                        eventHandlers={{ click: () => handleRegionChange(analysis.region) }}>
                        <Popup>
                          <div className="text-sm min-w-[180px]">
                            <p className="font-bold mb-1">{analysis.region}</p>
                            <div className="flex items-center justify-between">
                              <span>Потенціал:</span>
                              <Badge style={{ backgroundColor: getScoreColor(analysis.total_score) }}>{analysis.total_score}/100</Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{analysis.category}</p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </Card>
          </div>

          {/* Right - Analysis Panel */}
          <aside className="col-span-12 lg:col-span-5">
            <Card className="h-[calc(100vh-120px)] flex flex-col">
              <CardContent className="flex-1 overflow-hidden p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
                    <TabsTrigger value="analysis">Аналіз</TabsTrigger>
                    <TabsTrigger value="locations">Локації</TabsTrigger>
                    <TabsTrigger value="compare">Порівняння</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="analysis" className="flex-1 overflow-hidden m-0">
                    <ScrollArea className="h-full">
                      <div className="p-4">
                        {loading ? (
                          <div className="flex items-center justify-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                          </div>
                        ) : analysisResult ? (
                          <div className="space-y-4">
                            {/* Header */}
                            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border">
                              <h2 className="text-xl font-bold text-slate-800 mb-3">{analysisResult.region}</h2>
                              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full text-white text-2xl font-bold mb-2"
                                style={{ backgroundColor: getScoreColor(analysisResult.total_score) }}>
                                {analysisResult.total_score}
                              </div>
                              <p className="text-sm text-slate-500">зі 100 балів</p>
                              <Badge className="mt-2 text-white" style={{ backgroundColor: getCategoryColor(analysisResult.category) }}>
                                {analysisResult.category}
                              </Badge>
                            </div>

                            {/* Radar Chart */}
                            <div className="h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={getRadarData()}>
                                  <PolarGrid />
                                  <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11 }} />
                                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                                  <Radar name="Потенціал" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>

                            {/* Factors Accordion */}
                            <Accordion type="multiple" defaultValue={['demand']} className="w-full">
                              {/* DEMAND */}
                              <AccordionItem value="demand">
                                <AccordionTrigger className="text-sm py-2">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-500" />
                                    <span>1. ПОПИТ ВІД НАСЕЛЕННЯ</span>
                                    <Badge variant="outline" className="ml-auto">{analysisResult.demand_score}/25</Badge>
                                    {getScoreIcon(analysisResult.demand_score, 25)}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="pl-6 space-y-3 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="bg-slate-50 rounded p-2">
                                        <p className="text-xs text-slate-500">Населення</p>
                                        <p className="font-semibold">{analysisResult.details.population.total?.toLocaleString()} осіб</p>
                                      </div>
                                      <div className="bg-slate-50 rounded p-2">
                                        <p className="text-xs text-slate-500">Густота</p>
                                        <p className="font-semibold">{analysisResult.details.population.density_per_km2} осіб/км²</p>
                                      </div>
                                    </div>
                                    <div className="bg-blue-50 rounded p-3">
                                      <p className="text-xs text-slate-500 mb-1">Аналіз попиту/пропозиції:</p>
                                      <div className="space-y-1">
                                        <p>Річний попит: <strong>{analysisResult.details.population.annual_demand?.toLocaleString()}</strong> відвідувань</p>
                                        <p>Річна пропозиція: <strong>{analysisResult.details.population.annual_supply?.toLocaleString()}</strong> місць</p>
                                        <p>Співвідношення: <strong>{analysisResult.details.population.supply_demand_ratio}</strong></p>
                                      </div>
                                    </div>
                                    <div className={`rounded p-3 ${analysisResult.details.population.gap > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                                      <p className={`font-semibold ${analysisResult.details.population.gap > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                        {analysisResult.details.population.gap_status}: {Math.abs(analysisResult.details.population.gap).toLocaleString()} відвідувань
                                      </p>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* PFZ */}
                              <AccordionItem value="pfz">
                                <AccordionTrigger className="text-sm py-2">
                                  <div className="flex items-center gap-2">
                                    <TreePine className="w-4 h-4 text-emerald-500" />
                                    <span>2. ПЗФ ЯК АТРАКТОР</span>
                                    <Badge variant="outline" className="ml-auto">{analysisResult.pfz_score}/20</Badge>
                                    {getScoreIcon(analysisResult.pfz_score, 20)}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="pl-6 space-y-3 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="bg-emerald-50 rounded p-2">
                                        <p className="text-xs text-slate-500">НПП</p>
                                        <p className="font-semibold text-lg">{analysisResult.details.pfz.national_parks}</p>
                                      </div>
                                      <div className="bg-green-50 rounded p-2">
                                        <p className="text-xs text-slate-500">Заповідники</p>
                                        <p className="font-semibold text-lg">{analysisResult.details.pfz.nature_reserves}</p>
                                      </div>
                                      <div className="bg-teal-50 rounded p-2">
                                        <p className="text-xs text-slate-500">РЛП</p>
                                        <p className="font-semibold text-lg">{analysisResult.details.pfz.regional_landscape_parks}</p>
                                      </div>
                                      <div className="bg-cyan-50 rounded p-2">
                                        <p className="text-xs text-slate-500">Заказники</p>
                                        <p className="font-semibold text-lg">{analysisResult.details.pfz.zakazniks}</p>
                                      </div>
                                    </div>
                                    <div className="flex justify-between bg-slate-50 rounded p-2">
                                      <span>Під ПЗФ:</span>
                                      <span className="font-semibold">{analysisResult.details.pfz.percent_of_region}% території</span>
                                    </div>
                                    {analysisResult.details.pfz.notable_objects?.length > 0 && (
                                      <div className="bg-amber-50 rounded p-3">
                                        <p className="text-xs text-slate-500 mb-2">Відомі об&apos;єкти:</p>
                                        {analysisResult.details.pfz.notable_objects.map((obj, i) => (
                                          <p key={i} className="text-emerald-700">★ {obj}</p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* NATURE */}
                              <AccordionItem value="nature">
                                <AccordionTrigger className="text-sm py-2">
                                  <div className="flex items-center gap-2">
                                    <Waves className="w-4 h-4 text-cyan-500" />
                                    <span>3. ПРИРОДНІ РЕСУРСИ</span>
                                    <Badge variant="outline" className="ml-auto">{analysisResult.nature_score}/15</Badge>
                                    {getScoreIcon(analysisResult.nature_score, 15)}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="pl-6 space-y-3 text-sm">
                                    <div className="flex items-center justify-between bg-green-50 rounded p-3">
                                      <div className="flex items-center gap-2">
                                        <TreePine className="w-5 h-5 text-green-600" />
                                        <span>Лісове покриття</span>
                                      </div>
                                      <span className="font-bold text-green-700">{analysisResult.details.nature.forest_coverage_percent}%</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-blue-50 rounded p-3">
                                      <div className="flex items-center gap-2">
                                        <Waves className="w-5 h-5 text-blue-600" />
                                        <span>Водні об&apos;єкти</span>
                                      </div>
                                      {analysisResult.details.nature.has_water_bodies ? (
                                        <Badge className="bg-blue-500">Наявні</Badge>
                                      ) : (
                                        <Badge variant="secondary">Відсутні</Badge>
                                      )}
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* TRANSPORT */}
                              <AccordionItem value="transport">
                                <AccordionTrigger className="text-sm py-2">
                                  <div className="flex items-center gap-2">
                                    <Car className="w-4 h-4 text-indigo-500" />
                                    <span>4. ТРАНСПОРТНА ДОСТУПНІСТЬ</span>
                                    <Badge variant="outline" className="ml-auto">{analysisResult.accessibility_score}/15</Badge>
                                    {getScoreIcon(analysisResult.accessibility_score, 15)}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="pl-6 space-y-3 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="bg-indigo-50 rounded p-2">
                                        <p className="text-xs text-slate-500">Рейтинг</p>
                                        <p className="font-semibold">{analysisResult.details.transport.accessibility_score}/10</p>
                                      </div>
                                      <div className="bg-purple-50 rounded p-2">
                                        <p className="text-xs text-slate-500">Щільність доріг</p>
                                        <p className="font-semibold">{analysisResult.details.transport.highway_density} км</p>
                                      </div>
                                    </div>
                                    {analysisResult.details.transport.main_roads?.length > 0 && (
                                      <div className="bg-slate-50 rounded p-3">
                                        <p className="text-xs text-slate-500 mb-2">Міжнародні траси:</p>
                                        {analysisResult.details.transport.main_roads.filter(r => r.type === 'міжнародна').slice(0, 4).map((road, i) => (
                                          <p key={i} className="text-indigo-700">✓ {road.name} ({road.quality})</p>
                                        ))}
                                      </div>
                                    )}
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                      <div className="bg-slate-50 rounded p-2">
                                        <p className="text-xs text-slate-500">Залізниці</p>
                                        <p className="font-semibold">{analysisResult.details.transport.railway_stations}</p>
                                      </div>
                                      <div className="bg-slate-50 rounded p-2">
                                        <p className="text-xs text-slate-500">Аеропорти</p>
                                        <p className="font-semibold">{analysisResult.details.transport.airports}</p>
                                      </div>
                                      <div className="bg-slate-50 rounded p-2">
                                        <p className="text-xs text-slate-500">Час до міста</p>
                                        <p className="font-semibold">{analysisResult.details.transport.avg_travel_time_minutes} хв</p>
                                      </div>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* INFRASTRUCTURE */}
                              <AccordionItem value="infra">
                                <AccordionTrigger className="text-sm py-2">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-orange-500" />
                                    <span>5. ІНФРАСТРУКТУРА</span>
                                    <Badge variant="outline" className="ml-auto">{analysisResult.infrastructure_score}/10</Badge>
                                    {getScoreIcon(analysisResult.infrastructure_score, 10)}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="pl-6 space-y-2 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="flex items-center gap-2 bg-red-50 rounded p-2">
                                        <Hospital className="w-4 h-4 text-red-500" />
                                        <div>
                                          <p className="text-xs text-slate-500">Лікарні/100к</p>
                                          <p className="font-semibold">{analysisResult.details.infrastructure.hospitals_per_100k}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 bg-amber-50 rounded p-2">
                                        <Fuel className="w-4 h-4 text-amber-500" />
                                        <div>
                                          <p className="text-xs text-slate-500">Заправки</p>
                                          <p className="font-semibold">{analysisResult.details.infrastructure.gas_stations_per_100km2}/100км²</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 bg-blue-50 rounded p-2">
                                        <Wifi className="w-4 h-4 text-blue-500" />
                                        <div>
                                          <p className="text-xs text-slate-500">Моб. зв&apos;язок</p>
                                          <p className="font-semibold">{analysisResult.details.infrastructure.mobile_coverage_percent}%</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 bg-purple-50 rounded p-2">
                                        <Hotel className="w-4 h-4 text-purple-500" />
                                        <div>
                                          <p className="text-xs text-slate-500">Готелі</p>
                                          <p className="font-semibold">{analysisResult.details.infrastructure.hotels_total}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* FOREST FIRES - NEW */}
                              {analysisResult.fire_score !== undefined && (
                                <AccordionItem value="fires">
                                  <AccordionTrigger className="text-sm py-2">
                                    <div className="flex items-center gap-2">
                                      <Zap className="w-4 h-4 text-orange-500" />
                                      <span>6. РИЗИК ЛІСОВИХ ПОЖЕЖ (профілактика)</span>
                                      <Badge variant="outline" className="ml-auto text-orange-600">{analysisResult.fire_score}/5</Badge>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="pl-6 space-y-3 text-sm">
                                      <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-slate-50 rounded p-2">
                                          <p className="text-xs text-slate-500">Всього пожеж</p>
                                          <p className="font-semibold text-lg">{analysisResult.details.fires.total_fires}</p>
                                        </div>
                                        <div className="bg-orange-50 rounded p-2">
                                          <p className="text-xs text-slate-500">Від людей</p>
                                          <p className="font-semibold text-lg text-orange-600">{analysisResult.details.fires.human_caused_fires}</p>
                                        </div>
                                        <div className="bg-green-50 rounded p-2">
                                          <p className="text-xs text-slate-500">Бонус</p>
                                          <p className="font-semibold text-lg text-green-600">+{analysisResult.fire_score}</p>
                                        </div>
                                      </div>
                                      <div className="bg-orange-50 border border-orange-200 rounded p-3">
                                        <p className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                                          <Zap className="w-4 h-4" />
                                          Логіка профілактики:
                                        </p>
                                        <p className="text-xs text-orange-700">
                                          {analysisResult.details.fires.interpretation}
                                        </p>
                                        <ul className="text-xs text-orange-700 mt-2 space-y-1">
                                          <li>✅ Облаштовані пункти знижують ризик на 40%</li>
                                          <li>✅ Контрольовані вогнища у кам'яних кільцях</li>
                                          <li>✅ Доступ до води для гасіння</li>
                                        </ul>
                                      </div>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              )}

                              {/* SATURATION */}
                              <AccordionItem value="saturation">
                                <AccordionTrigger className="text-sm py-2">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    <span>7. ШТРАФ ЗА НАСИЧЕНІСТЬ</span>
                                    <Badge variant="outline" className="ml-auto text-red-600">{analysisResult.saturation_penalty}/15</Badge>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="pl-6 space-y-3 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="bg-slate-50 rounded p-2">
                                        <p className="text-xs text-slate-500">Існуючих пунктів</p>
                                        <p className="font-semibold text-lg">{analysisResult.details.saturation.existing_points}</p>
                                      </div>
                                      <div className="bg-slate-50 rounded p-2">
                                        <p className="text-xs text-slate-500">Щільність</p>
                                        <p className="font-semibold">{analysisResult.details.saturation.density_per_1000km2}/1000км²</p>
                                      </div>
                                    </div>
                                    <div className={`rounded p-3 ${analysisResult.saturation_penalty < -5 ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                                      <p className={`font-semibold ${analysisResult.saturation_penalty < -5 ? 'text-red-700' : 'text-emerald-700'}`}>
                                        {analysisResult.details.saturation.density_status}
                                      </p>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>

                            {/* Conclusion */}
                            <div className={`rounded-lg p-4 ${analysisResult.details.investment.should_build ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                {analysisResult.details.investment.should_build ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-600" />
                                )}
                                <span className={`font-bold ${analysisResult.details.investment.should_build ? 'text-emerald-700' : 'text-red-700'}`}>
                                  {analysisResult.details.investment.should_build ? 'РЕКОМЕНДУЄТЬСЯ БУДУВАТИ' : 'БУДІВНИЦТВО РИЗИКОВАНЕ'}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600">{analysisResult.recommendation}</p>
                            </div>

                            {/* Points needed to cover deficit */}
                            {analysisResult.details.population.gap > 0 && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-semibold flex items-center gap-2 mb-3 text-blue-800">
                                  <Target className="w-4 h-4" />
                                  Висновок: як покрити дефіцит
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <p className="text-blue-700">
                                    Для покриття дефіциту в <strong>{analysisResult.details.population.gap.toLocaleString()}</strong> відвідувань/рік 
                                    необхідно побудувати приблизно:
                                  </p>
                                  <div className="bg-white rounded p-3 text-center">
                                    <p className="text-3xl font-bold text-blue-600">{calculatePointsNeeded(analysisResult.details.population.gap)}</p>
                                    <p className="text-xs text-slate-500">рекреаційних пунктів</p>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-2">
                                    * Розрахунок: середня місткість 50 осіб × 180 днів сезону × 2 зміни = 18,000 відвідувань/рік на пункт
                                  </p>
                                </div>
                              </div>
                            )}

                            {analysisResult.details.population.gap <= 0 && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <h4 className="font-semibold flex items-center gap-2 mb-2 text-amber-800">
                                  <AlertTriangle className="w-4 h-4" />
                                  Висновок: ринок насичений
                                </h4>
                                <p className="text-sm text-amber-700">
                                  Пропозиція перевищує попит на <strong>{Math.abs(analysisResult.details.population.gap).toLocaleString()}</strong> відвідувань/рік. 
                                  Нове стандартне будівництво може бути збитковим. Рекомендується розглядати тільки унікальні концепти або преміум-сегмент.
                                </p>
                              </div>
                            )}

                            {/* Investment */}
                            <div className="bg-slate-50 rounded-lg p-4">
                              <h4 className="font-semibold flex items-center gap-2 mb-3">
                                <DollarSign className="w-4 h-4 text-emerald-600" />
                                Інвестиційний прогноз
                              </h4>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-xs text-slate-500">Рівень ризику</p>
                                  <p className="font-semibold">{analysisResult.details.investment.risk_level}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500">Масштаб</p>
                                  <p className="font-semibold text-xs">{analysisResult.details.investment.investment_scale}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-60 text-slate-400">
                            <MapPin className="w-12 h-12 mb-3" />
                            <p>Оберіть область для аналізу</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="locations" className="flex-1 overflow-hidden m-0">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-3">
                        {recommendedZones.filter(z => !selectedRegion || z.region === selectedRegion).length > 0 ? (
                          <>
                            <h3 className="font-semibold flex items-center gap-2">
                              <Target className="w-4 h-4 text-emerald-600" />
                              Рекомендовані зони ({recommendedZones.filter(z => !selectedRegion || z.region === selectedRegion).length})
                            </h3>
                            {recommendedZones.filter(z => !selectedRegion || z.region === selectedRegion).map((zone, idx) => (
                              <Card key={idx} className="border-emerald-200">
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <p className="font-semibold text-sm">{zone.name}</p>
                                      {zone.type === "near_pfz" && zone.pfz_object && (
                                        <p className="text-xs text-slate-500">Біля: {zone.pfz_object}</p>
                                      )}
                                    </div>
                                    <Badge style={{ backgroundColor: zone.priority >= 85 ? '#ef4444' : zone.priority >= 70 ? '#f97316' : '#eab308' }}>
                                      {zone.priority}/100
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                    <p><span className="text-slate-500">Тип:</span> {zone.recommended_type}</p>
                                    <p><span className="text-slate-500">Місткість:</span> {zone.capacity}</p>
                                    <p><span className="text-slate-500">Інвестиції:</span> {zone.investment}</p>
                                    <p><span className="text-slate-500">Окупність:</span> {zone.payback}</p>
                                  </div>
                                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => focusOnLocation(zone.coordinates)}>
                                    <Navigation className="w-3 h-3 mr-1" />
                                    Показати на карті
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </>
                        ) : selectedRegion ? (
                          <div className="text-center py-8 text-slate-500">
                            <MapPin className="w-10 h-10 mx-auto mb-2" />
                            <p>Немає рекомендованих зон для цієї області</p>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-slate-500">
                            <MapPin className="w-10 h-10 mx-auto mb-2" />
                            <p>Оберіть область або перегляньте всі зони на карті</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="compare" className="flex-1 overflow-hidden m-0">
                    <ScrollArea className="h-full">
                      <div className="p-4">
                        <h3 className="font-semibold mb-3">Порівняння областей</h3>
                        <div className="space-y-2">
                          {allAnalysis.map((analysis, idx) => (
                            <div key={idx} className={`p-3 rounded-lg border cursor-pointer hover:bg-slate-50 ${selectedRegion === analysis.region ? 'border-emerald-500 bg-emerald-50' : ''}`}
                              onClick={() => handleRegionChange(analysis.region)}>
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-medium text-sm">{idx + 1}. {analysis.region}</p>
                                  <p className="text-xs text-slate-500">{analysis.category}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                  style={{ backgroundColor: getScoreColor(analysis.total_score) }}>
                                  {analysis.total_score}
                                </div>
                              </div>
                              <div className="grid grid-cols-6 gap-1 text-xs">
                                <div className="text-center">
                                  <p className="text-slate-400">Поп</p>
                                  <p className="font-medium">{analysis.demand_score}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-slate-400">ПЗФ</p>
                                  <p className="font-medium">{analysis.pfz_score}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-slate-400">Пр</p>
                                  <p className="font-medium">{analysis.nature_score}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-slate-400">Тр</p>
                                  <p className="font-medium">{analysis.accessibility_score}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-slate-400">Ін</p>
                                  <p className="font-medium">{analysis.infrastructure_score}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-slate-400">Нас</p>
                                  <p className="font-medium text-red-500">{analysis.saturation_penalty}</p>
                                </div>
                              </div>
                            </div>
                          ))}
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/map" element={<MapPage />} />
      </Routes>
    </Router>
  );
}

export default App;
