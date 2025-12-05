import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, BarChart3, Download, Target, Award, TreePine, Droplets, Car, Hospital, Fuel, Radio, Building, Zap, Trees, Trophy } from 'lucide-react';

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
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-bold text-green-600">
              ГІС Рекреація
            </div>
            <div className="hidden md:flex gap-6">
              <a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('#about'); }} className="hover:text-green-600 cursor-pointer">Про систему</a>
              <a href="#logic" onClick={(e) => { e.preventDefault(); scrollTo('#logic'); }} className="hover:text-green-600 cursor-pointer">Логіка системи</a>
              <a href="#methodology" onClick={(e) => { e.preventDefault(); scrollTo('#methodology'); }} className="hover:text-green-600 cursor-pointer">Методологія</a>
              <a href="#data" onClick={(e) => { e.preventDefault(); scrollTo('#data'); }} className="hover:text-green-600 cursor-pointer">Джерела даних</a>
              <button onClick={() => navigate('/map')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Відкрити карту
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070')",
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-4">
          <h1 className="text-5xl md:text-7xl font-bold text-center mb-4">
            Геоінформаційна система аналізу
            <br />
            рекреаційного потенціалу
          </h1>
          <p className="text-xl md:text-2xl text-center mb-8 max-w-3xl">
            Визначення оптимальних локацій для будівництва
            рекреаційних об'єктів в Україні
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/map')}
              className="bg-green-600 hover:bg-green-700 px-8 py-4 rounded-lg text-lg font-semibold shadow-lg"
            >
              Почати аналіз
            </button>
            <button
              onClick={() => scrollTo('#logic')}
              className="bg-white/20 hover:bg-white/30 backdrop-blur px-8 py-4 rounded-lg text-lg font-semibold border border-white/30"
            >
              Логіка системи
            </button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Про інформаційну систему
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="mb-4"><Target className="w-12 h-12 text-green-600" /></div>
              <h3 className="text-xl font-bold mb-2">Мета</h3>
              <p className="text-gray-600">
                Визначення оптимальних локацій для будівництва
                рекреаційних об'єктів (готелів, кемпінгів, баз відпочинку)
                на основі комплексного аналізу 6 факторів
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="mb-4"><BarChart3 className="w-12 h-12 text-blue-600" /></div>
              <h3 className="text-xl font-bold mb-2">Охоплення</h3>
              <p className="text-gray-600">
                24 області України<br/>
                780 існуючих рекреаційних пунктів<br/>
                12 національних природних парків<br/>
                Реальні дані про інфраструктуру
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="mb-4"><Trophy className="w-12 h-12 text-yellow-600" /></div>
              <h3 className="text-xl font-bold mb-2">Результат</h3>
              <p className="text-gray-600">
                Рейтинг областей за потенціалом<br/>
                Конкретні рекомендовані локації<br/>
                Інвестиційні прогнози<br/>
                Візуалізація на інтерактивній карті
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Logic Section */}
      <section id="logic" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">
            Логіка інформаційної системи
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Математична модель та алгоритми розрахунку рекреаційного потенціалу
          </p>

          {/* Formula */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-lg mb-12 border-2 border-green-200">
            <h3 className="text-2xl font-bold mb-4 text-center">
              Формула рекреаційного потенціалу
            </h3>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="text-center text-xl font-mono mb-4">
                <strong>Потенціал =</strong>
              </div>
              <div className="space-y-2 text-lg">
                <div className="flex justify-between items-center border-b pb-2">
                  <span>+ Попит від населення</span>
                  <span className="font-bold text-green-600">25%</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span>+ ПЗФ як туристичний атрактор</span>
                  <span className="font-bold text-green-600">20%</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span>+ Природні ресурси</span>
                  <span className="font-bold text-blue-600">15%</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span>+ Транспортна доступність</span>
                  <span className="font-bold text-blue-600">15%</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span>+ Антропогенна інфраструктура</span>
                  <span className="font-bold text-blue-600">10%</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2 bg-orange-50">
                  <span>+ Ризик лісових пожеж (профілактика)</span>
                  <span className="font-bold text-orange-600">+5%</span>
                </div>
                <div className="flex justify-between items-center border-t-2 border-red-200 pt-2">
                  <span>− Насиченість існуючими пунктами</span>
                  <span className="font-bold text-red-600">−15%</span>
                </div>
              </div>
              <div className="text-center mt-4 pt-4 border-t-2 border-gray-300">
                <span className="text-2xl font-bold">= 100 балів</span>
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
                  <p className="font-semibold mb-2 flex items-center gap-2"><TreePine className="w-4 h-4" /> Лісистість (0-11 балів):</p>
                  <ul className="text-sm space-y-1">
                    <li>• ≥40%: <strong>11 балів</strong></li>
                    <li>• 30-39%: <strong>9 балів</strong></li>
                    <li>• 20-29%: <strong>7 балів</strong></li>
                    <li>• 10-19%: <strong>5 балів</strong></li>
                    <li>• &lt;10%: <strong>3 бали</strong></li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                  <p className="font-semibold mb-2 flex items-center gap-2"><Droplets className="w-4 h-4" /> Водойми (0-4 бали):</p>
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
                    <p className="font-semibold text-sm flex items-center gap-1"><Hospital className="w-4 h-4" /> Медицина (3 бали):</p>
                    <ul className="text-xs mt-1 ml-3">
                      <li>≥5.0 лікарень/100K: 3</li>
                      <li>4.0-5.0: 2</li>
                      <li>&lt;4.0: 1</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 p-3 rounded border border-orange-200">
                    <p className="font-semibold text-sm flex items-center gap-1"><Fuel className="w-4 h-4" /> Заправки (2 бали):</p>
                    <ul className="text-xs mt-1 ml-3">
                      <li>≥1.0 на 100км²: 2</li>
                      <li>0.7-1.0: 1.5</li>
                      <li>&lt;0.7: 1</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="font-semibold text-sm flex items-center gap-1"><Radio className="w-4 h-4" /> Зв'язок (2 бали):</p>
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
                    <p className="font-semibold text-sm flex items-center gap-1"><Building className="w-4 h-4" /> Готелі (1 бал):</p>
                    <ul className="text-xs mt-1 ml-3">
                      <li>&gt;200: 1</li>
                      <li>100-200: 0.5</li>
                      <li>&lt;100: 0</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <p className="font-semibold text-sm flex items-center gap-1"><Zap className="w-4 h-4" /> Електрика (1 бал):</p>
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
      <section id="data" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">
            Джерела даних
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">
            Система використовує 4 основні джерела реальних даних про Україну
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* File 1 */}
            <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500">
              <div className="flex items-start gap-4">
                <div><MapPin className="w-10 h-10 text-green-600" /></div>
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
            <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
              <div className="flex items-start gap-4">
                <div><BarChart3 className="w-10 h-10 text-blue-600" /></div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">
                    ukraine_population_data.json
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Демографічні та природні характеристики областей
                  </p>
                  <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                    <p><strong>Областей:</strong> 24</p>
                    <p><strong>Тип:</strong> JSON</p>
                    <p><strong>Розмір:</strong> 8.2 КБ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* File 3 */}
            <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-yellow-500">
              <div className="flex items-start gap-4">
                <div><Trees className="w-10 h-10 text-green-700" /></div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">
                    ukraine_protected_areas.json
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Природоохоронні території України (ПЗФ)
                  </p>
                  <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                    <p><strong>Об'єктів:</strong> 8,512 (НПП, заповідники, РЛП)</p>
                    <p><strong>Тип:</strong> JSON</p>
                    <p><strong>Розмір:</strong> 17 КБ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* File 4 */}
            <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-purple-500">
              <div className="flex items-start gap-4">
                <div><Car className="w-10 h-10 text-purple-600" /></div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">
                    ukraine_infrastructure.json
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Транспортна та антропогенна інфраструктура
                  </p>
                  <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                    <p><strong>Областей:</strong> 24</p>
                    <p><strong>Тип:</strong> JSON</p>
                    <p><strong>Розмір:</strong> 33 КБ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-12 bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-lg border-2 border-green-200">
            <h3 className="text-2xl font-bold text-center mb-6">
              Загальна статистика даних
            </h3>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold text-green-600">780</div>
                <div className="text-gray-600">Рекреаційних пунктів</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600">24</div>
                <div className="text-gray-600">Області України</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-yellow-600">8,512</div>
                <div className="text-gray-600">Об'єктів ПЗФ</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600">100+</div>
                <div className="text-gray-600">Параметрів інфраструктури</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="analysis" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Готові проаналізувати потенціал?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Оберіть область та отримайте детальний аналіз з рекомендованими локаціями
          </p>
          <button
            onClick={() => navigate('/map')}
            className="bg-green-600 hover:bg-green-700 text-white px-12 py-4 rounded-lg text-xl font-semibold shadow-lg hover:shadow-xl transition"
          >
            Відкрити інтерактивну карту 🗺️
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">ГІС Рекреація</h3>
              <p className="text-gray-400">
                Геоінформаційна система для аналізу рекреаційного
                потенціалу територій України
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Посилання</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('#about'); }} className="hover:text-white cursor-pointer">Про систему</a></li>
                <li><a href="#logic" onClick={(e) => { e.preventDefault(); scrollTo('#logic'); }} className="hover:text-white cursor-pointer">Логіка</a></li>
                <li><a href="#methodology" onClick={(e) => { e.preventDefault(); scrollTo('#methodology'); }} className="hover:text-white cursor-pointer">Методологія</a></li>
                <li><a href="#data" onClick={(e) => { e.preventDefault(); scrollTo('#data'); }} className="hover:text-white cursor-pointer">Дані</a></li>
                <li><button onClick={() => navigate('/map')} className="hover:text-white cursor-pointer">Карта</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Контакти</h3>
              <p className="text-gray-400">
                Магістерська робота<br/>
                2025
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            © 2025 ГІС Рекреаційного Потенціалу. Всі права захищені.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
