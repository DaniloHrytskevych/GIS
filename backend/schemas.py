"""
Pydantic schemas for data validation
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any


# ===== Population Data Schemas =====
class RegionPopulationData(BaseModel):
    name: str
    population: int
    area_km2: float
    density_per_km2: Optional[float] = None
    forest_coverage_percent: float
    has_water_bodies: bool

class PopulationDataSchema(BaseModel):
    ukraine_regions_data: List[RegionPopulationData]
    
    @field_validator('ukraine_regions_data')
    @classmethod
    def validate_regions_count(cls, v):
        if len(v) != 24:
            raise ValueError(f"Expected 24 regions, got {len(v)}")
        return v


# ===== Infrastructure Data Schemas =====
class MainRoad(BaseModel):
    name: str
    type: str
    quality: Optional[str] = "добра"

class TransportAccessibility(BaseModel):
    accessibility_score: float
    highway_density_km_per_1000km2: float
    main_roads: List[MainRoad]
    railway_stations: int
    airports: int
    average_travel_time_to_major_city_minutes: int

class AnthropogenicInfrastructure(BaseModel):
    hospitals_per_100k: float
    hospitals_total: Optional[int] = 0
    gas_stations_per_100km2: float
    gas_stations: Optional[int] = 0
    mobile_coverage_percent: float
    internet_coverage_percent: float
    hotels_total: int
    restaurants_cafes: Optional[int] = 0
    electricity_reliability: str
    water_supply_quality: Optional[str] = ""

class RegionInfrastructure(BaseModel):
    region: str
    transport_accessibility: TransportAccessibility
    anthropogenic_infrastructure: AnthropogenicInfrastructure

class InfrastructureDataSchema(BaseModel):
    ukraine_infrastructure: Dict[str, List[RegionInfrastructure]]
    
    @field_validator('ukraine_infrastructure')
    @classmethod
    def validate_has_regions(cls, v):
        if 'regions' not in v:
            raise ValueError("Missing 'regions' key")
        if len(v['regions']) != 24:
            raise ValueError(f"Expected 24 regions in infrastructure, got {len(v['regions'])}")
        return v


# ===== Protected Areas Schemas =====
class ProtectedAreasCounts(BaseModel):
    national_parks: int
    nature_reserves: int
    regional_landscape_parks: int
    zakazniks: int
    monuments_of_nature: int
    percent_of_region: float

class RegionProtectedAreas(BaseModel):
    region: str
    protected_areas: ProtectedAreasCounts
    pfz_score: float
    notable_objects: List[str]
    recreational_value: str

class ProtectedAreasSchema(BaseModel):
    ukraine_protected_areas: Dict[str, List[RegionProtectedAreas]]
    
    @field_validator('ukraine_protected_areas')
    @classmethod
    def validate_has_regions(cls, v):
        if 'regions' not in v:
            raise ValueError("Missing 'regions' key")
        if len(v['regions']) != 24:
            raise ValueError(f"Expected 24 regions in protected areas, got {len(v['regions'])}")
        return v


# ===== Recreational Points Schema (GeoJSON) =====
class RecreationalPointGeometry(BaseModel):
    type: str
    coordinates: List[float]
    
    @field_validator('coordinates')
    @classmethod
    def validate_coordinates(cls, v):
        if len(v) != 2:
            raise ValueError("Coordinates must have [lng, lat]")
        lng, lat = v
        if not (21.5 <= lng <= 40.5):
            raise ValueError(f"Longitude {lng} out of Ukraine bounds")
        if not (44.0 <= lat <= 52.5):
            raise ValueError(f"Latitude {lat} out of Ukraine bounds")
        return v

class RecreationalPointProperties(BaseModel):
    name: str
    region: str
    type: str
    capacity: Optional[Any] = None  # Can be string or int
    has_restaurant: Optional[bool] = None
    has_hotel: Optional[bool] = None

class RecreationalPointFeature(BaseModel):
    type: str
    geometry: RecreationalPointGeometry
    properties: RecreationalPointProperties

class RecreationalPointsSchema(BaseModel):
    type: str
    features: List[RecreationalPointFeature]
    
    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        if v != "FeatureCollection":
            raise ValueError(f"Expected type 'FeatureCollection', got '{v}'")
        return v
    
    @field_validator('features')
    @classmethod
    def validate_features_count(cls, v):
        if len(v) == 0:
            raise ValueError("Features list cannot be empty")
        return v


# ===== Forest Fires Schema (GeoJSON) =====
class FireGeometry(BaseModel):
    type: str
    coordinates: List[float]
    
    @field_validator('coordinates')
    @classmethod
    def validate_coordinates(cls, v):
        if len(v) != 2:
            raise ValueError("Coordinates must have [lng, lat]")
        lng, lat = v
        if not (21.5 <= lng <= 40.5):
            raise ValueError(f"Longitude {lng} out of Ukraine bounds")
        if not (44.0 <= lat <= 52.5):
            raise ValueError(f"Latitude {lat} out of Ukraine bounds")
        return v

class FireProperties(BaseModel):
    name: str
    region: str
    area_ha: float
    date: str
    cause_type: str
    cause: str
    description: str
    
    @field_validator('cause_type')
    @classmethod
    def validate_cause_type(cls, v):
        if v not in ["людський фактор", "природні причини"]:
            raise ValueError(f"Invalid cause_type: {v}")
        return v

class FireFeature(BaseModel):
    type: str
    geometry: FireGeometry
    properties: FireProperties

class FireMetadata(BaseModel):
    total_fires: int
    human_caused: int
    other_causes: int
    year: int
    regions: List[str]
    note: str

class ForestFiresSchema(BaseModel):
    type: str
    metadata: FireMetadata
    features: List[FireFeature]
    
    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        if v != "FeatureCollection":
            raise ValueError(f"Expected type 'FeatureCollection', got '{v}'")
        return v
    
    @field_validator('features')
    @classmethod
    def validate_features_count(cls, v):
        if len(v) == 0:
            raise ValueError("Features list cannot be empty")
        return v
