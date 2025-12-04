/**
 * Розрахунок повного рекреаційного потенціалу
 * Формула: Потенціал = Попит (25%) + ПЗФ (20%) + Природа (15%) + Транспорт (15%) + Інфра (10%) - Насиченість (15%)
 */

export const calculateFullPotential = (regionName, populationData, pfzData, infraData, recreationalPoints) => {
  // Default values
  if (!populationData) populationData = { population: 1000000, area_km2: 20000, forest_coverage_percent: 10, has_water_bodies: false };
  if (!pfzData) pfzData = { protected_areas: { national_parks: 0, nature_reserves: 0, regional_landscape_parks: 0, zakazniks: 0, monuments_of_nature: 0, percent_of_region: 0 }, pfz_score: 5.0 };
  if (!infraData) infraData = { transport_accessibility: { accessibility_score: 5.0, main_roads: [], airports: 0, highway_density_km_per_1000km2: 200 }, anthropogenic_infrastructure: {} };
  if (!recreationalPoints) recreationalPoints = [];

  // 1. DEMAND (25 points)
  const population = populationData.population || 1000000;
  const annualDemand = population * 0.15 * 3;
  const totalCapacity = recreationalPoints.reduce((sum, p) => sum + (parseFloat(p.properties?.capacity) || 0), 0);
  const annualSupply = totalCapacity * 180 * 2;
  const supplyDemandRatio = annualDemand > 0 ? annualSupply / annualDemand : 0;
  const gap = annualDemand - annualSupply;

  let demandScore = 0;
  if (supplyDemandRatio < 0.3) demandScore = 25;
  else if (supplyDemandRatio < 0.5) demandScore = 21;
  else if (supplyDemandRatio < 0.7) demandScore = 17;
  else if (supplyDemandRatio < 1.0) demandScore = 10;
  else if (supplyDemandRatio < 1.5) demandScore = 4;
  else demandScore = 0;

  // 2. PFZ (20 points)
  const pfz = pfzData.protected_areas || {};
  let pfzScore = 0;
  pfzScore += Math.min((pfz.national_parks || 0) * 2.5, 7);
  pfzScore += Math.min((pfz.nature_reserves || 0) * 2.0, 5);
  pfzScore += Math.min((pfz.regional_landscape_parks || 0) * 0.4, 4);
  pfzScore += Math.min((pfz.zakazniks || 0) * 0.02, 2);
  pfzScore += Math.min((pfz.monuments_of_nature || 0) * 0.02, 1);
  
  const percentOfRegion = pfz.percent_of_region || 0;
  if (percentOfRegion > 10) pfzScore += 2;
  else if (percentOfRegion > 7) pfzScore += 1.5;
  else if (percentOfRegion > 5) pfzScore += 1;
  pfzScore = Math.min(pfzScore, 20);

  // 3. NATURE (15 points)
  const forestCoverage = populationData.forest_coverage_percent || 0;
  const forestScore = Math.min(forestCoverage * 0.28, 11);
  const waterScore = populationData.has_water_bodies ? 4 : 0;
  const natureScore = forestScore + waterScore;

  // 4. TRANSPORT (15 points)
  const transport = infraData.transport_accessibility || {};
  let accessibilityScore = ((transport.accessibility_score || 5) / 10) * 10;
  const internationalRoads = (transport.main_roads || []).filter(r => r.type === 'міжнародна').length;
  accessibilityScore += Math.min(internationalRoads * 0.8, 3);
  if ((transport.airports || 0) > 0) accessibilityScore += 1;
  if ((transport.highway_density_km_per_1000km2 || 0) > 250) accessibilityScore += 1;
  accessibilityScore = Math.min(accessibilityScore, 15);

  // 5. INFRASTRUCTURE (10 points)
  const anthro = infraData.anthropogenic_infrastructure || {};
  let infraScore = 0;
  
  if ((anthro.hospitals_per_100k || 0) >= 5.0) infraScore += 3;
  else if ((anthro.hospitals_per_100k || 0) >= 4.0) infraScore += 2;
  else infraScore += 1;
  
  if ((anthro.gas_stations_per_100km2 || 0) >= 1.0) infraScore += 2;
  else if ((anthro.gas_stations_per_100km2 || 0) >= 0.7) infraScore += 1.5;
  else infraScore += 1;
  
  if ((anthro.mobile_coverage_percent || 0) >= 96) infraScore += 2;
  else if ((anthro.mobile_coverage_percent || 0) >= 93) infraScore += 1.5;
  else infraScore += 1;
  
  if ((anthro.internet_coverage_percent || 0) >= 90) infraScore += 1;
  else if ((anthro.internet_coverage_percent || 0) >= 85) infraScore += 0.5;
  
  if ((anthro.hotels_total || 0) > 200) infraScore += 1;
  else if ((anthro.hotels_total || 0) > 100) infraScore += 0.5;
  
  if (anthro.electricity_reliability === 'висока') infraScore += 1;
  else if (anthro.electricity_reliability === 'середня') infraScore += 0.5;
  infraScore = Math.min(infraScore, 10);

  // 6. SATURATION PENALTY (-15 points)
  const area = populationData.area_km2 || 20000;
  const density = area > 0 ? (recreationalPoints.length / area * 1000) : 0;
  let saturationPenalty = 0;
  if (density > 6) saturationPenalty = -15;
  else if (density > 4) saturationPenalty = -10;
  else if (density > 3) saturationPenalty = -6;
  else if (density > 2) saturationPenalty = -3;

  // TOTAL
  const totalScore = Math.max(0, Math.min(100, demandScore + pfzScore + natureScore + accessibilityScore + infraScore + saturationPenalty));

  // CATEGORY
  let category, recommendation;
  if (totalScore >= 85) {
    category = "ВИНЯТКОВИЙ";
    recommendation = "Найвища пріоритетність! Термінове будівництво рекомендується.";
  } else if (totalScore >= 70) {
    category = "ДУЖЕ ВИСОКИЙ";
    recommendation = "Дуже привабливо для інвесторів. Будівництво настійно рекомендується.";
  } else if (totalScore >= 55) {
    category = "ВИСОКИЙ";
    recommendation = "Хороший потенціал. Рекомендується детальний аналіз локацій.";
  } else if (totalScore >= 40) {
    category = "СЕРЕДНІЙ";
    recommendation = "Обмежений потенціал. Можливе точкове будівництво.";
  } else {
    category = "НИЗЬКИЙ";
    recommendation = "Низький попит або перенасичений ринок. Будівництво ризиковане.";
  }

  return {
    region: regionName,
    totalScore: Math.round(totalScore * 10) / 10,
    demandScore: Math.round(demandScore * 10) / 10,
    pfzScore: Math.round(pfzScore * 10) / 10,
    natureScore: Math.round(natureScore * 10) / 10,
    accessibilityScore: Math.round(accessibilityScore * 10) / 10,
    infrastructureScore: Math.round(infraScore * 10) / 10,
    saturationPenalty: Math.round(saturationPenalty * 10) / 10,
    category,
    recommendation,
    details: {
      population: { total: population, area_km2: area, annualDemand, annualSupply, supplyDemandRatio, gap },
      density: density.toFixed(2),
      forestCoverage,
      hasWater: populationData.has_water_bodies,
      internationalRoads,
      airports: transport.airports || 0
    }
  };
};

export const getCategoryColor = (category) => {
  switch (category) {
    case 'ВИНЯТКОВИЙ': return '#22c55e';
    case 'ДУЖЕ ВИСОКИЙ': return '#84cc16';
    case 'ВИСОКИЙ': return '#eab308';
    case 'СЕРЕДНІЙ': return '#f97316';
    case 'НИЗЬКИЙ': return '#ef4444';
    default: return '#6b7280';
  }
};

export const getScoreColor = (score) => {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#84cc16';
  if (score >= 55) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
};
