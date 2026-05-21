import { useState, useRef, useCallback } from 'react';
import { CameraView } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { API_BASE_URL } from '../config';

export interface AnalysisBreakdown {
  value_for_money: number;
  necessity: number;
  budget_impact: number;
}

export interface AnalysisResult {
  product_identified: string;
  product_name?: string;
  product_brand?: string;
  product_volume?: string;
  product_barcode?: string;
  product_category?: string;
  overall_score: number;
  grade: string;
  verdict: string;
  color: 'green' | 'amber' | 'red';
  breakdown: AnalysisBreakdown;
  recommendations: string[];
  financial_insight: string;
  alternatives: string[];
  image_url?: string;
  scan_id?: string;
  estimated_price?: number;
}

export interface PsychologyCost {
  base_price: number;
  psychology_cost: number;
  personality_tax_percent: number;
  breakdown: Array<{ trait: string; score: number; factor: number; reason: string }>;
}

export interface UseScanOptions {
  baseUrl?: string;
  userId?: string;
}

export interface UseScanReturn {
  cameraRef: React.RefObject<CameraView | null>;
  isAnalysing: boolean;
  analysisResult: AnalysisResult | null;
  previewUri: string | null;
  error: string | null;
  psychologyCost: PsychologyCost | null;
  captureAndAnalyse: () => Promise<AnalysisResult | null>;
  analyseFromUri: (uri: string) => Promise<AnalysisResult | null>;
  clearResult: () => void;
  fetchPsychologyCost: (basePrice: number) => Promise<PsychologyCost | null>;
  resetScanState: () => void;
  loadFromHistory: (result: AnalysisResult) => void;
}

async function compressImage(uri: string): Promise<{ base64: string; uri: string }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return { base64: result.base64 || '', uri: result.uri };
}

export function useScan({
  baseUrl = API_BASE_URL,
  userId,
}: UseScanOptions = {}): UseScanReturn {
  const cameraRef = useRef<CameraView | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [psychologyCost, setPsychologyCost] = useState<PsychologyCost | null>(null);

  const analyseImage = useCallback(
    async (base64: string, localUri: string): Promise<AnalysisResult | null> => {
      setIsAnalysing(true);
      setError(null);
      setPreviewUri(localUri);

      console.log('[useScan] analyseImage called, baseUrl:', baseUrl);
      try {
        const res = await fetch(`${baseUrl}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_base64: base64,
            media_type: 'image/jpeg',
            user_id: userId,
          }),
        });

        console.log('[useScan] Response status:', res.status);
        if (!res.ok) {
          const text = await res.text();
          console.log('[useScan] Error response:', text);
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        console.log('[useScan] Response data success:', data.success, 'error:', data.error);
        if (!data.success) {
          throw new Error(data.error ?? 'Analysis failed');
        }

        const result = { ...data.analysis, scan_id: data.scan_id };
        setAnalysisResult(result);

        // Upload image to S3 for history
        if (data.scan_id && userId) {
          try {
            await fetch(`${baseUrl}/upload-scan-image`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image_base64: base64,
                user_id: userId,
                scan_id: data.scan_id,
              }),
            });
            console.log('[useScan] Image uploaded for history');
          } catch (uploadErr) {
            console.log('[useScan] Image upload failed (non-critical):', uploadErr);
          }
        }

        return result;
      } catch (e) {
        console.log('[useScan] analyseImage error:', e);
        const message = e instanceof Error ? e.message : 'Analysis failed';
        setError(message);
        return null;
      } finally {
        setIsAnalysing(false);
      }
    },
    [baseUrl, userId]
  );

  const captureAndAnalyse = useCallback(async (): Promise<AnalysisResult | null> => {
    console.log('[useScan] captureAndAnalyse called, cameraRef.current:', !!cameraRef.current);
    if (!cameraRef.current) {
      console.log('[useScan] No camera ref!');
      return null;
    }

    try {
      console.log('[useScan] Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({ base64: false });
      console.log('[useScan] Photo result:', photo ? 'success' : 'null', photo?.uri);
      if (!photo?.uri) {
        setError('Failed to capture photo');
        return null;
      }

      console.log('[useScan] Compressing image...');
      const compressed = await compressImage(photo.uri);
      console.log('[useScan] Sending to backend...');
      return analyseImage(compressed.base64, compressed.uri);
    } catch (e) {
      console.log('[useScan] Capture error:', e);
      const message = e instanceof Error ? e.message : 'Capture failed';
      setError(message);
      return null;
    }
  }, [analyseImage]);

  const analyseFromUri = useCallback(
    async (uri: string): Promise<AnalysisResult | null> => {
      try {
        const compressed = await compressImage(uri);
        return analyseImage(compressed.base64, compressed.uri);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Analysis failed';
        setError(message);
        return null;
      }
    },
    [analyseImage]
  );

  const clearResult = useCallback(() => {
    setAnalysisResult(null);
    setPreviewUri(null);
    setError(null);
    setPsychologyCost(null);
  }, []);

  const resetScanState = useCallback(() => {
    setPreviewUri(null);
    setAnalysisResult(null);
    setError(null);
    setPsychologyCost(null);
  }, []);

  const loadFromHistory = useCallback((result: AnalysisResult) => {
    setAnalysisResult(result);
    setPreviewUri(result.image_url || null);
    setError(null);
  }, []);

  const fetchPsychologyCost = useCallback(
    async (basePrice: number): Promise<PsychologyCost | null> => {
      try {
        const res = await fetch(`${baseUrl}/psychology-cost`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, base_price: basePrice }),
        });

        if (!res.ok) return null;

        const data = await res.json();
        setPsychologyCost(data);
        return data;
      } catch {
        return null;
      }
    },
    [baseUrl, userId]
  );

  return {
    cameraRef,
    isAnalysing,
    analysisResult,
    previewUri,
    error,
    psychologyCost,
    captureAndAnalyse,
    analyseFromUri,
    clearResult,
    fetchPsychologyCost,
    resetScanState,
    loadFromHistory,
  };
}
