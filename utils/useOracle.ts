import * as Location from 'expo-location';
import { analyzeCrop, analyzeAnimal, FactSheet } from '@terra-oracle/terra-oracle';
import { generateAgriAdvice } from './gemini';

export interface OracleResponse extends FactSheet {
  aiAdvice?: string;
}

export const useOracle = () => {
  
  const analyzeWithLocation = async (
    type: 'CROP' | 'ANIMAL', 
    name: string,
    options: { includeSeasonal?: boolean; includeHistory?: boolean; manualCoords?: { lat: number; lon: number } } = {}
  ): Promise<OracleResponse> => {
    
    let finalLat: number;
    let finalLon: number;
    let cityName = "Manual";
    let countryName = "Manual";

    if (options.manualCoords) {
      finalLat = options.manualCoords.lat;
      finalLon = options.manualCoords.lon;
    } else {
      // 1. Get native GPS from the phone
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Not authorized to use location services. Please enable them in your phone settings.');
      }
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      finalLat = coords.latitude;
      finalLon = coords.longitude;

      // 2. Get the actual City/Country name using the Phone's Native Geocoder
      const [address] = await Location.reverseGeocodeAsync({
          latitude: finalLat,
          longitude: finalLon
      });
      cityName = address?.city || address?.region || "Detected City";
      countryName = address?.country || "Nigeria";
    }

    // 3. Call the SDK with the native coordinates
    let factSheet: FactSheet;
    
    if (type === 'CROP') {
      factSheet = await analyzeCrop(name, {
        lat: finalLat,
        lon: finalLon
      }, {
        includeSeasonal: options.includeSeasonal,
        includeHistory: options.includeHistory,
        includeForecast: true
      });
    } else {
      factSheet = await analyzeAnimal(name, {
        lat: finalLat,
        lon: finalLon
      }, {
        includeSeasonal: options.includeSeasonal,
        includeHistory: options.includeHistory,
        includeForecast: true
      });
    }

    // 4. SOLUTION: Patch the Fact Sheet with the native location names
    // This injects the correct "Port Harcourt" names into the JSON
    if (factSheet.environmental_snapshot) {
        factSheet.environmental_snapshot.location = `${cityName}, ${countryName}`;
        factSheet.environmental_snapshot.city = cityName;
        factSheet.environmental_snapshot.country = countryName;
    }

    // 5. NEW: Generate AI Advisory
    const advice = await generateAgriAdvice(factSheet, type);

    return {
        ...factSheet,
        aiAdvice: advice
    };
  };

  return { analyzeWithLocation };
};
