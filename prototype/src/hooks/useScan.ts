"use client";
import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { compressImage } from "@/lib/image-compression";
import { fetchWithRetry, getUserFriendlyError } from "@/lib/fetch-with-retry";

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
  color: "green" | "amber" | "red";
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
  breakdown: Array<{trait: string; score: number; factor: number; reason: string}>;
}

export interface UseScanReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isAnalysing: boolean;
  analysisResult: AnalysisResult | null;
  previewUrl: string | null;
  error: string | null;
  psychologyCost: PsychologyCost | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureAndAnalyse: () => Promise<AnalysisResult | null>;
  uploadAndAnalyse: (file: File) => Promise<AnalysisResult | null>;
  clearResult: () => void;
  fetchPsychologyCost: (basePrice: number) => Promise<PsychologyCost | null>;
  resetScanState: () => void;
  getPreviewUrl: () => string | null;
}

export function useScan(baseUrl = "/api"): UseScanReturn {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [psychologyCost, setPsychologyCost] = useState<PsychologyCost | null>(null);
  // Session ID for Langfuse tracing continuity
  const sessionIdRef = useRef<string>(`scan_${Date.now()}`);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      setError("Camera access denied");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Use a ref to track the current preview URL synchronously
  const previewUrlRef = useRef<string | null>(null);

  const toBase64AndAnalyse = useCallback(async (dataUrl: string): Promise<AnalysisResult | null> => {
    setIsAnalysing(true);
    setError(null);
    setPreviewUrl(dataUrl);
    previewUrlRef.current = dataUrl; // Set ref synchronously for immediate access
    try {
      // Compress image before sending to API
      const compressionResult = await compressImage(dataUrl, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.85,
        mimeType: 'image/jpeg'
      });

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Fincore] Image compressed: ${(compressionResult.originalSize/1024).toFixed(1)}KB → ${(compressionResult.compressedSize/1024).toFixed(1)}KB (${compressionResult.compressionRatio.toFixed(1)}x)`);
      }

      const compressedDataUrl = compressionResult.dataUrl;
      const [header, b64] = compressedDataUrl.split(",");
      const mediaType = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
      const res = await fetchWithRetry(`${baseUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: b64,
          media_type: mediaType,
          user_id: user?.id,
          session_id: sessionIdRef.current,
        }),
        timeout: 30000, // 30s for image analysis (Bedrock can be slow)
        retries: 2,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Analysis failed");

      // Fire-and-forget S3 upload for persistence (don't block UI)
      if (data.scan_id && user?.id) {
        fetch(`${baseUrl}/upload-scan-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_base64: b64,
            user_id: user.id,
            scan_id: data.scan_id
          }),
        }).catch(() => {
          // S3 upload failed silently - local DataURL is still available
        });
      }

      const result = { ...data.analysis, scan_id: data.scan_id };
      setAnalysisResult(result);
      return result;
    } catch (e) {
      setError(getUserFriendlyError(e));
      return null;
    } finally {
      setIsAnalysing(false);
    }
  }, [baseUrl, user?.id]);

  const captureAndAnalyse = useCallback(async (): Promise<AnalysisResult | null> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    // Capture at full resolution - compression will handle resizing
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")?.drawImage(video, 0, 0, w, h);

    // Use PNG for initial capture to preserve quality, compression utility will convert to JPEG
    const dataUrl = canvas.toDataURL("image/png");

    // Stop camera immediately after capture to release hardware resources
    stopCamera();

    // toBase64AndAnalyse will handle compression via compressImage utility
    return toBase64AndAnalyse(dataUrl);
  }, [toBase64AndAnalyse, stopCamera]);

  const uploadAndAnalyse = useCallback(async (file: File): Promise<AnalysisResult | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        resolve(toBase64AndAnalyse(dataUrl));
      };
      reader.readAsDataURL(file);
    });
  }, [toBase64AndAnalyse]);

  const clearResult = useCallback(() => {
    setAnalysisResult(null);
    setPreviewUrl(null);
    previewUrlRef.current = null;
    setError(null);
    setPsychologyCost(null);
  }, []);

  const resetScanState = useCallback(() => {
    setPreviewUrl(null);
    previewUrlRef.current = null;
    setAnalysisResult(null);
    setError(null);
    setPsychologyCost(null);
  }, []);

  const fetchPsychologyCost = useCallback(async (basePrice: number): Promise<PsychologyCost | null> => {
    if (!user?.id) return null;
    try {
      const res = await fetchWithRetry(`${baseUrl}/psychology-cost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, base_price: basePrice }),
        timeout: 15000,
        retries: 2,
      });
      if (!res.ok) return null;
      const data = await res.json();
      setPsychologyCost(data);
      return data;
    } catch {
      return null;
    }
  }, [baseUrl, user?.id]);

  // Getter for synchronous access to preview URL (bypasses React state timing)
  const getPreviewUrl = useCallback(() => previewUrlRef.current, []);

  return { videoRef, canvasRef, isAnalysing, analysisResult, previewUrl, error, psychologyCost, startCamera, stopCamera, captureAndAnalyse, uploadAndAnalyse, clearResult, fetchPsychologyCost, resetScanState, getPreviewUrl };
}
