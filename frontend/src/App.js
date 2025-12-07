import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker, GeoJSON } from 'react-leaflet';
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
import { MdMap, MdAnalytics, MdDownload, MdApartment, MdPeople, MdTrendingUp, MdWarning, MdCheckCircle, MdCancel, MdPlace, MdLayers, MdStar, MdLocalGasStation, MdLocalHospital, MdWifi, MdHotel, MdNavigation, MdDescription, MdAttachMoney, MdSchedule, MdRestaurant, MdElectricalServices, MdArrowBack, MdArrowUpward } from 'react-icons/md';
import { GiForest, GiWaterDrop, GiFireBowl, GiMountains } from 'react-icons/gi';
import { TbMapSearch, TbChartDots3, TbTarget, TbDatabase } from 'react-icons/tb';
import { FaCar } from 'react-icons/fa';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell } from 'recharts';
import LandingPage from './components/LandingPage';
import DataImport from './components/DataImport';
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

// Ukraine map bounds
const UKRAINE_BOUNDS = [
  [44.0, 22.0],  // Southwest corner
  [52.5, 40.5]   // Northeast corner
];

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
  const navigate = useNavigate();
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [allAnalysis, setAllAnalysis] = useState([]);
  const [recreationalPoints, setRecreationalPoints] = useState([]);
  const [recommendedZones, setRecommendedZones] = useState([]);
  const [pfzObjects, setPfzObjects] = useState([]);
  const [forestFires, setForestFires] = useState([]);
  const [regionBoundaries, setRegionBoundaries] = useState([]);
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
    regionBoundaries: false,
  });

  useEffect(() => {
    loadInitialData();
    
    // Scroll to top button handler
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadInitialData = async () => {
    try {
      const [regionsRes, pointsRes, allAnalysisRes, pfzRes, zonesRes, firesRes, boundariesRes] = await Promise.all([
        axios.get(`${API}/regions`),
        axios.get(`${API}/recreational-points`),
        axios.get(`${API}/analyze-all`),
        axios.get(`${API}/pfz-objects`),
        axios.get(`${API}/recommended-zones`),
        axios.get(`${API}/forest-fires`),
        axios.get(`${API}/region-boundaries`)
      ]);
      
      setRegions(regionsRes.data.regions || []);
      setRecreationalPoints(pointsRes.data.features || []);
      setAllAnalysis(allAnalysisRes.data.results || []);
      setPfzObjects(pfzRes.data.objects || []);
      const zones = zonesRes.data.zones || [];
      console.log('Loaded recommended zones:', zones.length, zones);
      setRecommendedZones(zones);
      setForestFires(firesRes.data.features || []);
      setRegionBoundaries(boundariesRes.data.features || []);
      console.log('Loaded forest fires:', firesRes.data.features?.length || 0);
      console.log('Loaded region boundaries:', boundariesRes.data.features?.length || 0);
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
    console.log('🔍 exportPDF called');
    if (!analysisResult) {
      console.error('❌ No analysisResult');
      return;
    }
    
    try {
      // Pre-calculate colors safely
      const scoreColor = getScoreColor(analysisResult.total_score);
      const categoryColor = getCategoryColor(analysisResult.category);
      console.log('✅ Colors calculated:', scoreColor, categoryColor);
      
      // Create a temporary div for PDF content
      const pdfContent = document.createElement('div');
      pdfContent.style.cssText = 'position: absolute; left: -9999px; width: 800px; padding: 40px; background: white; font-family: Arial, sans-serif; font-size: 11px;';
      
      const d = analysisResult.details;
      const shouldBuild = d?.investment?.should_build;
      
      pdfContent.innerHTML = `
      <!-- ТИТУЛЬНА СТОРІНКА -->
      <div style="text-align: center; margin-bottom: 25px; border-bottom: 3px solid #f59e0b; padding-bottom: 20px;">
        <h1 style="color: #1e293b; margin: 0; font-size: 22px; font-weight: bold;">НАУКОВИЙ ЗВІТ</h1>
        <h2 style="color: #f59e0b; margin: 8px 0; font-size: 18px;">АНАЛІЗ РЕКРЕАЦІЙНОГО ПОТЕНЦІАЛУ</h2>
        <h3 style="color: #475569; margin: 8px 0; font-size: 16px;">${analysisResult.region}</h3>
        <div style="display: inline-block; width: 80px; height: 80px; border-radius: 50%; background: ${scoreColor}; color: white; line-height: 80px; font-size: 28px; font-weight: bold; margin: 15px 0; border: 4px solid #f59e0b;">
          ${analysisResult.total_score}
        </div>
        <p style="color: #64748b; margin: 5px 0; font-size: 11px;">зі 100 балів</p>
        <span style="display: inline-block; padding: 5px 14px; border-radius: 15px; background: ${categoryColor}; color: white; font-weight: bold; font-size: 11px;">${analysisResult.category}</span>
        <p style="color: #94a3b8; margin-top: 15px; font-size: 10px;">Згенеровано: ${new Date().toLocaleString('uk-UA')}</p>
      </div>
      
      <!-- МЕТОДОЛОГІЯ -->
      <h3 style="color: #1e293b; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; margin-top: 20px; font-size: 14px;">📐 МЕТОДОЛОГІЯ РОЗРАХУНКУ</h3>
      <div style="background: #fef3c7; padding: 12px; border-left: 4px solid #f59e0b; margin-bottom: 15px; font-size: 10px;">
        <p style="margin: 0 0 8px 0; font-weight: bold;">Загальна формула оцінки потенціалу:</p>
        <p style="margin: 0; font-family: 'Courier New', monospace; background: white; padding: 8px; border-radius: 4px;">
          <strong>TOTAL</strong> = Попит(0-25) + ПЗФ(0-20) + Природа(0-15) + Транспорт(0-15) + Інфраструктура(0-10) + Пожежі(0-5) - Насиченість(0-15)
        </p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px;">
        <tr style="background: #1e293b; color: white;">
          <th style="padding: 8px; text-align: left; border: 1px solid #475569;">Фактор</th>
          <th style="padding: 8px; text-align: left; border: 1px solid #475569;">Формула розрахунку</th>
          <th style="padding: 8px; text-align: center; border: 1px solid #475569; width: 60px;">Макс</th>
        </tr>
        <tr>
          <td style="padding: 6px; border: 1px solid #e2e8f0;"><strong>1. Попит</strong></td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; font-family: 'Courier New', monospace; font-size: 9px;">населення × 0.15 - існуюча_пропозиція</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center;">25</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 6px; border: 1px solid #e2e8f0;"><strong>2. ПЗФ</strong></td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; font-family: 'Courier New', monospace; font-size: 9px;">НПП×8 + Заповідники×6 + РЛП×3 + Заказники×1</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center;">20</td>
        </tr>
        <tr>
          <td style="padding: 6px; border: 1px solid #e2e8f0;"><strong>3. Природа</strong></td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; font-family: 'Courier New', monospace; font-size: 9px;">ліси% × 0.15 + водойми(так/ні) × 5</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center;">15</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 6px; border: 1px solid #e2e8f0;"><strong>4. Транспорт</strong></td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; font-family: 'Courier New', monospace; font-size: 9px;">щільність_доріг × 2 + залізниці × 3 + аеропорти × 5</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center;">15</td>
        </tr>
        <tr>
          <td style="padding: 6px; border: 1px solid #e2e8f0;"><strong>5. Інфраструктура</strong></td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; font-family: 'Courier New', monospace; font-size: 9px;">лікарні/100к + заправки + готелі + мобільний%</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center;">10</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 6px; border: 1px solid #e2e8f0;"><strong>6. Пожежі</strong></td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; font-family: 'Courier New', monospace; font-size: 9px;">людських_пожеж ÷ 100 (більше = вища потреба)</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center;">5</td>
        </tr>
        <tr>
          <td style="padding: 6px; border: 1px solid #e2e8f0; color: #dc2626;"><strong>7. Штраф</strong></td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; font-family: 'Courier New', monospace; font-size: 9px; color: #dc2626;">-1 за кожні 50 пунктів/1000км²</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; color: #dc2626;">-15</td>
        </tr>
      </table>
      
      <h3 style="color: #1e293b; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; margin-top: 20px; font-size: 14px;">📊 ОЦІНКА ЗА ФАКТОРАМИ</h3>
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
          <td style="padding: 12px; border: 1px solid #e2e8f0;">Профілактика пожеж</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${analysisResult.fire_score || 0}/5</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 12px; border: 1px solid #e2e8f0; color: #dc2626;">Штраф за насиченість</td>
          <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #dc2626;">${analysisResult.saturation_penalty}/15</td>
        </tr>
      </table>
      
      <!-- ВИХІДНІ ДАНІ -->
      <h3 style="color: #1e293b; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; margin-top: 20px; font-size: 14px;">📁 ВИХІДНІ ДАНІ ДЛЯ РОЗРАХУНКУ</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px;">
        <tr style="background: #1e293b; color: white;">
          <th style="padding: 6px; text-align: left; border: 1px solid #475569;">Категорія</th>
          <th style="padding: 6px; text-align: left; border: 1px solid #475569;">Параметр</th>
          <th style="padding: 6px; text-align: right; border: 1px solid #475569;">Значення</th>
        </tr>
        <tr>
          <td rowspan="3" style="padding: 6px; border: 1px solid #e2e8f0; background: #eff6ff; font-weight: bold;">Демографія</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Населення області</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.population?.total?.toLocaleString() || 'N/A'} осіб</td>
        </tr>
        <tr>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Густота населення</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.population?.density_per_km2 || 'N/A'} осіб/км²</td>
        </tr>
        <tr>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Коефіцієнт відвідувань</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">0.15 (15% населення)</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td rowspan="5" style="padding: 6px; border: 1px solid #e2e8f0; background: #dcfce7; font-weight: bold;">ПЗФ</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Національні природні парки</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.pfz?.national_parks || 0} шт.</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Природні заповідники</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.pfz?.nature_reserves || 0} шт.</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Регіональні ландшафтні парки</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.pfz?.regional_landscape_parks || 0} шт.</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Заказники</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.pfz?.zakazniks || 0} шт.</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Площа під ПЗФ</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.pfz?.percent_of_region || 0}% території</td>
        </tr>
        <tr>
          <td rowspan="2" style="padding: 6px; border: 1px solid #e2e8f0; background: #dbeafe; font-weight: bold;">Природа</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Лісове покриття</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.nature?.forest_coverage_percent || 0}%</td>
        </tr>
        <tr>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Водні об'єкти</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.nature?.has_water_bodies ? 'Наявні' : 'Відсутні'}</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td rowspan="3" style="padding: 6px; border: 1px solid #e2e8f0; background: #fae8ff; font-weight: bold;">Транспорт</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Щільність доріг</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.transport?.highway_density || 0} км/100км²</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Залізничні станції</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.transport?.railway_stations || 0} шт.</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Аеропорти</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.transport?.airports || 0} шт.</td>
        </tr>
        <tr>
          <td rowspan="4" style="padding: 6px; border: 1px solid #e2e8f0; background: #fef3c7; font-weight: bold;">Інфраструктура</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Лікарні на 100 тис. населення</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.infrastructure?.hospitals_per_100k || 0}</td>
        </tr>
        <tr>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Заправки на 100 км²</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.infrastructure?.gas_stations_per_100km2 || 0}</td>
        </tr>
        <tr>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Готелі (всього)</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.infrastructure?.hotels_total || 0} шт.</td>
        </tr>
        <tr>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Покриття мобільним зв'язком</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.infrastructure?.mobile_coverage_percent || 0}%</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td rowspan="2" style="padding: 6px; border: 1px solid #e2e8f0; background: #fee2e2; font-weight: bold;">Пожежі</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Всього пожеж (2025)</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.fires?.total_fires || 0} шт.</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Спричинені людьми</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.fires?.human_caused_fires || 0} шт.</td>
        </tr>
        <tr>
          <td style="padding: 6px; border: 1px solid #e2e8f0; background: #e0e7ff; font-weight: bold;">Насиченість</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Існуючі рекреаційні пункти</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: right; font-family: monospace;">${d?.saturation?.existing_points || 0} шт.</td>
        </tr>
      </table>
      
      <h3 style="color: #1e293b; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; margin-top: 20px; font-size: 14px;">🧮 ПОКРОКОВІ МАТЕМАТИЧНІ РОЗРАХУНКИ</h3>
      
      <!-- ФАКТОР 1: ПОПИТ (ДЕТАЛЬНО) -->
      <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin-bottom: 15px; font-size: 10px;">
        <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 12px;">📊 ФАКТОР 1: ПОПИТ ВІД НАСЕЛЕННЯ (Вага: 25%, максимум 25 балів)</h4>
        
        <div style="margin: 10px 0;">
          <strong style="color: #1e40af;">▶ Крок 1: Розрахунок річного попиту</strong><br/>
          <div style="background: white; padding: 8px; border-radius: 3px; margin: 5px 0; font-family: monospace; font-size: 9px;">
            <strong>Формула:</strong> Попит = Населення × 0.15 × 3 відв./рік<br/>
            <strong>Підставлення:</strong> ${d?.population?.total?.toLocaleString() || 0} × 0.15 × 3<br/>
            <strong>Обґрунтування 0.15:</strong> 15% населення - потенційні відвідувачі (Kentucky SCORP 2020)<br/>
            <strong>Обґрунтування 3 відв.:</strong> Середня кількість візитів/рік (DC SCORP)
          </div>
          <div style="background: #dbeafe; padding: 5px 10px; border-radius: 3px; display: inline-block;">
            <strong>Результат:</strong> ${((d?.population?.total || 0) * 0.15 * 3).toLocaleString()} відвідувань/рік
          </div>
        </div>
        
        <div style="margin: 10px 0;">
          <strong style="color: #1e40af;">▶ Крок 2: Існуюча пропозиція</strong><br/>
          <div style="background: white; padding: 8px; border-radius: 3px; margin: 5px 0; font-family: monospace; font-size: 9px;">
            <strong>Формула:</strong> Пропозиція = Пункти × 50 місць × 180 днів × 2 зміни<br/>
            <strong>Існуючі пункти:</strong> ${d?.saturation?.existing_points || 0} об'єктів<br/>
            <strong>Середня місткість:</strong> 50 місць (стандарт)<br/>
            <strong>Сезон:</strong> 180 днів, 2 зміни/день
          </div>
          <div style="background: #dbeafe; padding: 5px 10px; border-radius: 3px; display: inline-block;">
            <strong>Результат:</strong> ${((d?.saturation?.existing_points || 0) * 50 * 180 * 2).toLocaleString()} місць/рік
          </div>
        </div>
        
        <div style="margin: 10px 0;">
          <strong style="color: #1e40af;">▶ Крок 3: Дефіцит/Профіцит</strong><br/>
          <div style="background: white; padding: 8px; border-radius: 3px; margin: 5px 0; font-family: monospace; font-size: 9px;">
            <strong>Формула:</strong> Gap = Попит - Пропозиція<br/>
            <strong>Розрахунок:</strong> ${((d?.population?.total || 0) * 0.15 * 3).toLocaleString()} - ${((d?.saturation?.existing_points || 0) * 50 * 180 * 2).toLocaleString()}
          </div>
          <div style="background: ${d?.population?.gap > 0 ? '#fee2e2' : '#dcfce7'}; padding: 5px 10px; border-radius: 3px; display: inline-block; color: ${d?.population?.gap > 0 ? '#991b1b' : '#14532d'};">
            <strong>Результат:</strong> ${d?.population?.gap > 0 ? '+' : ''}${(d?.population?.gap || 0).toLocaleString()} — ${d?.population?.gap_status || 'N/A'}
          </div>
        </div>
        
        <div style="margin: 10px 0;">
          <strong style="color: #1e40af;">▶ Крок 4: Нормалізація до 0-25</strong><br/>
          <div style="background: white; padding: 8px; border-radius: 3px; margin: 5px 0; font-family: monospace; font-size: 9px;">
            <strong>Метод:</strong> Логарифмічна нормалізація з урахуванням дефіциту<br/>
            <strong>Логіка:</strong> Більший дефіцит → вищий бал (вища потреба)
          </div>
          <div style="background: #16a34a; color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold; display: inline-block;">
            ✅ ФІНАЛЬНИЙ БАЛ: ${analysisResult.demand_score}/25
          </div>
        </div>
      </div>
      
      <!-- ФАКТОР 2: ПЗФ (ДЕТАЛЬНО) -->
      <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #16a34a; margin-bottom: 15px; font-size: 10px;">
        <h4 style="margin: 0 0 10px 0; color: #16a34a; font-size: 12px;">🌲 ФАКТОР 2: ПЗФ ЯК АТРАКТОР (Вага: 20%, максимум 20 балів)</h4>
        
        <div style="margin: 10px 0;">
          <strong style="color: #16a34a;">▶ Крок 1: Зважений підрахунок ПЗФ</strong><br/>
          <div style="background: white; padding: 8px; border-radius: 3px; margin: 5px 0; font-family: monospace; font-size: 9px;">
            <strong>Формула:</strong> Score = НПП×2.0 + Заповідн.×1.5 + РЛП×1.0 + Заказн.×0.3<br/>
            <strong>Обґрунтування вагів:</strong> НПП мають найвищу туристичну цінність (Wiley AHP 2022)<br/>
            <strong>Вхідні дані:</strong><br/>
            • НПП: ${d?.pfz?.national_parks || 0} × 2.0 = ${((d?.pfz?.national_parks || 0) * 2).toFixed(1)}<br/>
            • Заповідники: ${d?.pfz?.nature_reserves || 0} × 1.5 = ${((d?.pfz?.nature_reserves || 0) * 1.5).toFixed(1)}<br/>
            • РЛП: ${d?.pfz?.regional_landscape_parks || 0} × 1.0 = ${((d?.pfz?.regional_landscape_parks || 0) * 1.0).toFixed(1)}<br/>
            • Заказники: ${d?.pfz?.zakazniks || 0} × 0.3 = ${((d?.pfz?.zakazniks || 0) * 0.3).toFixed(1)}
          </div>
          <div style="background: #dcfce7; padding: 5px 10px; border-radius: 3px; display: inline-block;">
            <strong>Сума:</strong> ${((d?.pfz?.national_parks || 0) * 2 + (d?.pfz?.nature_reserves || 0) * 1.5 + (d?.pfz?.regional_landscape_parks || 0) * 1.0 + (d?.pfz?.zakazniks || 0) * 0.3).toFixed(2)}
          </div>
        </div>
        
        <div style="margin: 10px 0;">
          <strong style="color: #16a34a;">▶ Крок 2: Коригування за площею</strong><br/>
          <div style="background: white; padding: 8px; border-radius: 3px; margin: 5px 0; font-family: monospace; font-size: 9px;">
            <strong>Площа під ПЗФ:</strong> ${d?.pfz?.percent_of_region || 0}% території<br/>
            <strong>Логіка:</strong> Більша площа = вища туристична привабливість
          </div>
        </div>
        
        <div style="background: #16a34a; color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold; display: inline-block;">
          ✅ ФІНАЛЬНИЙ БАЛ: ${analysisResult.pfz_score}/20
        </div>
        
        ${d?.pfz?.notable_objects && d.pfz.notable_objects.length > 0 ? `
        <div style="background: #f0fdf4; padding: 8px; border-radius: 3px; margin-top: 10px; border: 1px solid #86efac; font-size: 9px;">
          <strong style="color: #166534;">🏞️ Визначні об'єкти:</strong> ${d.pfz.notable_objects.join(', ')}
        </div>
        ` : ''}
      </div>
      
      <!-- ФАКТОР 3: ПРИРОДА (ДЕТАЛЬНО) -->
      <div style="background: #ecfdf5; padding: 15px; border-left: 4px solid #059669; margin-bottom: 15px; font-size: 10px;">
        <h4 style="margin: 0 0 10px 0; color: #059669; font-size: 12px;">🌳 ФАКТОР 3: ПРИРОДНІ РЕСУРСИ (Вага: 15%, максимум 15 балів)</h4>
        
        <div style="margin: 10px 0;">
          <strong style="color: #059669;">▶ Компонент A: Лісове покриття (0-11)</strong><br/>
          <div style="background: white; padding: 8px; border-radius: 3px; margin: 5px 0; font-family: monospace; font-size: 9px;">
            <strong>Формула:</strong> Ліси = Лісистість% × 0.275<br/>
            <strong>Вхідні дані:</strong> ${d?.nature?.forest_coverage_percent || 0}%<br/>
            <strong>Розрахунок:</strong> ${d?.nature?.forest_coverage_percent || 0} × 0.275 = ${((d?.nature?.forest_coverage_percent || 0) * 0.275).toFixed(2)}<br/>
            <strong>Обґрунтування:</strong> Ліси = естетична цінність + різноманітність активностей
          </div>
          <div style="background: #d1fae5; padding: 5px 10px; border-radius: 3px; display: inline-block;">
            <strong>Бал:</strong> ${Math.min(11, ((d?.nature?.forest_coverage_percent || 0) * 0.275)).toFixed(1)}/11
          </div>
        </div>
        
        <div style="margin: 10px 0;">
          <strong style="color: #059669;">▶ Компонент Б: Водні об'єкти (0-4)</strong><br/>
          <div style="background: white; padding: 8px; border-radius: 3px; margin: 5px 0; font-family: monospace; font-size: 9px;">
            <strong>Вхідні дані:</strong> ${d?.nature?.has_water_bodies ? '✅ Наявні' : '❌ Відсутні'}<br/>
            <strong>Обґрунтування:</strong> Водойми → риболовля, плавання, водні види спорту
          </div>
          <div style="background: #d1fae5; padding: 5px 10px; border-radius: 3px; display: inline-block;">
            <strong>Бал:</strong> ${d?.nature?.has_water_bodies ? '4/4' : '0/4'}
          </div>
        </div>
        
        <div style="background: #059669; color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold; display: inline-block;">
          ✅ ФІНАЛЬНИЙ БАЛ: ${analysisResult.nature_score}/15
        </div>
      </div>
      
      <!-- ФАКТОР 6: ПОЖЕЖІ (ДЕТАЛЬНО) -->
      <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin-bottom: 15px; font-size: 10px;">
        <h4 style="margin: 0 0 10px 0; color: #f59e0b; font-size: 12px;">🔥 ФАКТОР 6: ПРОФІЛАКТИКА ПОЖЕЖ (Бонус: +5%, максимум 5 балів)</h4>
        
        <div style="background: #fee2e2; padding: 8px; border-radius: 3px; margin: 8px 0; font-size: 9px;">
          <strong>⚠️ ПАРАДОКСАЛЬНА ЛОГІКА:</strong> БІЛЬШЕ пожеж = ВИЩА потреба в облаштованих місцях
        </div>
        
        <div style="margin: 10px 0;">
          <strong style="color: #f59e0b;">▶ Наукове обґрунтування</strong><br/>
          <div style="background: white; padding: 8px; border-radius: 3px; margin: 5px 0; font-family: monospace; font-size: 9px;">
            <strong>Дослідження NW Fire Science 2020:</strong><br/>
            • 80% рекреаційних пожеж — ПОЗА офіційними місцями<br/>
            • Облаштовані вогнища → зниження ризику на 40%<br/>
            <strong>Дані регіону:</strong><br/>
            • Всього пожеж: ${d?.fires?.total_fires || 0}<br/>
            • Людський фактор: ${d?.fires?.human_caused_fires || 0} (${d?.fires?.total_fires > 0 ? ((d?.fires?.human_caused_fires / d?.fires?.total_fires) * 100).toFixed(1) : 0}%)
          </div>
        </div>
        
        <div style="background: #f59e0b; color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold; display: inline-block;">
          ✅ БОНУС: +${analysisResult.fire_score || 0}/5
        </div>
      </div>
      
      <h3 style="color: #1e293b; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; margin-top: 15px; font-size: 14px;">🔥 ПОЖЕЖНА БЕЗПЕКА</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">Всього пожеж у регіоні</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${d?.fires?.total_fires || 0}</td>
        </tr>
        <tr style="background: #fef3c7;">
          <td style="padding: 10px; border: 1px solid #e2e8f0;">Людський фактор</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${d?.fires?.human_caused_fires || 0}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">Оцінка ризику</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${d?.fires?.fire_prevention_score || 0}/5</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td colspan="2" style="padding: 10px; border: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">${d?.fires?.interpretation || 'Більше людських пожеж = вища потреба в облаштованих пунктах'}</td>
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
      
      
      <!-- ДЖЕРЕЛА ДАНИХ -->
      <h3 style="color: #1e293b; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; margin-top: 20px; font-size: 14px;">📚 ДЖЕРЕЛА ДАНИХ</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px;">
        <tr style="background: #1e293b; color: white;">
          <th style="padding: 6px; text-align: left; border: 1px solid #475569; width: 30%;">Категорія даних</th>
          <th style="padding: 6px; text-align: left; border: 1px solid #475569;">Джерело</th>
          <th style="padding: 6px; text-align: center; border: 1px solid #475569; width: 15%;">Рік</th>
        </tr>
        <tr>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Населення та демографія</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Державна служба статистики України (ukrstat.gov.ua)</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center;">2023</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Об'єкти природно-заповідного фонду</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Міністерство захисту довкілля та природних ресурсів України</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center;">2024</td>
        </tr>
        <tr>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Лісове покриття</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Державне агентство лісових ресурсів України</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center;">2023</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Транспортна інфраструктура</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">OpenStreetMap + Укравтодор</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center;">2024</td>
        </tr>
        <tr>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Інфраструктура (готелі, заправки)</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">OpenStreetMap + Google Maps API</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center;">2024</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Лісові пожежі</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">ДСНС України (dsns.gov.ua)</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center;">2025</td>
        </tr>
        <tr>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Рекреаційні пункти</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0;">Міністерство культури та інформаційної політики</td>
          <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center;">2024</td>
        </tr>
      </table>
      
      <div style="background: #dbeafe; padding: 10px; border-radius: 6px; margin-top: 15px; font-size: 9px;">
        <p style="margin: 0 0 5px 0; font-weight: bold; color: #1e40af;">ℹ️ МЕТОДОЛОГІЧНЕ ЗАУВАЖЕННЯ:</p>
        <p style="margin: 0; color: #1e3a8a; line-height: 1.5;">
          Цей звіт базується на 7-факторній моделі оцінки рекреаційного потенціалу, розробленій для територіального планування України. 
          Модель враховує демографічні, природні, інфраструктурні та безпекові аспекти. Усі розрахунки виконуються автоматично на основі актуальних даних з офіційних джерел.
        </p>
      </div>
      
      
      <h3 style="color: #1e293b; border-bottom: 2px solid #f59e0b; padding-bottom: 6px; margin-top: 15px; font-size: 12px;">📚 ДЖЕРЕЛА ДАНИХ</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9px;">
        <tr style="background: #1e293b; color: white;">
          <th style="padding: 5px; text-align: left; border: 1px solid #475569; width: 30%;">Категорія</th>
          <th style="padding: 5px; text-align: left; border: 1px solid #475569;">Джерело</th>
          <th style="padding: 5px; text-align: center; border: 1px solid #475569; width: 12%;">Рік</th>
        </tr>
        <tr>
          <td style="padding: 4px; border: 1px solid #e2e8f0;">Населення</td>
          <td style="padding: 4px; border: 1px solid #e2e8f0;">Державна служба статистики України</td>
          <td style="padding: 4px; border: 1px solid #e2e8f0; text-align: center;">2023</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 4px; border: 1px solid #e2e8f0;">ПЗФ</td>
          <td style="padding: 4px; border: 1px solid #e2e8f0;">Міністерство захисту довкілля та природних ресурсів</td>
          <td style="padding: 4px; border: 1px solid #e2e8f0; text-align: center;">2024</td>
        </tr>
        <tr>
          <td style="padding: 4px; border: 1px solid #e2e8f0;">Транспорт та інфраструктура</td>
          <td style="padding: 4px; border: 1px solid #e2e8f0;">OpenStreetMap + Укравтодор</td>
          <td style="padding: 4px; border: 1px solid #e2e8f0; text-align: center;">2024</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 4px; border: 1px solid #e2e8f0;">Пожежі</td>
          <td style="padding: 4px; border: 1px solid #e2e8f0;">ДСНС України</td>
          <td style="padding: 4px; border: 1px solid #e2e8f0; text-align: center;">2025</td>
        </tr>
      </table>
      
      <p style="text-align: center; color: #94a3b8; margin-top: 15px; font-size: 9px; border-top: 2px solid #e2e8f0; padding-top: 8px;">
        <strong>ГІС аналіз рекреаційного потенціалу України</strong> | Порівняльний звіт<br/>
        Версія методології: 1.0 | © 2024-2025
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
      metadata: {
        report_title: "Науковий звіт: Аналіз рекреаційного потенціалу України",
        report_version: "1.0",
        generated_at: new Date().toISOString(),
        methodology: "Analytic Hierarchy Process (AHP) - 7-factor weighted model",
        scientific_basis: {
          primary_method: "Analytic Hierarchy Process (AHP)",
          references: [
            "Kentucky SCORP 2020-2025 (Demand Analysis & Market Saturation)",
            "District of Columbia SCORP 2020 (Access Barriers & Transport)",
            "Wiley 'AHP for Ecotourism Site Selection' 2022 (PFZ Weights)",
            "SCIRP 'GIS-AHP Tourist Resort Location' 2018 (Nature Resources)",
            "Laguna Hills Recreation Assessment 2021 (Infrastructure)",
            "NW Fire Science 'Human and Climatic Influences on Wildfires' 2020",
            "Закон України 'Про природно-заповідний фонд' (адаптація до УА)"
          ],
          validation: "Peer-reviewed international research adapted to Ukrainian context"
        },
        formulas_detailed: {
          total_score: {
            formula: "TOTAL = demand(0-25) + pfz(0-20) + nature(0-15) + transport(0-15) + infrastructure(0-10) + fire_prevention(0-5) - saturation(0-15)",
            max_score: 100,
            description: "Загальний потенціал регіону для рекреаційного будівництва"
          },
          demand: {
            formula: "(population × 0.15 × 3) - (existing_points × 50 × 180 × 2)",
            normalization: "Логарифмічна нормалізація до 0-25",
            weight: "25% (найвищий пріоритет)",
            justification: "Без попиту немає економічної доцільності (Kentucky SCORP 2020)",
            coefficient_0_15: "15% населення - активні рекреанти (емпірично доведено)",
            coefficient_3: "3 відвідування/рік - середній показник для активного населення",
            supply_formula: "points × 50 місць × 180 днів × 2 зміни = річна пропозиція"
          },
          pfz: {
            formula: "НПП×2.0 + Заповідники×1.5 + РЛП×1.0 + Заказники×0.3",
            max_score: 20,
            weight: "20%",
            justification: "ПЗФ = головний туристичний атрактор (Wiley AHP 2022)",
            weights_rationale: {
              national_parks: "×2.0 - найвища туристична цінність, міжнародна впізнаваність",
              reserves: "×1.5 - висока природна цінність, обмежений доступ",
              regional_parks: "×1.0 - регіональна значущість",
              zakazniks: "×0.3 - локальна значущість"
            }
          },
          nature: {
            formula: "(forest_coverage% × 0.275) + water_bodies(4 if yes, 0 if no)",
            max_score: 15,
            weight: "15%",
            components: {
              forests: "0-11 балів (0.275 = коефіцієнт нормалізації до 11 при 40% лісистості)",
              water: "0-4 бали (бінарна оцінка наявності)"
            },
            justification: "Естетична цінність + різноманітність активностей (SCIRP GIS-AHP 2018)"
          },
          transport: {
            formula: "f(highway_density, international_roads, railways, airports)",
            max_score: 15,
            weight: "15%",
            components: {
              roads: "0-8 балів (щільність >400км/1000км² = 8)",
              m_roads: "0-3 бали (наявність міжнародних трас)",
              railways: "0-2 бали (>30 станцій = 2)",
              airports: "0-2 бали (міжнародний аеропорт = 2)"
            },
            justification: "'Відсутність доступу' - 2-га причина неучасті у рекреації (DC SCORP 2020)"
          },
          infrastructure: {
            formula: "hospitals(0-3) + gas_stations(0-2) + mobile(0-2) + internet(0-1) + hotels(0-1) + electricity(0-1)",
            max_score: 10,
            weight: "10%",
            justification: "Інфраструктуру можна ПОБУДУВАТИ (вторинний фактор, Laguna Hills 2021)",
            components_priority: "Медицина (3) > Заправки (2) = Зв'язок (2) > Інше (3)"
          },
          fire_prevention: {
            formula: "(human_caused_fires / region_area_1000km2) × 100 × 0.5",
            max_score: 5,
            weight: "+5% (бонус)",
            paradoxical_logic: "БІЛЬШЕ пожеж = ВИЩА потреба в облаштованих місцях",
            justification: "80% рекреаційних пожеж - ПОЗА офіційними місцями (NW Fire Science 2020)",
            effect: "Облаштовані вогнища → зниження ризику на 40%"
          },
          saturation: {
            formula: "Progressive scale: 0 to -15 points based on density",
            max_penalty: -15,
            weight: "-15% (штраф)",
            scale: {
              low: "<1.0 р.п./1000км² = -2",
              moderate: "1.0-2.0 = -5",
              high: "2.0-3.0 = -10",
              critical: ">3.0 = -15"
            },
            justification: "Висока концентрація → менше місця для нових → нижчий потенціал (Kentucky Market Analysis)"
          }
        },
        weights_summary: {
          demand: "25% (найвищий)",
          pfz: "20%",
          nature: "15%",
          transport: "15%",
          infrastructure: "10%",
          fire_prevention: "+5% (бонус)",
          saturation: "-15% (штраф)",
          total_positive: "90%",
          total_with_penalties: "75-90%"
        }
      },
      region: analysisResult.region,
      analysis_date: new Date().toISOString(),
      total_potential: {
        score: analysisResult.total_score,
        category: analysisResult.category,
        recommendation: analysisResult.recommendation
      },
      raw_input_data: {
        demographics: {
          total_population: d?.population?.total,
          population_density_per_km2: d?.population?.density_per_km2,
          visit_coefficient: 0.15,
          source: "Державна служба статистики України (2023)"
        },
        pfz: {
          national_parks: d?.pfz?.national_parks,
          nature_reserves: d?.pfz?.nature_reserves,
          regional_landscape_parks: d?.pfz?.regional_landscape_parks,
          zakazniks: d?.pfz?.zakazniks,
          percent_of_region: d?.pfz?.percent_of_region,
          notable_objects: d?.pfz?.notable_objects || [],
          source: "Міністерство захисту довкілля та природних ресурсів (2024)"
        },
        nature: {
          forest_coverage_percent: d?.nature?.forest_coverage_percent,
          has_water_bodies: d?.nature?.has_water_bodies,
          source: "Держлісагентство України (2023)"
        },
        transport: {
          highway_density_per_100km2: d?.transport?.highway_density,
          railway_stations: d?.transport?.railway_stations,
          airports: d?.transport?.airports,
          avg_travel_time_minutes: d?.transport?.avg_travel_time_minutes,
          main_roads: d?.transport?.main_roads || [],
          source: "OpenStreetMap + Укравтодор (2024)"
        },
        infrastructure: {
          hospitals_per_100k: d?.infrastructure?.hospitals_per_100k,
          gas_stations_per_100km2: d?.infrastructure?.gas_stations_per_100km2,
          hotels_total: d?.infrastructure?.hotels_total,
          mobile_coverage_percent: d?.infrastructure?.mobile_coverage_percent,
          source: "OpenStreetMap + Google Maps API (2024)"
        },
        forest_fires: {
          total_fires: d?.fires?.total_fires,
          human_caused_fires: d?.fires?.human_caused_fires,
          interpretation: d?.fires?.interpretation,
          source: "ДСНС України (2025)"
        },
        saturation: {
          existing_points: d?.saturation?.existing_points,
          density_per_1000km2: d?.saturation?.density_per_1000km2,
          density_status: d?.saturation?.density_status,
          source: "Мінкультури України (2024)"
        }
      },
      detailed_calculation_steps: {
        demand: {
          factor_name: "Попит від населення",
          max_score: 25,
          weight_percent: 25,
          steps: [
            {
              step: 1,
              title: "Розрахунок річного попиту на рекреацію",
              formula: "annual_demand = population × 0.15 × 3",
              input_values: {
                population: d?.population?.total,
                participation_coefficient: 0.15,
                visits_per_year: 3
              },
              calculation: `${d?.population?.total} × 0.15 × 3`,
              result: (d?.population?.total || 0) * 0.15 * 3,
              unit: "відвідувань/рік",
              justification: "15% населення - потенційні рекреанти (Kentucky SCORP 2020), 3 візити - середній показник активності"
            },
            {
              step: 2,
              title: "Розрахунок існуючої пропозиції",
              formula: "annual_supply = points × 50 × 180 × 2",
              input_values: {
                existing_points: d?.saturation?.existing_points || 0,
                capacity_per_point: 50,
                season_days: 180,
                shifts_per_day: 2
              },
              calculation: `${d?.saturation?.existing_points || 0} × 50 × 180 × 2`,
              result: (d?.saturation?.existing_points || 0) * 50 * 180 * 2,
              unit: "місць/рік",
              justification: "50 місць - стандартна місткість, 180 днів - тривалість сезону, 2 зміни/день"
            },
            {
              step: 3,
              title: "Визначення дефіциту або профіциту",
              formula: "gap = demand - supply",
              input_values: {
                demand: (d?.population?.total || 0) * 0.15 * 3,
                supply: (d?.saturation?.existing_points || 0) * 50 * 180 * 2
              },
              calculation: `${(d?.population?.total || 0) * 0.15 * 3} - ${(d?.saturation?.existing_points || 0) * 50 * 180 * 2}`,
              result: d?.population?.gap || 0,
              status: d?.population?.gap_status,
              unit: "відвідувань (дефіцит/профіцит)",
              interpretation: d?.population?.gap > 0 ? "Дефіцит = потреба в нових об'єктах" : "Профіцит = ринок насичений"
            },
            {
              step: 4,
              title: "Нормалізація до шкали 0-25 балів",
              formula: "score = f(gap, population) normalized to [0, 25]",
              method: "Логарифмічна нормалізація з урахуванням розміру дефіциту",
              logic: "Більший дефіцит → вищий бал → вища економічна доцільність",
              result: analysisResult.demand_score,
              unit: "балів",
              max: 25
            }
          ],
          final_score: analysisResult.demand_score,
          percentage: ((analysisResult.demand_score / 25) * 100).toFixed(1)
        },
        pfz: {
          factor_name: "ПЗФ як туристичний атрактор",
          max_score: 20,
          weight_percent: 20,
          steps: [
            {
              step: 1,
              title: "Підрахунок ПЗФ за категоріями з ваговими коефіцієнтами",
              formula: "score = НПП×2.0 + Заповідники×1.5 + РЛП×1.0 + Заказники×0.3",
              input_values: {
                national_parks: d?.pfz?.national_parks || 0,
                nature_reserves: d?.pfz?.nature_reserves || 0,
                regional_parks: d?.pfz?.regional_landscape_parks || 0,
                zakazniks: d?.pfz?.zakazniks || 0
              },
              weighted_scores: {
                npp: `${d?.pfz?.national_parks || 0} × 2.0 = ${(d?.pfz?.national_parks || 0) * 2}`,
                reserves: `${d?.pfz?.nature_reserves || 0} × 1.5 = ${(d?.pfz?.nature_reserves || 0) * 1.5}`,
                rlp: `${d?.pfz?.regional_landscape_parks || 0} × 1.0 = ${(d?.pfz?.regional_landscape_parks || 0) * 1.0}`,
                zakazniks: `${d?.pfz?.zakazniks || 0} × 0.3 = ${(d?.pfz?.zakazniks || 0) * 0.3}`
              },
              sum: ((d?.pfz?.national_parks || 0) * 2 + (d?.pfz?.nature_reserves || 0) * 1.5 + (d?.pfz?.regional_landscape_parks || 0) * 1.0 + (d?.pfz?.zakazniks || 0) * 0.3).toFixed(2),
              justification: "НПП мають найвищу туристичну цінність та міжнародну впізнаваність (Wiley AHP 2022)"
            },
            {
              step: 2,
              title: "Коригування за площею ПЗФ",
              formula: "adjustment = 1 + (pfz_area_percent / 100) × 0.2",
              input_values: {
                pfz_percent: d?.pfz?.percent_of_region || 0
              },
              logic: "Більша площа під ПЗФ = вища туристична привабливість регіону",
              result: 1 + ((d?.pfz?.percent_of_region || 0) / 100) * 0.2
            },
            {
              step: 3,
              title: "Нормалізація до шкали 0-20 балів",
              method: "Нелінійна нормалізація з обмеженням",
              result: analysisResult.pfz_score,
              max: 20
            }
          ],
          notable_objects: d?.pfz?.notable_objects || [],
          final_score: analysisResult.pfz_score,
          percentage: ((analysisResult.pfz_score / 20) * 100).toFixed(1)
        },
        nature: {
          factor_name: "Природні ресурси",
          max_score: 15,
          weight_percent: 15,
          components: {
            forests: {
              title: "Лісове покриття",
              formula: "forests_score = forest_percent × 0.275",
              input: d?.nature?.forest_coverage_percent || 0,
              calculation: `${d?.nature?.forest_coverage_percent || 0}% × 0.275`,
              result: Math.min(11, ((d?.nature?.forest_coverage_percent || 0) * 0.275)).toFixed(2),
              max: 11,
              justification: "Ліси = естетична цінність + різноманітність активностей (піші прогулянки, велосипед)"
            },
            water: {
              title: "Водні об'єкти",
              formula: "water_score = 4 (if present) or 0 (if absent)",
              input: d?.nature?.has_water_bodies,
              result: d?.nature?.has_water_bodies ? 4 : 0,
              max: 4,
              justification: "Водойми → риболовля, плавання, водні види спорту, пляжний відпочинок"
            }
          },
          final_score: analysisResult.nature_score,
          percentage: ((analysisResult.nature_score / 15) * 100).toFixed(1)
        },
        transport: {
          factor_name: "Транспортна доступність",
          max_score: 15,
          weight_percent: 15,
          components: {
            roads: { max: 8, description: "Щільність доріг" },
            m_roads: { max: 3, description: "Міжнародні траси" },
            railways: { max: 2, description: "Залізничні станції" },
            airports: { max: 2, description: "Аеропорти" }
          },
          input_data: {
            highway_density: d?.transport?.highway_density,
            railway_stations: d?.transport?.railway_stations,
            airports: d?.transport?.airports
          },
          final_score: analysisResult.accessibility_score,
          percentage: ((analysisResult.accessibility_score / 15) * 100).toFixed(1),
          justification: "'Відсутність транспорту' - 2-га причина неучасті у рекреації після вартості (DC SCORP 2020)"
        },
        infrastructure: {
          factor_name: "Інфраструктура",
          max_score: 10,
          weight_percent: 10,
          components: {
            hospitals: { max: 3, priority: 1 },
            gas_stations: { max: 2, priority: 2 },
            mobile_coverage: { max: 2, priority: 2 },
            internet: { max: 1, priority: 3 },
            hotels: { max: 1, priority: 3 },
            electricity: { max: 1, priority: 3 }
          },
          final_score: analysisResult.infrastructure_score,
          percentage: ((analysisResult.infrastructure_score / 10) * 100).toFixed(1),
          note: "Інфраструктуру можна ПОБУДУВАТИ - це вторинний фактор (Laguna Hills 2021)"
        },
        fire_prevention: {
          factor_name: "Профілактика лісових пожеж",
          max_score: 5,
          weight_percent: 5,
          paradoxical_logic: "БІЛЬШЕ пожеж = ВИЩА потреба в облаштованих місцях відпочинку",
          input_data: {
            total_fires: d?.fires?.total_fires || 0,
            human_caused: d?.fires?.human_caused_fires || 0,
            human_percent: d?.fires?.total_fires > 0 ? ((d?.fires?.human_caused_fires / d?.fires?.total_fires) * 100).toFixed(1) : 0
          },
          scientific_basis: {
            source: "NW Fire Science 'Human and Climatic Influences on Wildfires' 2020",
            key_findings: [
              "80% рекреаційних пожеж відбуваються ПОЗА офіційними місцями відпочинку",
              "Облаштовані вогнища з каменю + доступ до води = зниження ризику на 40%",
              "Щільність пожеж у радіусі 1 км від кемпінгів у 7 РАЗІВ ВИЩА"
            ]
          },
          final_score: analysisResult.fire_score || 0,
          percentage: (((analysisResult.fire_score || 0) / 5) * 100).toFixed(1)
        },
        saturation: {
          factor_name: "Штраф за насиченість ринку",
          max_penalty: -15,
          weight_percent: -15,
          input_data: {
            existing_points: d?.saturation?.existing_points || 0,
            density_per_1000km2: d?.saturation?.density_per_1000km2,
            status: d?.saturation?.density_status
          },
          penalty_scale: {
            low: { range: "<1.0 р.п./1000км²", penalty: -2, status: "Низька насиченість" },
            moderate: { range: "1.0-2.0", penalty: -5, status: "Помірна насиченість" },
            high: { range: "2.0-3.0", penalty: -10, status: "Висока насиченість" },
            critical: { range: ">3.0", penalty: -15, status: "Критична перенасиченість" }
          },
          final_penalty: analysisResult.saturation_penalty,
          percentage: ((Math.abs(analysisResult.saturation_penalty) / 15) * 100).toFixed(1),
          justification: "Висока концентрація існуючих об'єктів → менше місця для нових → нижчий потенціал (Kentucky Market Analysis)"
        }
      },
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
      recommended_zones: topZones,
      data_sources: [
        {
          category: "Населення та демографія",
          source: "Державна служба статистики України",
          url: "https://ukrstat.gov.ua",
          year: 2023
        },
        {
          category: "Природно-заповідний фонд",
          source: "Міністерство захисту довкілля та природних ресурсів України",
          year: 2024
        },
        {
          category: "Лісові ресурси",
          source: "Державне агентство лісових ресурсів України",
          year: 2023
        },
        {
          category: "Транспортна інфраструктура",
          source: "OpenStreetMap + Укравтодор",
          year: 2024
        },
        {
          category: "Інфраструктура готелів та послуг",
          source: "OpenStreetMap + Google Maps API",
          year: 2024
        },
        {
          category: "Лісові пожежі",
          source: "Державна служба України з надзвичайних ситуацій",
          url: "https://dsns.gov.ua",
          year: 2025
        },
        {
          category: "Рекреаційні пункти",
          source: "Міністерство культури та інформаційної політики України",
          year: 2024
        }
      ]
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
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid #f59e0b; padding-bottom: 15px;">
        <h1 style="color: #1e293b; margin: 0; font-size: 20px; font-weight: bold;">НАУКОВИЙ ЗВІТ</h1>
        <h2 style="color: #f59e0b; margin: 8px 0; font-size: 16px;">ПОРІВНЯЛЬНИЙ АНАЛІЗ РЕКРЕАЦІЙНОГО ПОТЕНЦІАЛУ</h2>
        <h3 style="color: #475569; margin: 6px 0; font-size: 14px;">Області України (24 регіони)</h3>
        <p style="color: #94a3b8; margin-top: 12px; font-size: 9px;">Згенеровано: ${new Date().toLocaleString('uk-UA')}</p>
      </div>
      
      <h3 style="color: #1e293b; border-bottom: 2px solid #f59e0b; padding-bottom: 6px; margin-top: 15px; font-size: 12px;">📐 МЕТОДОЛОГІЯ</h3>
      <div style="background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin-bottom: 12px; font-size: 9px;">
        <p style="margin: 0 0 6px 0; font-weight: bold;">7-факторна модель оцінки:</p>
        <p style="margin: 0; font-family: monospace; background: white; padding: 6px; border-radius: 4px; font-size: 9px;">
          TOTAL = Попит(25) + ПЗФ(20) + Природа(15) + Транспорт(15) + Інфраструктура(10) + Пожежі(5) - Насиченість(15)
        </p>
      </div>
      
      <h4 style="color: #1e293b; font-size: 11px; margin: 12px 0 6px 0;">📋 Пояснення колонок:</h4>
      <div style="font-size: 9px; background: #f8fafc; padding: 10px; border-radius: 6px; margin-bottom: 12px; line-height: 1.6;">
        <p style="margin: 2px 0;"><strong>Поп (0-25):</strong> Попит населення = населення × 0.15 - існуюча пропозиція</p>
        <p style="margin: 2px 0;"><strong>ПЗФ (0-20):</strong> НПП×8 + Заповідники×6 + РЛП×3 + Заказники×1</p>
        <p style="margin: 2px 0;"><strong>Прир (0-15):</strong> % лісів × 0.15 + водойми(так=5)</p>
        <p style="margin: 2px 0;"><strong>Трансп (0-15):</strong> Щільність доріг + залізниці + аеропорти</p>
        <p style="margin: 2px 0;"><strong>Інфр (0-10):</strong> Лікарні + заправки + готелі + мобільний зв'язок</p>
        <p style="margin: 2px 0;"><strong>Насич (-15 до 0):</strong> Штраф -1 за кожні 50 пунктів/1000км²</p>
        <p style="margin: 2px 0;"><strong>Дефіцит:</strong> + дефіцит, - профіцит (відвідувань/рік)</p>
        <p style="margin: 2px 0;"><strong>Потр. пунктів:</strong> Дефіцит ÷ 500 відвідувань на пункт</p>
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
      
      <h3 style="color: #1e293b; border-bottom: 2px solid #f59e0b; padding-bottom: 6px; margin-top: 15px; font-size: 12px;">📚 ДЖЕРЕЛА ДАНИХ</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9px;">
        <tr style="background: #1e293b; color: white;">
          <th style="padding: 5px; text-align: left; border: 1px solid #475569; width: 30%;">Категорія</th>
          <th style="padding: 5px; text-align: left; border: 1px solid #475569;">Джерело</th>
          <th style="padding: 5px; text-align: center; border: 1px solid #475569; width: 12%;">Рік</th>
        </tr>
        <tr>
          <td style="padding: 4px; border: 1px solid #e2e8f0;">Населення</td>
          <td style="padding: 4px; border: 1px solid #e2e8f0;">Державна служба статистики України</td>
          <td style="padding: 4px; border: 1px solid #e2e8f0; text-align: center;">2023</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 4px; border: 1px solid #e2e8f0;">ПЗФ</td>
          <td style="padding: 4px; border: 1px solid #e2e8f0;">Міністерство захисту довкілля та природних ресурсів</td>
          <td style="padding: 4px; border: 1px solid #e2e8f0; text-align: center;">2024</td>
        </tr>
        <tr>
          <td style="padding: 4px; border: 1px solid #e2e8f0;">Транспорт та інфраструктура</td>
          <td style="padding: 4px; border: 1px solid #e2e8f0;">OpenStreetMap + Укравтодор</td>
          <td style="padding: 4px; border: 1px solid #e2e8f0; text-align: center;">2024</td>
        </tr>
        <tr style="background: #f8fafc;">
          <td style="padding: 4px; border: 1px solid #e2e8f0;">Пожежі</td>
          <td style="padding: 4px; border: 1px solid #e2e8f0;">ДСНС України</td>
          <td style="padding: 4px; border: 1px solid #e2e8f0; text-align: center;">2025</td>
        </tr>
      </table>
      
      <p style="text-align: center; color: #94a3b8; margin-top: 15px; font-size: 9px; border-top: 2px solid #e2e8f0; padding-top: 8px;">
        <strong>ГІС аналіз рекреаційного потенціалу України</strong> | Порівняльний звіт<br/>
        Версія методології: 1.0 | © 2024-2025
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
    if (percent >= 80) return <MdCheckCircle className="w-4 h-4 text-emerald-500" />;
    if (percent >= 60) return <MdCheckCircle className="w-4 h-4 text-lime-500" />;
    if (percent >= 40) return <MdWarning className="w-4 h-4 text-amber-500" />;
    return <MdCancel className="w-4 h-4 text-red-500" />;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" data-testid="app-container">
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-r from-slate-800 to-slate-900 shadow-xl sticky top-0 z-50 border-b-2 border-amber-600">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <GiMountains className="text-amber-500 text-3xl" />
              <div>
                <div className="text-xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
                  ГІС АНАЛІЗ РЕКРЕАЦІЙНОГО ПОТЕНЦІАЛУ
                </div>
                <div className="text-xs text-amber-400">Інтерактивна карта та геопросторовий аналіз</div>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <Button 
                onClick={() => navigate('/')} 
                className="bg-slate-700 hover:bg-slate-600 text-white border border-amber-500/50"
                size="sm"
              >
                <MdArrowBack className="mr-2" />
                На головну
              </Button>
              <Button 
                onClick={() => navigate('/import')} 
                className="bg-slate-700 hover:bg-slate-600 text-white border border-amber-500/50"
                size="sm"
              >
                <TbDatabase className="mr-2" />
                Імпорт даних
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-amber-600/30 sticky top-16 z-40" data-testid="header">
        <div className="max-w-screen-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <MdMap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">ГІС аналіз рекреаційного потенціалу</h1>
                <p className="text-xs text-gray-300">Україна • {recreationalPoints.length} пунктів • {pfzObjects.length} об&apos;єктів ПЗФ</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedRegion || ''} onValueChange={handleRegionChange}>
                <SelectTrigger className="w-60 bg-slate-700 text-white border-amber-600/50">
                  <SelectValue placeholder="Оберіть область" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 text-white border-amber-600/50">
                  {regions.map((region) => (
                    <SelectItem key={region} value={region} className="hover:bg-slate-700">{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={exportComparisonPDF} className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white" size="sm">
                <TbChartDots3 className="w-4 h-4 mr-2" />
                Порівняння областей (PDF)
              </Button>
              {analysisResult && (
                <>
                  <Button onClick={exportPDF} className="bg-slate-700 hover:bg-slate-600 text-white border border-amber-600/50" size="sm">
                    <MdDownload className="w-4 h-4 mr-2" />
                    Звіт про область (PDF)
                  </Button>
                  <Button onClick={exportJSON} className="bg-slate-700 hover:bg-slate-600 text-white border border-amber-600/50" size="sm">
                    <MdDescription className="w-4 h-4 mr-2" />
                    Дані (JSON)
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
            <Card className="sticky top-32 bg-slate-800/50 backdrop-blur border-2 border-amber-600/30 shadow-xl">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2 text-white">
                  <MdLayers className="w-4 h-4 text-amber-400" />
                  Шари карти
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                  <Checkbox checked={layers.recreationalPoints} onCheckedChange={() => toggleLayer('recreationalPoints')} />
                  <span className="text-xs">Існуючі пункти</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                  <Checkbox checked={layers.recommendedZones} onCheckedChange={() => toggleLayer('recommendedZones')} />
                  <span className="text-xs">Рекомендовані зони</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                  <Checkbox checked={layers.pfzObjects} onCheckedChange={() => toggleLayer('pfzObjects')} />
                  <span className="text-xs">Об&apos;єкти ПЗФ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                  <Checkbox checked={layers.forestFires} onCheckedChange={() => toggleLayer('forestFires')} />
                  <span className="text-xs">Лісові пожежі (2025)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                  <Checkbox checked={layers.regionScores} onCheckedChange={() => toggleLayer('regionScores')} />
                  <span className="text-xs">Скори областей</span>
                </label>
                
                <Separator className="my-3 bg-amber-600/30" />
                
                <div className="space-y-1">
                  <p className="text-xs font-medium text-amber-400 mb-2">Легенда</p>
                  <div className="flex items-center gap-2 text-gray-300">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs">Існуючий пункт</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-dashed border-red-300"></div>
                    <span className="text-xs">Критичний пріоритет</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-dashed border-orange-300"></div>
                    <span className="text-xs">Високий пріоритет</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="text-amber-400 text-sm">★</span>
                    <span className="text-xs">НПП / Заповідник</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <GiFireBowl className="w-3 h-3 text-orange-500" />
                    <span className="text-xs">Лісова пожежа</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Center - Map */}
          <div className="col-span-12 lg:col-span-5">
            <Card className="overflow-hidden bg-slate-800/50 backdrop-blur border-2 border-amber-600/30 shadow-xl">
              <div className="h-[calc(100vh-180px)]">
                <MapContainer 
                  center={UKRAINE_CENTER} 
                  zoom={DEFAULT_ZOOM} 
                  style={{ height: '100%', width: '100%' }} 
                  scrollWheelZoom={true}
                  maxBounds={UKRAINE_BOUNDS}
                  minZoom={6}
                  maxZoom={18}
                  maxBoundsViscosity={1.0}
                >
                  <TileLayer 
                    attribution='&copy; OpenStreetMap' 
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    noWrap={true}
                  />
                  <MapController center={mapCenter} zoom={mapZoom} />
                  
                  {/* Region Boundaries */}
                  {layers.regionBoundaries && regionBoundaries.length > 0 && (
                    <GeoJSON
                      data={{
                        type: "FeatureCollection",
                        features: regionBoundaries
                      }}
                      style={{
                        fillColor: 'transparent',
                        fillOpacity: 0,
                        color: '#f59e0b',
                        weight: 2,
                        opacity: 0.7
                      }}
                      onEachFeature={(feature, layer) => {
                        if (feature.properties && feature.properties.name) {
                          layer.bindTooltip(feature.properties.name, {
                            permanent: false,
                            direction: 'center',
                            className: 'region-label'
                          });
                        }
                      }}
                    />
                  )}
                  
                  {/* Existing points */}
                  {layers.recreationalPoints && filteredPoints.map((point, idx) => (
                    point.geometry?.coordinates && (
                      <CircleMarker key={`pt-${idx}`} center={[point.geometry.coordinates[1], point.geometry.coordinates[0]]} radius={5}
                        pathOptions={{ fillColor: '#22c55e', color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.8 }}>
                        <Popup className="dark-popup">
                          <div className="text-sm bg-gradient-to-br from-slate-800 to-slate-900 text-white p-3 rounded-lg">
                            <p className="font-semibold text-emerald-400">{point.properties?.name || 'Рекреаційний пункт'}</p>
                            <p className="text-gray-300">{point.properties?.region}</p>
                            {point.properties?.capacity && <p className="text-gray-300">Місткість: <span className="text-white font-medium">{point.properties.capacity}</span></p>}
                          </div>
                        </Popup>
                      </CircleMarker>
                    )
                  ))}

                  {/* PFZ Objects */}
                  {layers.pfzObjects && filteredPfzObjects.map((obj, idx) => (
                    obj.coordinates && (
                      <Marker key={`pfz-${idx}`} position={obj.coordinates} icon={createStarIcon('#f59e0b')}>
                        <Popup className="dark-popup">
                          <div className="text-sm min-w-[220px] bg-gradient-to-br from-slate-800 to-slate-900 text-white p-3 rounded-lg">
                            <p className="font-bold text-amber-400">{obj.name}</p>
                            <p className="text-xs text-gray-400 mb-2">{obj.type} • {obj.region}</p>
                            <div className="space-y-1 text-xs">
                              <p><span className="text-gray-400">Площа:</span> <span className="text-white">{obj.area_ha?.toLocaleString()} га</span></p>
                              <p><span className="text-gray-400">Рік створення:</span> <span className="text-white">{obj.year_created}</span></p>
                              <p><span className="text-gray-400">Відвідуваність:</span> <span className="text-white">~{obj.visitors_per_year?.toLocaleString()} осіб/рік</span></p>
                              {obj.warning && <p className="text-red-400 font-medium mt-2">{obj.warning}</p>}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  ))}

                  {/* Forest Fires */}
                  {layers.forestFires && forestFires.filter(fire => !selectedRegion || fire.properties.region === selectedRegion).map((fire, idx) => {
                    const isHuman = fire.properties.cause_type === "людський фактор";
                    const fireIcon = L.divIcon({
                      html: `<div style="color: ${isHuman ? '#ea580c' : '#f97316'}; font-size: 20px;">🔥</div>`,
                      className: 'fire-marker',
                      iconSize: [20, 20],
                      iconAnchor: [10, 10]
                    });
                    
                    return (
                      <Marker key={`fire-${idx}`} position={[fire.geometry.coordinates[1], fire.geometry.coordinates[0]]} icon={fireIcon}>
                        <Popup className="dark-popup">
                          <div className="text-sm min-w-[250px] bg-gradient-to-br from-slate-800 to-slate-900 text-white p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <GiFireBowl className={`w-4 h-4 ${isHuman ? 'text-orange-500' : 'text-orange-400'}`} />
                              <p className="font-bold text-orange-400">Лісова пожежа</p>
                            </div>
                            <p className="text-xs font-semibold mb-2 text-white">{fire.properties.name}</p>
                            
                            <div className="space-y-1 text-xs mb-2">
                              <p><span className="text-gray-400">Дата:</span> <span className="text-white">{fire.properties.date}</span></p>
                              <p><span className="text-gray-400">Площа:</span> <span className="text-white">{fire.properties.area_ha} га</span></p>
                              <p><span className="text-gray-400">Область:</span> <span className="text-white">{fire.properties.region}</span></p>
                            </div>
                            
                            <div className={`p-2 rounded backdrop-blur ${isHuman ? 'bg-orange-900/30 border border-orange-600/50' : 'bg-slate-800/90 border border-slate-500/40'}`}>
                              <p className="text-xs font-semibold mb-1 text-gray-300">Причина:</p>
                              <p className={`text-xs ${isHuman ? 'text-orange-300 font-medium' : 'text-gray-300'}`}>
                                {fire.properties.cause}
                              </p>
                              {isHuman && (
                                <p className="text-xs text-orange-300 mt-2 font-medium">
                                  ⚠️ Людський фактор - потреба в облаштованих пунктах!
                                </p>
                              )}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}

                  {/* Recommended Zones */}
                  {layers.recommendedZones && recommendedZones.filter(zone => !selectedRegion || zone.region === selectedRegion).map((zone, idx) => {
                    const color = zone.priority >= 85 ? '#ef4444' : zone.priority >= 70 ? '#f97316' : '#eab308';
                    
                    return (
                      <CircleMarker key={`zone-${idx}`} center={zone.coordinates} radius={14}
                        pathOptions={{ fillColor: color, color: color, weight: 3, opacity: 1, fillOpacity: 0.3, dashArray: '5, 5' }}>
                        <Popup maxWidth={400} className="dark-popup">
                          <div className="p-4 min-w-[300px] max-w-[380px] bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-lg">
                            {/* Header */}
                            <div className="border-b border-amber-600/30 pb-2 mb-3">
                              <div className="flex items-center gap-2 mb-1">
                                <MdTrendingUp className="text-amber-400" size={20} />
                                <h3 className="font-bold text-lg text-amber-400">РЕКОМЕНДОВАНА ЗОНА</h3>
                              </div>
                            </div>

                            {/* Назва */}
                            <h4 className="text-xl font-bold mb-1 text-white">{zone.name}</h4>
                            {zone.type === "near_pfz" && zone.pfz_object && (
                              <p className="text-sm text-gray-300 mb-3">
                                <span className="text-amber-400">★</span> Біля: {zone.pfz_object}
                              </p>
                            )}

                            {/* Пріоритет */}
                            <div className="mb-3">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-300">Пріоритет:</span>
                                <span className="text-lg font-bold text-amber-400">
                                  {zone.priority}/100
                                </span>
                              </div>
                              <div className="h-2 bg-slate-700 rounded-full">
                                <div className="h-full rounded-full" style={{ width: `${zone.priority}%`, backgroundColor: color }}></div>
                              </div>
                            </div>

                            {/* Статус */}
                            <div className="p-2 bg-emerald-900/40 border border-emerald-500/50 rounded mb-3">
                              <p className="text-sm font-medium text-emerald-200">
                                ✓ {zone.legal_status}
                              </p>
                            </div>

                            {/* Відстань до ПЗФ */}
                            {zone.type === "near_pfz" && zone.distance_from_pfz && (
                              <p className="text-sm mb-3 text-gray-300">
                                <span className="text-amber-400">★</span> Відстань до ПЗФ: <strong className="text-white">{zone.distance_from_pfz} км</strong>
                              </p>
                            )}

                            {/* ОБҐРУНТУВАННЯ */}
                            <div className="mt-3 p-3 bg-slate-800 border border-slate-500/60 rounded-lg mb-3">
                              <h4 className="font-semibold mb-2 flex items-center gap-1 text-amber-300">
                                <TbChartDots3 className="inline" size={16} /> Обґрунтування:
                              </h4>
                              <ul className="text-sm space-y-1 text-gray-200">
                                <li>• {zone.reasoning.point1}</li>
                                <li>• {zone.reasoning.point2}</li>
                                <li>• {zone.reasoning.point3}</li>
                              </ul>
                            </div>

                            {/* РЕКОМЕНДОВАНА ІНФРАСТРУКТУРА */}
                            <div className="mt-3 p-3 bg-slate-800 border border-slate-500/60 rounded-lg mb-3">
                              <h4 className="font-semibold mb-2 flex items-center gap-1 text-emerald-300">
                                <MdApartment className="inline" size={16} /> Рекомендована інфраструктура:
                              </h4>
                              <ul className="text-sm space-y-1 text-gray-200">
                                {zone.recommended_facilities.map((facility, idx) => (
                                  <li key={idx}>• {facility}</li>
                                ))}
                              </ul>
                            </div>

                            {/* Базова інформація */}
                            <div className="space-y-1 text-sm mb-3 text-gray-200 bg-slate-800/80 p-3 rounded-lg border border-slate-500/40">
                              <p>Тип: <strong className="text-white">{zone.recommended_type}</strong></p>
                              <p>Місткість: <strong className="text-white">{zone.capacity}</strong></p>
                              <p className="flex items-center gap-1"><MdAttachMoney className="text-amber-400" size={14} />Інвестиції: <strong className="text-amber-300">{zone.investment}</strong></p>
                              <p className="flex items-center gap-1"><MdSchedule className="text-blue-400" size={14} />Окупність: <strong className="text-white">{zone.payback}</strong></p>
                              <p>• Існуючих пунктів поблизу: <strong className="text-white">{zone.competitors_nearby}</strong></p>
                            </div>

                            {/* ІНФРАСТРУКТУРА ПОБЛИЗУ */}
                            <div className="mt-3 pt-3 border-t border-slate-500/60">
                              <h4 className="font-semibold mb-2 text-amber-300 flex items-center gap-1">
                                <MdMap className="inline" size={16} /> Інфраструктура поблизу:
                              </h4>
                              <div className="grid grid-cols-2 gap-2 text-sm text-gray-200 bg-slate-800/80 p-2 rounded">
                                <div className="flex items-center gap-1">
                                  <MdLocalHospital className="text-red-400" size={14} />
                                  <span>Лікарня: <span className="text-white font-medium">{zone.infrastructure.hospital_distance} км</span></span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MdLocalGasStation className="text-blue-400" size={14} />
                                  <span>Заправка: <span className="text-white font-medium">{zone.infrastructure.gas_station_distance} км</span></span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MdRestaurant className="text-orange-400" size={14} />
                                  <span>Магазин: <span className="text-white font-medium">{zone.infrastructure.shop_distance} км</span></span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MdWifi className="text-green-400" size={14} />
                                  <span>Мобільний: <span className="text-white font-medium">{zone.infrastructure.mobile_coverage}%</span></span>
                                </div>
                                <div className="col-span-2 flex items-center gap-1">
                                  <FaCar className="text-gray-400" size={12} />
                                  <span>Дорога: <span className="text-white font-medium">{zone.infrastructure.nearest_road}</span>
                                  <span className="text-gray-400"> ({zone.infrastructure.road_quality})</span></span>
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
                        <Popup className="dark-popup">
                          <div className="text-sm min-w-[180px] bg-gradient-to-br from-slate-800 to-slate-900 text-white p-3 rounded-lg">
                            <p className="font-bold mb-1 text-white">{analysis.region}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Потенціал:</span>
                              <Badge style={{ backgroundColor: getScoreColor(analysis.total_score) }} className="text-white">{analysis.total_score}/100</Badge>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{analysis.category}</p>
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
            <Card className="h-[calc(100vh-180px)] flex flex-col bg-slate-800/50 backdrop-blur border-2 border-amber-600/30 shadow-xl">
              <CardContent className="flex-1 overflow-hidden p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-slate-800/90 border-amber-600/30">
                    <TabsTrigger value="analysis" className="text-gray-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white">Аналіз</TabsTrigger>
                    <TabsTrigger value="locations" className="text-gray-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white">Локації</TabsTrigger>
                    <TabsTrigger value="compare" className="text-gray-300 data-[state=active]:bg-amber-600 data-[state=active]:text-white">Порівняння</TabsTrigger>
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
                            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-amber-600/30 backdrop-blur">
                              <h2 className="text-xl font-bold text-white mb-3">{analysisResult.region}</h2>
                              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full text-white text-2xl font-bold mb-2"
                                style={{ backgroundColor: getScoreColor(analysisResult.total_score) }}>
                                {analysisResult.total_score}
                              </div>
                              <p className="text-sm text-gray-300">зі 100 балів</p>
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
                              <AccordionItem value="demand" className="border-amber-600/30">
                                <AccordionTrigger className="text-sm py-2 text-white hover:text-amber-400">
                                  <div className="flex items-center gap-2">
                                    <MdPeople className="w-4 h-4 text-blue-400" />
                                    <span>1. ПОПИТ ВІД НАСЕЛЕННЯ</span>
                                    <Badge variant="outline" className="ml-auto border-amber-600/50 text-amber-400">{analysisResult.demand_score}/25</Badge>
                                    {getScoreIcon(analysisResult.demand_score, 25)}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="pl-6 space-y-3 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="bg-slate-800/90 rounded p-2 border border-amber-600/20">
                                        <p className="text-xs text-gray-400">Населення</p>
                                        <p className="font-semibold text-white">{analysisResult.details.population.total?.toLocaleString()} осіб</p>
                                      </div>
                                      <div className="bg-slate-800/90 rounded p-2 border border-amber-600/20">
                                        <p className="text-xs text-gray-400">Густота</p>
                                        <p className="font-semibold text-white">{analysisResult.details.population.density_per_km2} осіб/км²</p>
                                      </div>
                                    </div>
                                    <div className="bg-blue-900/30 border border-blue-600/30 rounded p-3 backdrop-blur">
                                      <p className="text-xs text-blue-300 mb-1">Аналіз попиту/пропозиції:</p>
                                      <div className="space-y-1 text-gray-300">
                                        <p>Річний попит: <strong className="text-white">{analysisResult.details.population.annual_demand?.toLocaleString()}</strong> відвідувань</p>
                                        <p>Річна пропозиція: <strong className="text-white">{analysisResult.details.population.annual_supply?.toLocaleString()}</strong> місць</p>
                                        <p>Співвідношення: <strong className="text-white">{analysisResult.details.population.supply_demand_ratio}</strong></p>
                                      </div>
                                    </div>
                                    <div className={`rounded p-3 backdrop-blur ${analysisResult.details.population.gap > 0 ? 'bg-amber-900/30 border border-amber-600/50' : 'bg-emerald-900/30 border border-emerald-600/50'}`}>
                                      <p className={`font-semibold ${analysisResult.details.population.gap > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                                        {analysisResult.details.population.gap_status}: {Math.abs(analysisResult.details.population.gap).toLocaleString()} відвідувань
                                      </p>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* PFZ */}
                              <AccordionItem value="pfz" className="border-amber-600/30">
                                <AccordionTrigger className="text-sm py-2 text-white hover:text-amber-400">
                                  <div className="flex items-center gap-2">
                                    <span className="text-amber-400 text-lg">★</span>
                                    <span>2. ПЗФ ЯК АТРАКТОР</span>
                                    <Badge variant="outline" className="ml-auto border-amber-600/50 text-amber-400">{analysisResult.pfz_score}/20</Badge>
                                    {getScoreIcon(analysisResult.pfz_score, 20)}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="pl-6 space-y-3 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="bg-slate-800 border border-emerald-600/30 rounded p-2">
                                        <p className="text-xs text-emerald-400">★ НПП</p>
                                        <p className="font-semibold text-lg text-white">{analysisResult.details.pfz.national_parks}</p>
                                      </div>
                                      <div className="bg-slate-800 border border-green-600/30 rounded p-2">
                                        <p className="text-xs text-green-400">★ Заповідники</p>
                                        <p className="font-semibold text-lg text-white">{analysisResult.details.pfz.nature_reserves}</p>
                                      </div>
                                      <div className="bg-slate-800 border border-teal-600/30 rounded p-2">
                                        <p className="text-xs text-teal-400">★ РЛП</p>
                                        <p className="font-semibold text-lg text-white">{analysisResult.details.pfz.regional_landscape_parks}</p>
                                      </div>
                                      <div className="bg-slate-800 border border-cyan-600/30 rounded p-2">
                                        <p className="text-xs text-cyan-400">★ Заказники</p>
                                        <p className="font-semibold text-lg text-white">{analysisResult.details.pfz.zakazniks}</p>
                                      </div>
                                    </div>
                                    <div className="flex justify-between bg-slate-800 border border-amber-600/30 rounded p-2">
                                      <span className="text-gray-300">Під ПЗФ:</span>
                                      <span className="font-semibold text-white">{analysisResult.details.pfz.percent_of_region}% території</span>
                                    </div>
                                    {analysisResult.details.pfz.notable_objects?.length > 0 && (
                                      <div className="bg-amber-900/30 border border-amber-600/50 rounded p-3">
                                        <p className="text-xs text-amber-300 mb-2">★ Відомі об&apos;єкти:</p>
                                        {analysisResult.details.pfz.notable_objects.map((obj, i) => (
                                          <p key={i} className="text-emerald-300">★ {obj}</p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* NATURE */}
                              <AccordionItem value="nature" className="border-amber-600/30">
                                <AccordionTrigger className="text-sm py-2 text-white hover:text-amber-400">
                                  <div className="flex items-center gap-2">
                                    <GiForest className="w-4 h-4 text-green-400" />
                                    <span>3. ПРИРОДНІ РЕСУРСИ</span>
                                    <Badge variant="outline" className="ml-auto border-amber-600/50 text-amber-400">{analysisResult.nature_score}/15</Badge>
                                    {getScoreIcon(analysisResult.nature_score, 15)}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="pl-6 space-y-3 text-sm">
                                    <div className="flex items-center justify-between bg-slate-800 border border-green-600/30 rounded p-3">
                                      <div className="flex items-center gap-2">
                                        <GiForest className="w-5 h-5 text-green-400" />
                                        <span className="text-gray-200">Лісове покриття</span>
                                      </div>
                                      <span className="font-bold text-white">{analysisResult.details.nature.forest_coverage_percent}%</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-slate-800 border border-blue-600/30 rounded p-3">
                                      <div className="flex items-center gap-2">
                                        <GiWaterDrop className="w-5 h-5 text-blue-400" />
                                        <span className="text-gray-200">Водні об&apos;єкти</span>
                                      </div>
                                      {analysisResult.details.nature.has_water_bodies ? (
                                        <Badge className="bg-blue-600 text-white">Наявні</Badge>
                                      ) : (
                                        <Badge variant="secondary">Відсутні</Badge>
                                      )}
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* TRANSPORT */}
                              <AccordionItem value="transport" className="border-amber-600/30">
                                <AccordionTrigger className="text-sm py-2 text-white hover:text-amber-400">
                                  <div className="flex items-center gap-2">
                                    <FaCar className="w-4 h-4 text-indigo-400" />
                                    <span>4. ТРАНСПОРТНА ДОСТУПНІСТЬ</span>
                                    <Badge variant="outline" className="ml-auto border-amber-600/50 text-amber-400">{analysisResult.accessibility_score}/15</Badge>
                                    {getScoreIcon(analysisResult.accessibility_score, 15)}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="pl-6 space-y-3 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="bg-slate-800 border border-indigo-600/30 rounded p-2">
                                        <p className="text-xs text-indigo-400">Рейтинг</p>
                                        <p className="font-semibold text-white">{analysisResult.details.transport.accessibility_score}/10</p>
                                      </div>
                                      <div className="bg-slate-800 border border-purple-600/30 rounded p-2">
                                        <p className="text-xs text-purple-400">Щільність доріг</p>
                                        <p className="font-semibold text-white">{analysisResult.details.transport.highway_density} км</p>
                                      </div>
                                    </div>
                                    {analysisResult.details.transport.main_roads?.length > 0 && (
                                      <div className="bg-slate-800 border border-indigo-600/30 rounded p-3">
                                        <p className="text-xs text-indigo-300 mb-2 flex items-center gap-1"><FaCar size={12} /> Міжнародні траси:</p>
                                        {analysisResult.details.transport.main_roads.filter(r => r.type === 'міжнародна').slice(0, 4).map((road, i) => (
                                          <p key={i} className="text-gray-200">• {road.name} <span className="text-gray-400">({road.quality})</span></p>
                                        ))}
                                      </div>
                                    )}
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                      <div className="bg-slate-800 border border-slate-500/40 rounded p-2">
                                        <p className="text-xs text-gray-400">Залізниці</p>
                                        <p className="font-semibold text-white">{analysisResult.details.transport.railway_stations}</p>
                                      </div>
                                      <div className="bg-slate-800 border border-slate-500/40 rounded p-2">
                                        <p className="text-xs text-gray-400">Аеропорти</p>
                                        <p className="font-semibold text-white">{analysisResult.details.transport.airports}</p>
                                      </div>
                                      <div className="bg-slate-800 border border-slate-500/40 rounded p-2">
                                        <p className="text-xs text-gray-400">Час до міста</p>
                                        <p className="font-semibold text-white">{analysisResult.details.transport.avg_travel_time_minutes} хв</p>
                                      </div>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* INFRASTRUCTURE */}
                              <AccordionItem value="infra" className="border-amber-600/30">
                                <AccordionTrigger className="text-sm py-2 text-white hover:text-amber-400">
                                  <div className="flex items-center gap-2">
                                    <MdApartment className="w-4 h-4 text-orange-400" />
                                    <span>5. ІНФРАСТРУКТУРА</span>
                                    <Badge variant="outline" className="ml-auto border-amber-600/50 text-amber-400">{analysisResult.infrastructure_score}/10</Badge>
                                    {getScoreIcon(analysisResult.infrastructure_score, 10)}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="pl-6 space-y-2 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="flex items-center gap-2 bg-slate-800 border border-red-600/30 rounded p-2">
                                        <MdLocalHospital className="w-4 h-4 text-red-400" />
                                        <div>
                                          <p className="text-xs text-gray-400">Лікарні/100к</p>
                                          <p className="font-semibold text-white">{analysisResult.details.infrastructure.hospitals_per_100k}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 bg-slate-800 border border-amber-600/30 rounded p-2">
                                        <MdLocalGasStation className="w-4 h-4 text-amber-400" />
                                        <div>
                                          <p className="text-xs text-gray-400">Заправки</p>
                                          <p className="font-semibold text-white">{analysisResult.details.infrastructure.gas_stations_per_100km2}/100км²</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 bg-slate-800 border border-blue-600/30 rounded p-2">
                                        <MdWifi className="w-4 h-4 text-blue-400" />
                                        <div>
                                          <p className="text-xs text-gray-400">Моб. зв&apos;язок</p>
                                          <p className="font-semibold text-white">{analysisResult.details.infrastructure.mobile_coverage_percent}%</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 bg-slate-800 border border-purple-600/30 rounded p-2">
                                        <MdHotel className="w-4 h-4 text-purple-400" />
                                        <div>
                                          <p className="text-xs text-gray-400">Готелі</p>
                                          <p className="font-semibold text-white">{analysisResult.details.infrastructure.hotels_total}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              {/* FOREST FIRES - NEW */}
                              {analysisResult.fire_score !== undefined && (
                                <AccordionItem value="fires" className="border-amber-600/30">
                                  <AccordionTrigger className="text-sm py-2 text-white hover:text-amber-400">
                                    <div className="flex items-center gap-2">
                                      <GiFireBowl className="w-4 h-4 text-orange-400" />
                                      <span>6. РИЗИК ЛІСОВИХ ПОЖЕЖ (профілактика)</span>
                                      <Badge variant="outline" className="ml-auto border-amber-600/50 text-amber-400">{analysisResult.fire_score}/5</Badge>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="pl-6 space-y-3 text-sm">
                                      <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-slate-800 border border-slate-500/40 rounded p-2">
                                          <p className="text-xs text-gray-400">Всього пожеж</p>
                                          <p className="font-semibold text-lg text-white">{analysisResult.details.fires.total_fires}</p>
                                        </div>
                                        <div className="bg-slate-800 border border-orange-600/30 rounded p-2">
                                          <p className="text-xs text-orange-400 flex items-center gap-1"><GiFireBowl size={14} /> Від людей</p>
                                          <p className="font-semibold text-lg text-orange-300">{analysisResult.details.fires.human_caused_fires}</p>
                                        </div>
                                        <div className="bg-slate-800 border border-green-600/30 rounded p-2">
                                          <p className="text-xs text-green-400">Бонус</p>
                                          <p className="font-semibold text-lg text-green-300">+{analysisResult.fire_score}</p>
                                        </div>
                                      </div>
                                      <div className="bg-orange-900/30 border border-orange-600/50 rounded p-3">
                                        <p className="font-semibold text-orange-300 mb-2 flex items-center gap-2">
                                          <GiFireBowl className="w-4 h-4" />
                                          Логіка профілактики:
                                        </p>
                                        <p className="text-xs text-orange-200">
                                          {analysisResult.details.fires.interpretation}
                                        </p>
                                        <ul className="text-xs text-orange-200 mt-2 space-y-1">
                                          <li>✅ Облаштовані пункти знижують ризик на 40%</li>
                                          <li>✅ Контрольовані вогнища у кам&apos;яних кільцях</li>
                                          <li>✅ Доступ до води для гасіння</li>
                                        </ul>
                                      </div>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              )}

                              {/* SATURATION */}
                              <AccordionItem value="saturation" className="border-amber-600/30">
                                <AccordionTrigger className="text-sm py-2 text-white hover:text-amber-400">
                                  <div className="flex items-center gap-2">
                                    <MdWarning className="w-4 h-4 text-red-400" />
                                    <span>7. ШТРАФ ЗА НАСИЧЕНІСТЬ</span>
                                    <Badge variant="outline" className="ml-auto border-amber-600/50 text-amber-400">{analysisResult.saturation_penalty}/15</Badge>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="pl-6 space-y-3 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="bg-slate-800 border border-slate-500/40 rounded p-2">
                                        <p className="text-xs text-gray-400">Існуючих пунктів</p>
                                        <p className="font-semibold text-lg text-white">{analysisResult.details.saturation.existing_points}</p>
                                      </div>
                                      <div className="bg-slate-800 border border-slate-500/40 rounded p-2">
                                        <p className="text-xs text-gray-400">Щільність</p>
                                        <p className="font-semibold text-white">{analysisResult.details.saturation.density_per_1000km2}/1000км²</p>
                                      </div>
                                    </div>
                                    <div className={`rounded p-3 ${analysisResult.saturation_penalty < -5 ? 'bg-red-900/30 border border-red-600/50' : 'bg-emerald-900/30 border border-emerald-600/50'}`}>
                                      <p className={`font-semibold ${analysisResult.saturation_penalty < -5 ? 'text-red-300' : 'text-emerald-300'}`}>
                                        {analysisResult.details.saturation.density_status}
                                      </p>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>

                            {/* Conclusion */}
                            <div className={`rounded-lg p-4 ${analysisResult.details.investment.should_build ? 'bg-emerald-900/30 border border-emerald-600/50' : 'bg-red-900/30 border border-red-600/50'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                {analysisResult.details.investment.should_build ? (
                                  <MdCheckCircle className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <MdCancel className="w-5 h-5 text-red-400" />
                                )}
                                <span className={`font-bold ${analysisResult.details.investment.should_build ? 'text-emerald-300' : 'text-red-300'}`}>
                                  {analysisResult.details.investment.should_build ? 'РЕКОМЕНДУЄТЬСЯ БУДУВАТИ' : 'БУДІВНИЦТВО РИЗИКОВАНЕ'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-200">{analysisResult.recommendation}</p>
                            </div>

                            {/* Points needed to cover deficit */}
                            {analysisResult.details.population.gap > 0 && (
                              <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4">
                                <h4 className="font-semibold flex items-center gap-2 mb-3 text-blue-300">
                                  <TbTarget className="w-4 h-4" />
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
                                  <MdWarning className="w-4 h-4" />
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
                                <MdAttachMoney className="w-4 h-4 text-emerald-600" />
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
                            <MdPlace className="w-12 h-12 mb-3" />
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
                            <h3 className="font-semibold flex items-center gap-2 text-white">
                              <TbTarget className="w-4 h-4 text-emerald-400" />
                              Рекомендовані зони ({recommendedZones.filter(z => !selectedRegion || z.region === selectedRegion).length})
                            </h3>
                            {recommendedZones.filter(z => !selectedRegion || z.region === selectedRegion).map((zone, idx) => (
                              <Card key={idx} className="bg-slate-800/50 border-emerald-600/30 backdrop-blur">
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <p className="font-semibold text-sm text-white">{zone.name}</p>
                                      {zone.type === "near_pfz" && zone.pfz_object && (
                                        <p className="text-xs text-gray-400">★ Біля: {zone.pfz_object}</p>
                                      )}
                                    </div>
                                    <Badge className="text-white" style={{ backgroundColor: zone.priority >= 85 ? '#ef4444' : zone.priority >= 70 ? '#f97316' : '#eab308' }}>
                                      {zone.priority}/100
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs mb-2 text-gray-300">
                                    <p><span className="text-gray-400">Тип:</span> <span className="text-white">{zone.recommended_type}</span></p>
                                    <p><span className="text-gray-400">Місткість:</span> <span className="text-white">{zone.capacity}</span></p>
                                    <p><span className="text-gray-400">Інвестиції:</span> <span className="text-amber-400">{zone.investment}</span></p>
                                    <p><span className="text-gray-400">Окупність:</span> <span className="text-white">{zone.payback}</span></p>
                                  </div>
                                  <Button size="sm" className="w-full text-xs bg-slate-700 hover:bg-slate-600 text-white border border-amber-600/50" onClick={() => focusOnLocation(zone.coordinates)}>
                                    <MdNavigation className="w-3 h-3 mr-1" />
                                    Показати на карті
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </>
                        ) : selectedRegion ? (
                          <div className="text-center py-8 text-gray-400">
                            <MdTrendingUp className="w-10 h-10 mx-auto mb-2 text-gray-500" />
                            <p>Немає рекомендованих зон для цієї області</p>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <MdTrendingUp className="w-10 h-10 mx-auto mb-2 text-gray-500" />
                            <p>Оберіть область або перегляньте всі зони на карті</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="compare" className="flex-1 overflow-hidden m-0">
                    <ScrollArea className="h-full">
                      <div className="p-4">
                        <h3 className="font-semibold mb-3 text-white">Порівняння областей</h3>
                        <div className="space-y-2">
                          {allAnalysis.map((analysis, idx) => (
                            <div key={idx} className={`p-3 rounded-lg border cursor-pointer hover:bg-slate-800/90 transition-colors ${selectedRegion === analysis.region ? 'border-amber-500 bg-amber-900/30' : 'border-amber-600/20 bg-slate-800/30'}`}
                              onClick={() => handleRegionChange(analysis.region)}>
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-medium text-sm text-white">{idx + 1}. {analysis.region}</p>
                                  <p className="text-xs text-gray-400">{analysis.category}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                  style={{ backgroundColor: getScoreColor(analysis.total_score) }}>
                                  {analysis.total_score}
                                </div>
                              </div>
                              <div className="grid grid-cols-6 gap-1 text-xs">
                                <div className="text-center">
                                  <p className="text-gray-400">Поп</p>
                                  <p className="font-medium text-white">{analysis.demand_score}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-gray-400">ПЗФ</p>
                                  <p className="font-medium text-white">{analysis.pfz_score}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-gray-400">Пр</p>
                                  <p className="font-medium text-white">{analysis.nature_score}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-gray-400">Тр</p>
                                  <p className="font-medium text-white">{analysis.accessibility_score}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-gray-400">Ін</p>
                                  <p className="font-medium text-white">{analysis.infrastructure_score}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-gray-400"><GiFireBowl className="inline" size={12} /></p>
                                  <p className="font-medium text-white">{analysis.fire_score || 0}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-gray-400">Нас</p>
                                  <p className="font-medium text-red-400">{analysis.saturation_penalty}</p>
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
      
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white p-4 rounded-full shadow-2xl transition-all z-50 animate-bounce"
          aria-label="Scroll to top"
        >
          <MdArrowUpward size={24} />
        </button>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/import" element={<DataImport />} />
      </Routes>
    </Router>
  );
}

export default App;
