import { useState, useRef, useCallback } from 'react';
import { CameraView } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { apiPost } from '../lib/api';
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
  analyseFromText: (productDescription: string) => Promise<AnalysisResult | null>;
  clearResult: () => void;
  fetchPsychologyCost: (basePrice: number) => Promise<PsychologyCost | null>;
  resetScanState: () => void;
  loadFromHistory: (result: AnalysisResult) => void;
}

interface AnalyzeResponse {
  success: boolean;
  analysis?: AnalysisResult;
  scan_id?: string;
  error?: string;
}

async function compressImage(uri: string): Promise<{ base64: string; uri: string }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return { base64: result.base64 || '', uri: result.uri };
}

export function useScan({ userId }: UseScanOptions = {}): UseScanReturn {
  const cameraRef = useRef<CameraView | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [psychologyCost, setPsychologyCost] = useState<PsychologyCost | null>(null);

  const resetState = useCallback(() => {
    setAnalysisResult(null);
    setPreviewUri(null);
    setError(null);
    setPsychologyCost(null);
  }, []);

  const analyseImage = useCallback(
    async (base64: string, localUri: string): Promise<AnalysisResult | null> => {
      setIsAnalysing(true);
      setError(null);
      setPreviewUri(localUri);

      try {
        const { data, error: fetchError } = await apiPost<AnalyzeResponse>('/analyze', {
          image_base64: base64,
          media_type: 'image/jpeg',
          user_id: userId,
        });

        if (fetchError || !data?.success) {
          throw new Error(fetchError || data?.error || 'Analysis failed');
        }

        const result = { ...data.analysis!, scan_id: data.scan_id };
        setAnalysisResult(result);

        if (data.scan_id && userId) {
          apiPost('/upload-scan-image', {
            image_base64: base64,
            user_id: userId,
            scan_id: data.scan_id,
          }).catch(() => {});
        }

        return result;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Analysis failed';
        setError(message);
        return null;
      } finally {
        setIsAnalysing(false);
      }
    },
    [userId]
  );

  const captureAndAnalyse = useCallback(async (): Promise<AnalysisResult | null> => {
    if (!cameraRef.current) return null;

    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: false });
      if (!photo?.uri) {
        setError('Failed to capture photo');
        return null;
      }

      const compressed = await compressImage(photo.uri);
      return analyseImage(compressed.base64, compressed.uri);
    } catch (e) {
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

  const analyseFromText = useCallback(
    async (productDescription: string): Promise<AnalysisResult | null> => {
      if (!productDescription.trim()) return null;

      setIsAnalysing(true);
      setError(null);
      setPreviewUri(null);

      try {
        const { data, error: fetchError } = await apiPost<AnalyzeResponse>('/analyze-text', {
          product_description: productDescription,
          user_id: userId,
        });

        if (fetchError || !data?.success) {
          throw new Error(fetchError || data?.error || 'Analysis failed');
        }

        const result = { ...data.analysis!, scan_id: data.scan_id };
        setAnalysisResult(result);
        return result;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Analysis failed';
        setError(message);
        return null;
      } finally {
        setIsAnalysing(false);
      }
    },
    [userId]
  );

  const loadFromHistory = useCallback((result: AnalysisResult) => {
    setAnalysisResult(result);
    setPreviewUri(result.image_url || null);
    setError(null);
  }, []);

  const fetchPsychologyCost = useCallback(
    async (basePrice: number): Promise<PsychologyCost | null> => {
      const { data } = await apiPost<PsychologyCost>('/psychology-cost', {
        user_id: userId,
        base_price: basePrice,
      });

      if (data) {
        setPsychologyCost(data);
      }
      return data;
    },
    [userId]
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
    analyseFromText,
    clearResult: resetState,
    fetchPsychologyCost,
    resetScanState: resetState,
    loadFromHistory,
  };
}
