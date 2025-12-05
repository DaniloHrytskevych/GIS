import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, FileJson, CheckCircle2, AlertCircle, RefreshCw, Database } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DataImport = () => {
  const [dataStatus, setDataStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({});
  const [backupInfo, setBackupInfo] = useState(null);

  const dataTypes = [
    {
      id: 'population',
      title: 'Дані про населення',
      description: 'ukraine_population_data.json - населення, площа, лісистість регіонів',
      endpoint: '/import/population-data',
      icon: '👥',
      expectedFields: ['name', 'population', 'area_km2', 'forest_coverage_percent', 'has_water_bodies'],
      statusKey: 'population_data'
    },
    {
      id: 'infrastructure',
      title: 'Інфраструктура',
      description: 'ukraine_infrastructure.json - дороги, лікарні, готелі, зв\'язок',
      endpoint: '/import/infrastructure-data',
      icon: '🏗️',
      expectedFields: ['region', 'transport_accessibility', 'anthropogenic_infrastructure'],
      statusKey: 'infrastructure_data'
    },
    {
      id: 'protected-areas',
      title: 'Природоохоронні території',
      description: 'ukraine_protected_areas.json - НПП, заповідники, РЛП',
      endpoint: '/import/protected-areas',
      icon: '🌲',
      expectedFields: ['region', 'protected_areas', 'pfz_score', 'notable_objects'],
      statusKey: 'protected_areas'
    },
    {
      id: 'recreational',
      title: 'Рекреаційні пункти',
      description: 'recreational_points_web.geojson - існуючі готелі, санаторії, бази відпочинку',
      endpoint: '/import/recreational-points',
      icon: '🏨',
      expectedFields: ['type: FeatureCollection', 'features', 'geometry', 'properties'],
      statusKey: 'recreational_points'
    },
    {
      id: 'fires',
      title: 'Лісові пожежі',
      description: 'forest_fires.geojson - дані про пожежі, людський фактор, природні причини',
      endpoint: '/import/fires',
      icon: '🔥',
      expectedFields: ['type: FeatureCollection', 'metadata', 'features'],
      statusKey: 'forest_fires'
    }
  ];

  useEffect(() => {
    fetchDataStatus();
    fetchBackupInfo();
  }, []);

  const fetchDataStatus = async () => {
    try {
      const response = await axios.get(`${API}/data-status`);
      setDataStatus(response.data);
    } catch (error) {
      console.error('Error fetching data status:', error);
    }
  };

  const fetchBackupInfo = async () => {
    try {
      const response = await axios.get(`${API}/backup/info`);
      setBackupInfo(response.data);
    } catch (error) {
      console.error('Error fetching backup info:', error);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const response = await axios.get(`${API}/backup/download-all`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.setAttribute('download', `gis_data_backup_${timestamp}.zip`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Save backup timestamp to localStorage
      localStorage.setItem('lastBackupTime', new Date().toISOString());
      
    } catch (error) {
      console.error('Error downloading backup:', error);
      alert('Помилка завантаження бекапу: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDownloadSingle = async (dataType) => {
    try {
      const response = await axios.get(`${API}/backup/download/${dataType}`, {
        responseType: 'blob'
      });
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${dataType}_backup.json`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Помилка завантаження файлу: ' + (error.response?.data?.detail || error.message));
    }
  };


  const handleFileUpload = async (dataType, file) => {
    if (!file) return;

    setLoading(true);
    setUploadStatus(prev => ({
      ...prev,
      [dataType.id]: { status: 'uploading', message: 'Завантаження...' }
    }));

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}${dataType.endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadStatus(prev => ({
        ...prev,
        [dataType.id]: { 
          status: 'success', 
          message: response.data.message 
        }
      }));

      // Refresh data status
      await fetchDataStatus();

      // Clear success message after 5 seconds
      setTimeout(() => {
        setUploadStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[dataType.id];
          return newStatus;
        });
      }, 5000);

    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Помилка завантаження';
      setUploadStatus(prev => ({
        ...prev,
        [dataType.id]: { 
          status: 'error', 
          message: `Помилка: ${errorMessage}` 
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (statusKey) => {
    if (!dataStatus || !dataStatus[statusKey]) return null;
    const status = dataStatus[statusKey];
    
    if (statusKey === 'population_data' || statusKey === 'infrastructure_data' || statusKey === 'protected_areas') {
      return `${status.regions_count} регіонів`;
    } else if (statusKey === 'recreational_points') {
      return `${status.points_count} пунктів`;
    } else if (statusKey === 'forest_fires') {
      return `${status.total_fires} пожеж (${status.human_caused} людських)`;
    }
    return null;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Database size={32} className="text-blue-600" />
          Імпорт Вхідних Даних
        </h1>
        <p className="text-slate-600">
          Завантажте JSON/GeoJSON файли для оновлення даних системи. 
          Існуючі дані будуть повністю замінені.
        </p>
      </div>

      {/* Data Status Overview */}
      {dataStatus && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-green-600" />
              Поточний стан даних
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {dataStatus.population_data?.regions_count || 0}
                </div>
                <div className="text-slate-600">Регіонів (населення)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {dataStatus.infrastructure_data?.regions_count || 0}
                </div>
                <div className="text-slate-600">Регіонів (інфра)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {dataStatus.protected_areas?.regions_count || 0}
                </div>
                <div className="text-slate-600">Регіонів (ПЗФ)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {dataStatus.recreational_points?.points_count || 0}
                </div>
                <div className="text-slate-600">Рекр. пунктів</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {dataStatus.forest_fires?.total_fires || 0}
                </div>
                <div className="text-slate-600">Пожеж</div>
              </div>
            </div>
            <Button 
              onClick={fetchDataStatus} 
              variant="outline" 
              size="sm" 
              className="mt-4"
            >
              <RefreshCw size={16} className="mr-2" />
              Оновити статус
            </Button>
          </CardContent>
        </Card>
      )}


      {/* Backup Section */}
      <Card className="mb-6 bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={20} className="text-amber-600" />
            Бекап даних
          </CardTitle>
          <CardDescription>
            Завантажте поточні дані перед імпортом нових файлів. Це допоможе відновити дані у разі помилки.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Backup Info */}
            {backupInfo && (
              <div className="bg-white rounded-lg p-4 border border-amber-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-600">
                      {backupInfo.file_count}
                    </div>
                    <div className="text-slate-600">Файлів</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-600">
                      {backupInfo.total_size_mb} MB
                    </div>
                    <div className="text-slate-600">Загальний розмір</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-600">
                      24
                    </div>
                    <div className="text-slate-600">Регіонів</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-600">
                      {dataStatus?.forest_fires?.total_fires || 0}
                    </div>
                    <div className="text-slate-600">Пожеж</div>
                  </div>
                </div>
                
                {/* Individual Files */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-600 mb-2">Окремі файли:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {backupInfo.files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded text-xs">
                        <div className="flex-1">
                          <div className="font-medium">{file.description}</div>
                          <div className="text-slate-500">{file.size_mb} MB</div>
                        </div>
                        <button
                          onClick={() => {
                            const typeMapping = {
                              'ukraine_population_data.json': 'population',
                              'ukraine_infrastructure.json': 'infrastructure',
                              'ukraine_protected_areas.json': 'protected-areas',
                              'recreational_points_web.geojson': 'recreational-points',
                              'forest_fires.geojson': 'fires'
                            };
                            handleDownloadSingle(typeMapping[file.filename]);
                          }}
                          className="text-amber-600 hover:text-amber-800 underline"
                        >
                          Завантажити
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Download All Button */}
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleDownloadBackup}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Database size={16} className="mr-2" />
                Завантажити всі дані (ZIP)
              </Button>
              
              <div className="text-xs text-slate-500">
                {localStorage.getItem('lastBackupTime') && (
                  <span>
                    Останній бекап: {new Date(localStorage.getItem('lastBackupTime')).toLocaleString('uk-UA')}
                  </span>
                )}
              </div>
            </div>
            
            {/* Warning */}
            <Alert className="bg-amber-50 border-amber-300">
              <AlertCircle size={16} className="text-amber-600" />
              <AlertDescription className="ml-2 text-amber-800">
                <strong>Важливо:</strong> Завантажте бекап перед імпортом нових даних. 
                Імпорт повністю замінює існуючі файли, і без бекапу відновлення буде неможливим.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Import Cards */}
      <div className="space-y-4">
        {dataTypes.map((dataType) => (
          <Card key={dataType.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{dataType.icon}</span>
                {dataType.title}
              </CardTitle>
              <CardDescription>{dataType.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Current Status */}
                {dataStatus && dataStatus[dataType.statusKey]?.loaded && (
                  <div className="text-sm text-green-600 flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Завантажено: {getStatusInfo(dataType.statusKey)}</span>
                  </div>
                )}

                {/* Expected Fields */}
                <div className="text-xs text-slate-500">
                  <strong>Очікувані поля:</strong> {dataType.expectedFields.join(', ')}
                </div>

                {/* File Upload */}
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".json,.geojson"
                    id={`file-${dataType.id}`}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleFileUpload(dataType, file);
                      }
                    }}
                  />
                  <label htmlFor={`file-${dataType.id}`} className="cursor-pointer">
                    <div className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-slate-300 bg-white hover:bg-slate-100 h-10 px-4 py-2 ${
                      loading && uploadStatus[dataType.id]?.status === 'uploading' 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                    }`}>
                      <Upload size={16} className="mr-2" />
                      {uploadStatus[dataType.id]?.status === 'uploading' ? 'Завантаження...' : 'Вибрати файл'}
                    </div>
                  </label>

                  {uploadStatus[dataType.id] && (
                    <Alert 
                      className={`flex-1 ${
                        uploadStatus[dataType.id].status === 'success' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      {uploadStatus[dataType.id].status === 'success' ? (
                        <CheckCircle2 size={16} className="text-green-600" />
                      ) : (
                        <AlertCircle size={16} className="text-red-600" />
                      )}
                      <AlertDescription className="ml-2">
                        {uploadStatus[dataType.id].message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Warning */}
                {uploadStatus[dataType.id]?.status === 'uploading' && (
                  <div className="text-xs text-amber-600 flex items-center gap-2">
                    <AlertCircle size={14} />
                    Після імпорту система автоматично перезавантажить дані
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <Card className="mt-6 bg-slate-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson size={20} />
            Вимоги до формату даних
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <p>✅ <strong>Строга валідація:</strong> Система перевірить структуру даних перед імпортом</p>
          <p>✅ <strong>Координати:</strong> Мають бути в межах України (lat: 44-52, lng: 21.5-40.5)</p>
          <p>✅ <strong>Регіони:</strong> Очікується рівно 24 регіони для населення, інфраструктури та ПЗФ</p>
          <p>✅ <strong>GeoJSON:</strong> Тип має бути &quot;FeatureCollection&quot; з масивом &quot;features&quot;</p>
          <p>⚠️ <strong>Увага:</strong> Імпорт повністю замінює існуючі дані. Рекомендуємо зробити резервну копію</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataImport;
