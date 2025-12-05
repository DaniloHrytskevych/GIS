import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdLandscape, MdAnalytics, MdDownload, MdNaturePeople, MdTerrain, MdDirectionsCar, MdLocalHospital, MdLocalGasStation, MdWifi, MdApartment, MdElectricalServices, MdPark, MdEmojiEvents } from 'react-icons/md';
import { GiForest, GiTreeBranch, GiWaterDrop, GiFireBowl, GiMountains } from 'react-icons/gi';
import { TbMapSearch, TbChartDots3, TbDatabase } from 'react-icons/tb';

const LandingPage = () => {
  const navigate = useNavigate();

  const scrollTo = (id) => {
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-slate-800 to-slate-900 shadow-xl sticky top-0 z-50 border-b-2 border-amber-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <GiMountains className="text-amber-500 text-3xl" />
              <div>
                <div className="text-xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
                  ГІС АНАЛІЗ РЕКРЕАЦІЙНОГО ПОТЕНЦІАЛУ
                </div>
                <div className="text-xs text-amber-400">Система геопросторового аналізу та моделювання</div>
              </div>
            </div>
            <div className="hidden md:flex gap-6 items-center">
              <a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('#about'); }} className="text-gray-300 hover:text-amber-400 cursor-pointer transition-colors text-sm font-medium">Про систему</a>
              <a href="#logic" onClick={(e) => { e.preventDefault(); scrollTo('#logic'); }} className="text-gray-300 hover:text-amber-400 cursor-pointer transition-colors text-sm font-medium">Методологія</a>
              <a href="#data" onClick={(e) => { e.preventDefault(); scrollTo('#data'); }} className="text-gray-300 hover:text-amber-400 cursor-pointer transition-colors text-sm font-medium">Джерела даних</a>
              <button onClick={() => navigate('/import')} className="border border-amber-500 text-amber-400 px-4 py-2 rounded hover:bg-amber-500 hover:text-white transition-colors text-sm font-medium">
                <TbDatabase className="inline mr-1" />
                Імпорт даних
              </button>
              <button onClick={() => navigate('/map')} className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-5 py-2 rounded hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg text-sm font-bold">
                <TbMapSearch className="inline mr-1 text-lg" />
                Аналіз на карті
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(168, 85, 247, 0.1) 35px, rgba(168, 85, 247, 0.1) 70px)',
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-4">
          <div className="mb-6 flex items-center gap-3">
            <GiForest className="text-6xl text-amber-500" />
            <GiMountains className="text-7xl text-amber-600" />
            <GiTreeBranch className="text-6xl text-amber-500" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            ГЕОІНФОРМАЦІЙНА СИСТЕМА АНАЛІЗУ
          </h1>
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-6 text-amber-400" style={{ fontFamily: 'Georgia, serif' }}>
            РЕКРЕАЦІЙНОГО ПОТЕНЦІАЛУ УКРАЇНИ
          </h2>
          
          <div className="bg-slate-800/50 backdrop-blur-md px-8 py-4 rounded-lg border border-amber-600/30 mb-8">
            <p className="text-lg md:text-xl text-center max-w-4xl text-gray-300">
              Багатофакторна модель визначення оптимальних локацій для розміщення рекреаційних об'єктів 
              на основі аналізу <span className="text-amber-400 font-bold">7 ключових факторів</span> геопросторових даних
            </p>
          </div>
          
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => navigate('/map')}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 px-8 py-4 rounded-lg text-lg font-bold shadow-2xl transform hover:scale-105 transition-all flex items-center gap-2"
            >
              <TbMapSearch className="text-2xl" />
              Розпочати аналіз
            </button>
            <button
              onClick={() => scrollTo('#logic')}
              className="bg-slate-700/50 hover:bg-slate-700 backdrop-blur px-8 py-4 rounded-lg text-lg font-semibold border-2 border-amber-500/50 hover:border-amber-400 transition-all flex items-center gap-2"
            >
              <TbChartDots3 className="text-xl" />
              Методологія
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-6 text-center max-w-2xl">
            <div className="bg-slate-800/30 backdrop-blur px-4 py-3 rounded border border-amber-600/20">
              <div className="text-3xl font-bold text-amber-400">24</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Регіони України</div>
            </div>
            <div className="bg-slate-800/30 backdrop-blur px-4 py-3 rounded border border-amber-600/20">
              <div className="text-3xl font-bold text-amber-400">7</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Факторів аналізу</div>
            </div>
            <div className="bg-slate-800/30 backdrop-blur px-4 py-3 rounded border border-amber-600/20">
              <div className="text-3xl font-bold text-amber-400">100+</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Рекомендовані зони</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Характеристики системи
            </h2>
            <div className="w-24 h-1 bg-amber-600 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-xl border-t-4 border-amber-600 hover:shadow-2xl transition-shadow">
              <div className="mb-4 flex justify-center">
                <div className="bg-amber-100 p-4 rounded-full">
                  <MdNaturePeople className="w-12 h-12 text-amber-700" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center text-slate-800" style={{ fontFamily: 'Georgia, serif' }}>Мета дослідження</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Визначення оптимальних локацій для розміщення рекреаційних об'єктів 
                на основі багатофакторного геопросторового аналізу та математичного моделювання
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-xl border-t-4 border-blue-600 hover:shadow-2xl transition-shadow">
              <div className="mb-4 flex justify-center">
                <div className="bg-blue-100 p-4 rounded-full">
                  <MdAnalytics className="w-12 h-12 text-blue-700" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center text-slate-800" style={{ fontFamily: 'Georgia, serif' }}>Територіальне охоплення</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                24 області України<br/>
                780 існуючих рекреаційних пунктів<br/>
                12 національних природних парків<br/>
                Реальні дані про інфраструктуру
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-xl border-t-4 border-green-600 hover:shadow-2xl transition-shadow">
              <div className="mb-4 flex justify-center">
                <div className="bg-green-100 p-4 rounded-full">
                  <MdEmojiEvents className="w-12 h-12 text-green-700" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-center text-slate-800" style={{ fontFamily: 'Georgia, serif' }}>Результати аналізу</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Рейтинг регіонів за рекреаційним потенціалом, карта рекомендованих зон розміщення об'єктів, 
                інвестиційні прогнози та детальна геопросторова візуалізація
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section id="logic" className="py-20 bg-slate-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Науково-методологічна база
            </h2>
            <div className="w-24 h-1 bg-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Багатофакторна модель оцінки рекреаційного потенціалу територій на основі геопросторового аналізу
            </p>
          </div>

          {/* Formula */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-xl mb-12 shadow-2xl border-2 border-amber-600">
            <div className="flex items-center justify-center gap-3 mb-6">
              <TbChartDots3 className="text-amber-500 text-4xl" />
              <h3 className="text-3xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
                Модель розрахунку пріоритету зони
              </h3>
            </div>

            <div className="bg-slate-700/50 backdrop-blur p-6 rounded-lg shadow-xl mb-6 border border-amber-600/30">
              <div className="text-center text-2xl font-bold mb-6 text-amber-400" style={{ fontFamily: 'Courier New, monospace' }}>
                P<sub className="text-sm">zone</sub> = Σ(F<sub className="text-sm">i</sub> × W<sub className="text-sm">i</sub>) − S<sub className="text-sm">penalty</sub>
              </div>
              
              <div className="space-y-3 text-base">
                <div className="flex justify-between items-center bg-slate-800/60 px-4 py-3 rounded border-l-4 border-green-500">
                  <span className="text-gray-200 font-medium">F₁: Попит населення</span>
                  <span className="font-bold text-green-400 text-lg">0-25</span>
                </div>
                <div className="flex justify-between items-center bg-slate-800/60 px-4 py-3 rounded border-l-4 border-emerald-500">
                  <span className="text-gray-200 font-medium">F₂: ПЗФ (атрактор)</span>
                  <span className="font-bold text-emerald-400 text-lg">0-20</span>
                </div>
                <div className="flex justify-between items-center bg-slate-800/60 px-4 py-3 rounded border-l-4 border-blue-500">
                  <span className="text-gray-200 font-medium">F₃: Природні ресурси</span>
                  <span className="font-bold text-blue-400 text-lg">0-15</span>
                </div>
                <div className="flex justify-between items-center bg-slate-800/60 px-4 py-3 rounded border-l-4 border-cyan-500">
                  <span className="text-gray-200 font-medium">F₄: Транспортна доступність</span>
                  <span className="font-bold text-cyan-400 text-lg">0-15</span>
                </div>
                <div className="flex justify-between items-center bg-slate-800/60 px-4 py-3 rounded border-l-4 border-indigo-500">
                  <span className="text-gray-200 font-medium">F₅: Інфраструктура</span>
                  <span className="font-bold text-indigo-400 text-lg">0-10</span>
                </div>
                <div className="flex justify-between items-center bg-slate-800/60 px-4 py-3 rounded border-l-4 border-orange-500">
                  <span className="text-gray-200 font-medium">F₆: Пожежна безпека</span>
                  <span className="font-bold text-orange-400 text-lg">0-5</span>
                </div>
                <div className="flex justify-between items-center bg-slate-800/60 px-4 py-3 rounded border-l-4 border-red-500">
                  <span className="text-gray-200 font-medium">S: Штраф насиченості</span>
                  <span className="font-bold text-red-400 text-lg">0 до −15</span>
                </div>
              </div>
              
              <div className="text-center mt-6 pt-6 border-t-2 border-amber-600/50">
                <span className="text-3xl font-bold text-amber-400" style={{ fontFamily: 'Courier New, monospace' }}>P<sub>max</sub> = 100</span>
                <p className="text-gray-400 text-sm mt-2">максимальний пріоритет зони</p>
              </div>
            </div>

            <p className="text-center text-gray-600 italic">
              Максимальний бал: 100 | Мінімальний бал: 0 |
              Рекомендується будівництво: ≥70 балів
            </p>
          </div>

          {/* Detailed Factors */}
          <div className="space-y-8">
            {/* Factor 1 */}
            <div className="bg-white border-2 border-gray-200 p-6 rounded-lg">
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded">1</span>
                Попит від населення (0-25 балів)
              </h4>

              <div className="space-y-4 ml-4">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="font-semibold mb-2">Формула попиту:</p>
                  <code className="block bg-white p-3 rounded border text-sm">
                    Річний попит = Населення × 0.15 × 3 відвідування
                  </code>
                  <p className="text-sm text-gray-600 mt-2">
                    15% населення є потенційними відвідувачами, кожен відвідує 3 рази на рік
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <p className="font-semibold mb-2">Розрахунок балів:</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Співвідношення &lt; 0.6 (дефіцит &gt;40%): <strong>25 балів</strong></li>
                    <li>• Співвідношення 0.6-0.8 (дефіцит 20-40%): <strong>20 балів</strong></li>
                    <li>• Співвідношення 0.8-1.0 (баланс): <strong>15 балів</strong></li>
                    <li>• Співвідношення 1.0-1.5 (надлишок 0-50%): <strong>10 балів</strong></li>
                    <li>• Співвідношення &gt; 1.5 (надлишок &gt;50%): <strong>0 балів</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Factor 2 */}
            <div className="bg-white border-2 border-gray-200 p-6 rounded-lg">
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded">2</span>
                ПЗФ як туристичний атрактор (0-20 балів)
              </h4>

              <div className="space-y-4 ml-4">
                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                  <p className="font-semibold mb-2">Ваги категорій ПЗФ:</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• НПП (Національні природні парки): <strong>×2.0</strong></li>
                    <li>• Природні заповідники: <strong>×1.5</strong></li>
                    <li>• РЛП (Регіональні ландшафтні парки): <strong>×1.0</strong></li>
                    <li>• Заказники: <strong>×0.1</strong></li>
                    <li>• Пам'ятки природи: <strong>×0.05</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Factor 3 */}
            <div className="bg-white border-2 border-gray-200 p-6 rounded-lg">
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded">3</span>
                Природні ресурси (0-15 балів)
              </h4>

              <div className="grid md:grid-cols-2 gap-4 ml-4">
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <p className="font-semibold mb-2 flex items-center gap-2"><GiForest className="w-4 h-4" /> Лісистість (0-11 балів):</p>
                  <ul className="text-sm space-y-1">
                    <li>• ≥40%: <strong>11 балів</strong></li>
                    <li>• 30-39%: <strong>9 балів</strong></li>
                    <li>• 20-29%: <strong>7 балів</strong></li>
                    <li>• 10-19%: <strong>5 балів</strong></li>
                    <li>• &lt;10%: <strong>3 бали</strong></li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                  <p className="font-semibold mb-2 flex items-center gap-2"><GiWaterDrop className="w-4 h-4" /> Водойми (0-4 бали):</p>
                  <ul className="text-sm space-y-1">
                    <li>• Великі водойми: <strong>+4 бали</strong></li>
                    <li>• Річки: <strong>+2 бали</strong></li>
                    <li>• Немає: <strong>0 балів</strong></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Factor 4 */}
            <div className="bg-white border-2 border-gray-200 p-6 rounded-lg">
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded">4</span>
                Транспортна доступність (0-15 балів)
              </h4>

              <div className="bg-blue-50 p-4 rounded border border-blue-200 ml-4">
                <p className="font-semibold mb-2">Компоненти:</p>
                <ul className="text-sm space-y-2 ml-4">
                  <li>• <strong>Base score:</strong> accessibility_score / 10 × 10 (0-10 балів)</li>
                  <li>• <strong>Міжнародні траси:</strong> кількість × 0.8 (макс 3 бали)</li>
                  <li>• <strong>Аеропорт:</strong> +1 бал</li>
                  <li>• <strong>Щільність доріг:</strong> &gt;250 км/1000км² → +1 бал</li>
                </ul>
              </div>
            </div>

            {/* Factor 5 */}
            <div className="bg-white border-2 border-gray-200 p-6 rounded-lg">
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded">5</span>
                Антропогенна інфраструктура (0-10 балів)
              </h4>

              <div className="grid md:grid-cols-2 gap-4 ml-4">
                <div className="space-y-2">
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <p className="font-semibold text-sm flex items-center gap-1"><MdLocalHospital className="w-4 h-4" /> Медицина (3 бали):</p>
                    <ul className="text-xs mt-1 ml-3">
                      <li>≥5.0 лікарень/100K: 3</li>
                      <li>4.0-5.0: 2</li>
                      <li>&lt;4.0: 1</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 p-3 rounded border border-orange-200">
                    <p className="font-semibold text-sm flex items-center gap-1"><MdLocalGasStation className="w-4 h-4" /> Заправки (2 бали):</p>
                    <ul className="text-xs mt-1 ml-3">
                      <li>≥1.0 на 100км²: 2</li>
                      <li>0.7-1.0: 1.5</li>
                      <li>&lt;0.7: 1</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="font-semibold text-sm flex items-center gap-1"><MdWifi className="w-4 h-4" /> Зв'язок (2 бали):</p>
                    <ul className="text-xs mt-1 ml-3">
                      <li>≥96%: 2</li>
                      <li>93-96%: 1.5</li>
                      <li>&lt;93%: 1</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="bg-purple-50 p-3 rounded border border-purple-200">
                    <p className="font-semibold text-sm">🌐 Інтернет (1 бал):</p>
                    <ul className="text-xs mt-1 ml-3">
                      <li>≥90%: 1</li>
                      <li>85-90%: 0.5</li>
                      <li>&lt;85%: 0</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <p className="font-semibold text-sm flex items-center gap-1"><MdApartment className="w-4 h-4" /> Готелі (1 бал):</p>
                    <ul className="text-xs mt-1 ml-3">
                      <li>&gt;200: 1</li>
                      <li>100-200: 0.5</li>
                      <li>&lt;100: 0</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <p className="font-semibold text-sm flex items-center gap-1"><MdElectricalServices className="w-4 h-4" /> Електрика (1 бал):</p>
                    <ul className="text-xs mt-1 ml-3">
                      <li>Висока: 1</li>
                      <li>Середня: 0.5</li>
                      <li>Низька: 0</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Factor 6 */}
            <div className="bg-white border-2 border-red-200 p-6 rounded-lg">
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded">6</span>
                Штраф за насиченість (0 до −15 балів)
              </h4>

              <div className="bg-red-50 p-4 rounded border border-red-200 ml-4">
                <p className="font-semibold mb-2">Штрафи:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Щільність &lt; 1.0: <strong>−2 бали</strong> (низька)</li>
                  <li>• Щільність 1.0-2.0: <strong>−5 балів</strong> (помірна)</li>
                  <li>• Щільність 2.0-3.0: <strong>−10 балів</strong> (висока)</li>
                  <li>• Щільність &gt; 3.0: <strong>−15 балів</strong> (критична)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section id="methodology" className="py-20 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">
            Науково-методологічне обґрунтування
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Вагові коефіцієнти моделі базуються на міжнародній практиці та наукових дослідженнях
          </p>

          {/* AHP Method */}
          <div className="bg-white p-8 rounded-lg shadow-lg mb-8">
            <h3 className="text-2xl font-bold mb-4 text-green-700">
              Метод Analytic Hierarchy Process (AHP)
            </h3>
            <p className="text-gray-700 mb-4">
              Для визначення вагових коефіцієнтів застосовано <strong>Analytic Hierarchy Process (AHP)</strong> - 
              систематичний підхід до багатокритеріального прийняття рішень, широко визнаний у міжнародній 
              практиці оцінки туристичного та рекреаційного потенціалу.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-green-50 p-4 rounded">
                <p className="font-semibold text-green-700 mb-2">✅ Систематична інтеграція</p>
                <p className="text-sm text-gray-600">Кількісних та якісних факторів</p>
              </div>
              <div className="bg-blue-50 p-4 rounded">
                <p className="font-semibold text-blue-700 mb-2">✅ Парне порівняння</p>
                <p className="text-sm text-gray-600">Експертами для визначення пріоритетів</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="font-semibold text-purple-700 mb-2">✅ Перевірка консистентності</p>
                <p className="text-sm text-gray-600">Валідація експертних суджень</p>
              </div>
            </div>
          </div>

          {/* Weight Justification */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Demand 25% */}
            <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500">
              <h4 className="text-xl font-bold mb-3 text-green-700">
                Попит = 25% (Найвищий пріоритет)
              </h4>
              <ul className="text-sm space-y-2 text-gray-700">
                <li>✅ <strong>Економічна основа:</strong> Без попиту неможливий самоокупний бізнес</li>
                <li>✅ <strong>Підтвердження:</strong> Дослідження показують вагу 0.31 для факторів попиту [UMass Research]</li>
                <li>✅ <strong>Kentucky SCORP 2020:</strong> "Community demand is foundation of facility location"</li>
              </ul>
            </div>

            {/* PFZ 20% */}
            <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
              <h4 className="text-xl font-bold mb-3 text-blue-700">
                ПЗФ = 20% (Туристичний атрактор)
              </h4>
              <ul className="text-sm space-y-2 text-gray-700">
                <li>✅ <strong>Унікальна привабливість:</strong> Природоохоронні території є ключовими атракторами</li>
                <li>✅ <strong>Баланс:</strong> Важливість зберігання + туристична цінність</li>
                <li>✅ <strong>Обмеження:</strong> Будівництво дозволено 2-10 км від меж ПЗФ</li>
              </ul>
            </div>

            {/* Infrastructure 10% */}
            <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-purple-500">
              <h4 className="text-xl font-bold mb-3 text-purple-700">
                Інфраструктура = 10% (Вторинна)
              </h4>
              <ul className="text-sm space-y-2 text-gray-700">
                <li>✅ <strong>Може бути розвинута:</strong> Лікарні, заправки, готелі можна побудувати</li>
                <li>✅ <strong>Laguna Hills Study:</strong> "Amenity gaps" важливіші за поточну інфраструктуру</li>
                <li>✅ <strong>Вторинність:</strong> Інфраструктура є засобом, а не метою</li>
              </ul>
            </div>

            {/* Forest Fires +5% */}
            <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-orange-500">
              <h4 className="text-xl font-bold mb-3 text-orange-700">
                Лісові пожежі = +5% (НОВИЙ ФАКТОР)
              </h4>
              <ul className="text-sm space-y-2 text-gray-700">
                <li>🔥 <strong>Парадокс:</strong> Багато пожеж → потреба в облаштованих пунктах</li>
                <li>✅ <strong>Дослідження США:</strong> 80% пожеж від рекреації - ПОЗА офіційними місцями</li>
                <li>✅ <strong>Профілактика:</strong> Кільця для вогнищ знижують ризик на 40%</li>
                <li>✅ <strong>Щільність:</strong> У радіусі 1 км від кемпінгів пожеж у 7 разів більше</li>
              </ul>
            </div>
          </div>

          {/* Fire Prevention Logic */}
          <div className="bg-gradient-to-r from-orange-100 to-red-100 p-8 rounded-lg shadow-lg border-2 border-orange-300 mb-8">
            <h3 className="text-2xl font-bold mb-4 text-orange-800 flex items-center gap-2">
              <span className="text-3xl">🔥</span>
              Логіка фактору лісових пожеж
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-bold text-red-700 mb-2">❌ Відсутність рекреаційних пунктів:</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>→ Неконтрольоване розпалювання вогнищ</li>
                  <li>→ Відсутність води для гасіння</li>
                  <li>→ Відсутність протипожежних заходів</li>
                  <li className="font-bold text-red-600">→ ЗБІЛЬШЕННЯ ризику пожеж</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-bold text-green-700 mb-2">✅ Наявність облаштованих пунктів:</h4>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>→ Контрольовані вогнища у кам'яних кільцях</li>
                  <li>→ Доступ до води для гасіння</li>
                  <li>→ Інформування про пожежну безпеку</li>
                  <li className="font-bold text-green-600">→ ЗНИЖЕННЯ ризику на 40%</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Джерела:</strong> NW Fire Science Consortium (2020), Nature Journal (2024), 
                Kentucky Forest Service. Дані по Україні: Реєстр пожеж 2025 (2,175 пожеж у всіх 24 областях України - тестові дані для дослідження).
              </p>
            </div>
          </div>

          {/* Scientific References */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              📚 Наукові джерела:
            </h3>
            <ul className="text-sm space-y-2 text-gray-700">
              <li>• <strong>AHP методологія:</strong> PMC Journal (2022), Wiley Online Library (2022)</li>
              <li>• <strong>Kentucky SCORP 2020-2025:</strong> State Comprehensive Outdoor Recreation Plan</li>
              <li>• <strong>District of Columbia Recreation Plan (2020)</strong></li>
              <li>• <strong>Wildfire Prevention Research:</strong> NW Fire Science Consortium, Nature Journal</li>
              <li>• <strong>Laguna Hills Recreation Assessment:</strong> California Recreation Planning</li>
              <li>• <strong>Ukraine Protected Areas Law:</strong> Закон України "Про природно-заповідний фонд"</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Data Sources Section */}
      <section id="data" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Джерела даних
            </h2>
            <div className="w-24 h-1 bg-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Система використовує 5 основних джерел верифікованих геопросторових даних про Україну
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* File 1 */}
            <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-lg shadow-xl border-l-4 border-green-600 hover:shadow-2xl transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <MdLandscape className="w-8 h-8 text-green-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">
                    recreational_points_web.geojson
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Геопросторові дані про існуючі рекреаційні об'єкти
                  </p>
                  <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                    <p><strong>Об'єктів:</strong> 780</p>
                    <p><strong>Тип:</strong> GeoJSON (точки з координатами)</p>
                    <p><strong>Розмір:</strong> 933 КБ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* File 2 */}
            <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-lg shadow-xl border-l-4 border-blue-600 hover:shadow-2xl transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <MdAnalytics className="w-8 h-8 text-blue-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Courier New, monospace' }}>
                    ukraine_population_data.json
                  </h3>
                  <p className="text-gray-600 mb-3 text-sm">
                    Демографічні та природні характеристики регіонів
                  </p>
                  <div className="bg-slate-50 p-3 rounded text-sm space-y-1 border border-slate-200">
                    <p><strong>Регіонів:</strong> 24</p>
                    <p><strong>Формат:</strong> JSON</p>
                    <p><strong>Розмір:</strong> 8.2 КБ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* File 3 */}
            <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-lg shadow-xl border-l-4 border-emerald-600 hover:shadow-2xl transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-emerald-100 p-3 rounded-full">
                  <GiForest className="w-8 h-8 text-emerald-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Courier New, monospace' }}>
                    ukraine_protected_areas.json
                  </h3>
                  <p className="text-gray-600 mb-3 text-sm">
                    Природоохоронний фонд України (ПЗФ)
                  </p>
                  <div className="bg-slate-50 p-3 rounded text-sm space-y-1 border border-slate-200">
                    <p><strong>Об'єктів:</strong> 8,512</p>
                    <p><strong>Формат:</strong> JSON</p>
                    <p><strong>Розмір:</strong> 17 КБ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* File 4 */}
            <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-lg shadow-xl border-l-4 border-purple-600 hover:shadow-2xl transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <MdDirectionsCar className="w-8 h-8 text-purple-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Courier New, monospace' }}>
                    ukraine_infrastructure.json
                  </h3>
                  <p className="text-gray-600 mb-3 text-sm">
                    Транспортна та антропогенна інфраструктура
                  </p>
                  <div className="bg-slate-50 p-3 rounded text-sm space-y-1 border border-slate-200">
                    <p><strong>Регіонів:</strong> 24</p>
                    <p><strong>Формат:</strong> JSON</p>
                    <p><strong>Розмір:</strong> 33 КБ</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* File 5 */}
            <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-lg shadow-xl border-l-4 border-orange-600 hover:shadow-2xl transition-shadow">
              <div className="flex items-start gap-4">
                <div className="bg-orange-100 p-3 rounded-full">
                  <GiFireBowl className="w-8 h-8 text-orange-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Courier New, monospace' }}>
                    forest_fires.geojson
                  </h3>
                  <p className="text-gray-600 mb-3 text-sm">
                    Статистика лісових пожеж (профілактика)
                  </p>
                  <div className="bg-slate-50 p-3 rounded text-sm space-y-1 border border-slate-200">
                    <p><strong>Пожеж:</strong> 1,875</p>
                    <p><strong>Формат:</strong> GeoJSON</p>
                    <p><strong>Розмір:</strong> 1.1 МБ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-12 bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-xl shadow-2xl border-2 border-amber-600">
            <h3 className="text-2xl font-bold text-center mb-6 text-white" style={{ fontFamily: 'Georgia, serif' }}>
              Загальний обсяг даних
            </h3>
            <div className="grid md:grid-cols-5 gap-4 text-center">
              <div className="bg-slate-700/50 backdrop-blur p-4 rounded border border-amber-600/20">
                <div className="text-3xl font-bold text-green-400">780</div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">Рекр. пунктів</div>
              </div>
              <div className="bg-slate-700/50 backdrop-blur p-4 rounded border border-amber-600/20">
                <div className="text-3xl font-bold text-blue-400">24</div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">Регіони</div>
              </div>
              <div className="bg-slate-700/50 backdrop-blur p-4 rounded border border-amber-600/20">
                <div className="text-3xl font-bold text-emerald-400">8,512</div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">Об'єктів ПЗФ</div>
              </div>
              <div className="bg-slate-700/50 backdrop-blur p-4 rounded border border-amber-600/20">
                <div className="text-3xl font-bold text-purple-400">1,875</div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">Пожеж</div>
              </div>
              <div className="bg-slate-700/50 backdrop-blur p-4 rounded border border-amber-600/20">
                <div className="text-3xl font-bold text-amber-400">2.1</div>
                <div className="text-gray-400 text-xs uppercase tracking-wide">МБ даних</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="analysis" className="py-20 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="mb-6">
            <TbMapSearch className="text-6xl text-amber-500 mx-auto" />
          </div>
          <h2 className="text-4xl font-bold mb-6 text-white" style={{ fontFamily: 'Georgia, serif' }}>
            Розпочати геопросторовий аналіз
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Оберіть регіон України та отримайте детальний багатофакторний аналіз 
            з картою рекомендованих зон розміщення рекреаційних об'єктів
          </p>
          <button
            onClick={() => navigate('/map')}
            className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-12 py-4 rounded-lg text-xl font-bold shadow-2xl hover:shadow-amber-500/50 transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
          >
            <TbMapSearch className="text-2xl" />
            Відкрити інтерактивну карту
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-slate-900 to-black text-white py-12 border-t-2 border-amber-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <GiMountains className="text-2xl text-amber-500" />
                <h3 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>ГІС АНАЛІЗ</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Геоінформаційна система багатофакторного аналізу 
                рекреаційного потенціалу територій України
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4 text-amber-400" style={{ fontFamily: 'Georgia, serif' }}>Розділи</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('#about'); }} className="hover:text-amber-400 cursor-pointer transition-colors">Характеристики</a></li>
                <li><a href="#logic" onClick={(e) => { e.preventDefault(); scrollTo('#logic'); }} className="hover:text-amber-400 cursor-pointer transition-colors">Методологія</a></li>
                <li><a href="#data" onClick={(e) => { e.preventDefault(); scrollTo('#data'); }} className="hover:text-amber-400 cursor-pointer transition-colors">Джерела даних</a></li>
                <li><button onClick={() => navigate('/map')} className="hover:text-amber-400 cursor-pointer transition-colors">Карта аналізу</button></li>
                <li><button onClick={() => navigate('/import')} className="hover:text-amber-400 cursor-pointer transition-colors">Імпорт даних</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4 text-amber-400" style={{ fontFamily: 'Georgia, serif' }}>Технології</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>React + Tailwind CSS</li>
                <li>FastAPI + Python</li>
                <li>Leaflet Maps</li>
                <li>MongoDB</li>
                <li>GeoJSON / Pydantic</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-6 text-center text-gray-500 text-sm">
            <p>Система геопросторового аналізу рекреаційного потенціалу • 2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
