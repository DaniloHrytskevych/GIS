import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { MdUploadFile, MdCheckCircle, MdWarning, MdRefresh, MdAnalytics, MdPeople, MdApartment, MdPark, MdLocalFireDepartment, MdDownload } from 'react-icons/md';
import { TbDatabase, TbFileCode } from 'react-icons/tb';
import { GiForest } from 'react-icons/gi';

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
      icon: MdPeople,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-600',
      expectedFields: ['name', 'population', 'area_km2', 'forest_coverage_percent', 'has_water_bodies'],
      statusKey: 'population_data'
    },
    {
      id: 'infrastructure',
      title: 'Інфраструктура',
      description: 'ukraine_infrastructure.json - дороги, лікарні, готелі, зв\'язок',
      endpoint: '/import/infrastructure-data',
      icon: MdApartment,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-600',
      expectedFields: ['region', 'transport_accessibility', 'anthropogenic_infrastructure'],
      statusKey: 'infrastructure_data'
    },
    {
      id: 'protected-areas',
      title: 'Природоохоронні території',
      description: 'ukraine_protected_areas.json - НПП, заповідники, РЛП',
      endpoint: '/import/protected-areas',
      icon: GiForest,
      iconColor: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-600',
      expectedFields: ['region', 'protected_areas', 'pfz_score', 'notable_objects'],
      statusKey: 'protected_areas'
    },
    {
      id: 'recreational',
      title: 'Рекреаційні пункти',
      description: 'recreational_points_web.geojson - існуючі готелі, санаторії, бази відпочинку',
      endpoint: '/import/recreational-points',
      icon: MdPark,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-600',
      expectedFields: ['type: FeatureCollection', 'features', 'geometry', 'properties'],
      statusKey: 'recreational_points'
    },
    {
      id: 'fires',
      title: 'Лісові пожежі',
      description: 'forest_fires.geojson - дані про пожежі, людський фактор, природні причини',
      endpoint: '/import/fires',
      icon: MdLocalFireDepartment,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-600',
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-8 border-b-2 border-amber-600">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex items-center gap-4 mb-3">
            <TbDatabase className="text-5xl text-amber-500" />
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                ІМПОРТ ГЕОПРОСТОРОВИХ ДАНИХ
              </h1>
              <p className="text-amber-400 text-sm">Система керування базами даних ГІС</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm max-w-3xl">
            Завантажте JSON/GeoJSON файли для оновлення вхідних даних. 
            Строга валідація структури забезпечує цілісність системи аналізу.
          </p>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-6xl">
        {/* Data Status Overview */}
        {dataStatus && (
          <Card className="mb-6 bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-600 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white" style={{ fontFamily: 'Georgia, serif' }}>
                <MdCheckCircle size={24} className="text-green-400" />
                Поточний стан бази даних
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="text-center bg-slate-700/50 backdrop-blur p-4 rounded border border-amber-600/20">
                <div className="text-3xl font-bold text-blue-400">
                  {dataStatus.population_data?.regions_count || 0}
                </div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">Регіонів</div>
                <div className="text-gray-500 text-xs">Населення</div>
              </div>
              <div className="text-center bg-slate-700/50 backdrop-blur p-4 rounded border border-amber-600/20">
                <div className="text-3xl font-bold text-purple-400">
                  {dataStatus.infrastructure_data?.regions_count || 0}
                </div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">Регіонів</div>
                <div className="text-gray-500 text-xs">Інфраструктура</div>
              </div>
              <div className="text-center bg-slate-700/50 backdrop-blur p-4 rounded border border-amber-600/20">
                <div className="text-3xl font-bold text-green-400">
                  {dataStatus.protected_areas?.regions_count || 0}
                </div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">Регіонів</div>
                <div className="text-gray-500 text-xs">ПЗФ</div>
              </div>
              <div className="text-center bg-slate-700/50 backdrop-blur p-4 rounded border border-amber-600/20">
                <div className="text-3xl font-bold text-emerald-400">
                  {dataStatus.recreational_points?.points_count || 0}
                </div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">Об'єктів</div>
                <div className="text-gray-500 text-xs">Рекреація</div>
              </div>
              <div className="text-center bg-slate-700/50 backdrop-blur p-4 rounded border border-amber-600/20">
                <div className="text-3xl font-bold text-orange-400">
                  {dataStatus.forest_fires?.total_fires || 0}
                </div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">Пожеж</div>
                <div className="text-gray-500 text-xs">Статистика</div>
              </div>
            </div>
            <Button 
              onClick={fetchDataStatus} 
              className="mt-4 bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              <MdRefresh size={18} className="mr-2" />
              Оновити статус
            </Button>
          </CardContent>
        </Card>
      )}


      {/* Backup Section */}
      <Card className="mb-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-600 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
            <MdDownload size={24} className="text-amber-700" />
            Резервне копіювання даних
          </CardTitle>
          <CardDescription className="text-gray-700">
            Створіть бекап перед імпортом нових файлів. Система дозволяє відновити дані у разі помилки валідації.
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
                <MdDownload size={18} className="mr-2" />
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
        {dataTypes.map((dataType) => {
          const IconComponent = dataType.icon;
          return (
            <Card key={dataType.id} className={`border-l-4 ${dataType.borderColor} shadow-lg hover:shadow-xl transition-shadow ${dataType.bgColor}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3" style={{ fontFamily: 'Georgia, serif' }}>
                  <div className={`p-3 rounded-full ${dataType.bgColor} border-2 ${dataType.borderColor}`}>
                    <IconComponent className={`text-2xl ${dataType.iconColor}`} />
                  </div>
                  <div>
                    <div>{dataType.title}</div>
                    <div className="text-xs font-mono text-gray-500 font-normal mt-1">
                      {dataType.description.split(' - ')[0]}
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-600 ml-16">{dataType.description.split(' - ')[1]}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Current Status */}
                  {dataStatus && dataStatus[dataType.statusKey]?.loaded && (
                    <div className="text-sm text-green-700 flex items-center gap-2 bg-green-50 px-3 py-2 rounded border border-green-200">
                      <MdCheckCircle size={18} />
                      <span className="font-medium">Завантажено: {getStatusInfo(dataType.statusKey)}</span>
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
                      <MdUploadFile size={18} className="mr-2" />
                      {uploadStatus[dataType.id]?.status === 'uploading' ? 'Завантаження...' : 'Обрати файл'}
                    </div>
                  </label>

                  {uploadStatus[dataType.id] && (
                    <Alert 
                      className={`flex-1 ${
                        uploadStatus[dataType.id].status === 'success' 
                          ? 'bg-green-50 border-green-300' 
                          : 'bg-red-50 border-red-300'
                      }`}
                    >
                      {uploadStatus[dataType.id].status === 'success' ? (
                        <MdCheckCircle size={18} className="text-green-700" />
                      ) : (
                        <MdWarning size={18} className="text-red-700" />
                      )}
                      <AlertDescription className="ml-2 font-medium">
                        {uploadStatus[dataType.id].message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Warning */}
                {uploadStatus[dataType.id]?.status === 'uploading' && (
                  <div className="text-xs text-amber-700 flex items-center gap-2 bg-amber-50 px-3 py-2 rounded border border-amber-200">
                    <MdWarning size={16} />
                    <span className="font-medium">Після імпорту система автоматично перезавантажить дані в пам'ять</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
        })}
      </div>

      {/* Help Section */}
      <Card className="mt-6 bg-gradient-to-br from-slate-100 to-slate-50 border-2 border-slate-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
            <TbFileCode size={24} className="text-slate-700" />
            Технічні вимоги та валідація
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-3">
          <div className="flex items-start gap-2">
            <MdCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
            <p><strong>Строга валідація:</strong> Система використовує Pydantic schemas для перевірки структури даних перед імпортом</p>
          </div>
          <div className="flex items-start gap-2">
            <MdCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
            <p><strong>Координати:</strong> Географічні координати повинні знаходитися в межах України (lat: 44-52°, lng: 21.5-40.5°)</p>
          </div>
          <div className="flex items-start gap-2">
            <MdCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
            <p><strong>Регіони:</strong> Очікується рівно 24 адміністративні області для файлів населення, інфраструктури та ПЗФ</p>
          </div>
          <div className="flex items-start gap-2">
            <MdCheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
            <p><strong>GeoJSON:</strong> Тип документа має бути &quot;FeatureCollection&quot; з обов'язковим масивом &quot;features&quot;</p>
          </div>
          <div className="flex items-start gap-2 bg-amber-50 p-3 rounded border border-amber-200">
            <MdWarning className="text-amber-700 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-amber-800"><strong>Увага:</strong> Імпорт виконує повну заміну існуючих даних. Обов'язково створіть резервну копію перед операцією</p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default DataImport;
