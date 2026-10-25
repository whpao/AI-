/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { StepQuestion, TopicType } from './components/StepQuestion.tsx';
import { StepHandwriting } from './components/StepHandwriting.tsx';
import { StepConfirm } from './components/StepConfirm.tsx';
import { StepResult } from './components/StepResult.tsx';
import { SourcesModal } from './components/SourcesModal.tsx';
import { DivinationResult, RecognitionResult } from './data/types.ts';
import {
  BookOpen,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

type Step = 'question' | 'handwriting' | 'confirm' | 'result';

export default function App() {
  const [step, setStep] = useState<Step>('question');
  const [topic, setTopic] = useState<TopicType>('生活');
  const [question, setQuestion] = useState<string>('');
  const [handwritingImage, setHandwritingImage] = useState<string | null>(null);

  const [recognition, setRecognition] = useState<RecognitionResult | null>(null);
  const [confirmedCharacter, setConfirmedCharacter] = useState<string>('');
  const [divinationResult, setDivinationResult] = useState<DivinationResult | null>(null);

  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isDivining, setIsDivining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [showTypingModalInHandwriting, setShowTypingModalInHandwriting] = useState(false);

  const [apiHealth, setApiHealth] = useState<{
    checked: boolean;
    hasApiKey: boolean;
    message?: string;
  }>({
    checked: false,
    hasApiKey: true,
  });

  // Check health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setApiHealth({
          checked: true,
          hasApiKey: Boolean(data.hasApiKey),
          message: data.message,
        });
      })
      .catch(() => {
        setApiHealth({
          checked: true,
          hasApiKey: true, // Optimistically assume server proxy works
        });
      });
  }, []);

  // Step 1 -> Step 2
  const handleProceedToHandwriting = (chosenTopic: TopicType, chosenQuestion: string) => {
    setTopic(chosenTopic);
    setQuestion(chosenQuestion);
    setErrorMessage(null);
    setStep('handwriting');
  };

  const [spatialFeatures, setSpatialFeatures] = useState<any>(null);
  const recognizeAbortControllerRef = useRef<AbortController | null>(null);

  const cancelRecognition = () => {
    if (recognizeAbortControllerRef.current) {
      recognizeAbortControllerRef.current.abort();
      recognizeAbortControllerRef.current = null;
    }
    setIsRecognizing(false);
  };

  // Step 2: Handle handwriting submit -> call OCR /api/recognize with 11s timeout
  const handleHandwritingSubmit = async (imageBase64: string, spatial?: any) => {
    // Abort any existing in-flight recognition
    if (recognizeAbortControllerRef.current) {
      recognizeAbortControllerRef.current.abort();
    }

    const controller = new AbortController();
    recognizeAbortControllerRef.current = controller;

    setIsRecognizing(true);
    setErrorMessage(null);
    setHandwritingImage(imageBase64);
    if (spatial) {
      setSpatialFeatures(spatial);
    }

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 11000);

    try {
      const response = await fetch('/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '文字辨識服務連線失敗。');
      }

      setRecognition(data);
      setConfirmedCharacter(data.primary_character || '');
      setStep('confirm');
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      const msg = isAbort
        ? '字跡辨識等候逾時（網路或伺服器回應較久）。您可以再點一次「寫好了」重試，或直接改用「打字輸入」！'
        : (err instanceof Error ? err.message : String(err));
      setErrorMessage(msg);
    } finally {
      setIsRecognizing(false);
      recognizeAbortControllerRef.current = null;
    }
  };

  // Direct typed alternative from Step 2
  const handleDirectTypedSubmit = (character: string) => {
    cancelRecognition();
    setErrorMessage(null);
    setHandwritingImage(null);
    setSpatialFeatures(null);
    setRecognition({
      has_text: true,
      is_single_chinese_character: true,
      primary_character: character,
      candidates: [character],
      needs_rewrite: false,
      reason: '使用者鍵盤直接輸入確認',
    });
    setConfirmedCharacter(character);
    setStep('confirm');
  };

  // Step 3 -> Step 4/5: Call /api/divine with 24s timeout
  const handleConfirmAndDivine = async (finalCharacter: string) => {
    setIsDivining(true);
    setErrorMessage(null);
    setConfirmedCharacter(finalCharacter);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 24000);

    try {
      const response = await fetch('/api/divine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: finalCharacter,
          topic,
          question,
          isHandwritten: Boolean(handwritingImage),
          spatialFeatures,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '測字分析服務連線失敗。');
      }

      setDivinationResult(data);
      setStep('result');
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      const msg = isAbort
        ? '測字分析連線等候逾時。您的題目與文字已妥善保存，請點擊下方重試，或稍候片刻再試。'
        : (err instanceof Error ? err.message : String(err));
      setErrorMessage(`測字分析失敗：${msg}`);
    } finally {
      setIsDivining(false);
    }
  };

  // Restart completely
  const handleRestart = () => {
    setStep('question');
    setQuestion('');
    setHandwritingImage(null);
    setSpatialFeatures(null);
    setRecognition(null);
    setConfirmedCharacter('');
    setDivinationResult(null);
    setErrorMessage(null);
  };

  // Modify question while keeping character
  const handleModifyQuestion = () => {
    setStep('question');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#22211F] flex flex-col font-serif selection:bg-[#B9382C]/20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E2D5] px-4 py-3.5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div
            onClick={handleRestart}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {/* Seal emblem */}
            <div className="w-8 h-8 rounded-lg bg-[#B9382C] text-white flex items-center justify-center font-serif font-black text-base shadow-xs group-hover:scale-105 transition-transform">
              問
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold text-[#1C1A17] tracking-wider leading-none">
                一字問心
              </h1>
              <span className="text-[11px] font-serif text-[#8A8274] tracking-widest block mt-0.5">
                AI 測字館・古籍依據
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSourcesModalOpen(true)}
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#DDD6C8] bg-white text-[#554F43] hover:text-[#B9382C] hover:border-[#B9382C] text-xs font-serif flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#B9382C]" />
              <span>古籍文獻庫</span>
            </button>
          </div>
        </div>
      </header>

      {/* API Key Missing Alert if applicable */}
      {apiHealth.checked && !apiHealth.hasApiKey && (
        <div className="bg-[#FFF4E5] border-b border-[#FFE0B2] px-4 py-2.5 text-xs text-[#8F4B00] font-serif text-center flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {apiHealth.message ||
              '提示：尚未偵測到 GEMINI_API_KEY。請於 Settings > Secrets 設定金鑰以啟用即時辨識與解讀。'}
          </span>
        </div>
      )}

      {/* Step Indicator Bar */}
      <div className="max-w-xl mx-auto w-full px-4 pt-4 pb-2">
        <div className="flex items-center justify-between text-xs font-serif text-[#7A7366] px-2">
          <div
            className={`flex items-center gap-1 ${
              step === 'question' ? 'text-[#B9382C] font-bold' : ''
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 'question'
                  ? 'bg-[#B9382C] text-white'
                  : 'bg-[#EAE4D8] text-[#635D50]'
              }`}
            >
              1
            </span>
            <span>問一件事</span>
          </div>
          <span className="text-[#D8D2C5]">─</span>
          <div
            className={`flex items-center gap-1 ${
              step === 'handwriting' ? 'text-[#B9382C] font-bold' : ''
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 'handwriting'
                  ? 'bg-[#B9382C] text-white'
                  : 'bg-[#EAE4D8] text-[#635D50]'
              }`}
            >
              2
            </span>
            <span>手指寫字</span>
          </div>
          <span className="text-[#D8D2C5]">─</span>
          <div
            className={`flex items-center gap-1 ${
              step === 'confirm' ? 'text-[#B9382C] font-bold' : ''
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 'confirm'
                  ? 'bg-[#B9382C] text-white'
                  : 'bg-[#EAE4D8] text-[#635D50]'
              }`}
            >
              3
            </span>
            <span>辨識確認</span>
          </div>
          <span className="text-[#D8D2C5]">─</span>
          <div
            className={`flex items-center gap-1 ${
              step === 'result' ? 'text-[#B9382C] font-bold' : ''
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 'result'
                  ? 'bg-[#B9382C] text-white'
                  : 'bg-[#EAE4D8] text-[#635D50]'
              }`}
            >
              4
            </span>
            <span>閱讀結果</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl mx-auto w-full p-4 sm:p-5 flex flex-col justify-start">
        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-5 p-4 bg-[#FFF2F0] border-2 border-[#F5C2BE] text-[#9E2A2B] rounded-2xl text-base font-serif shadow-xs">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-[#B9382C] shrink-0 mt-0.5" />
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-xs underline ml-2 shrink-0 cursor-pointer text-[#8C281F]"
              >
                關閉
              </button>
            </div>

            {/* Quick recovery actions when on handwriting step */}
            {step === 'handwriting' && (
              <div className="mt-3 pt-3 border-t border-[#F5D0CC] flex flex-wrap gap-2 justify-end">
                {handwritingImage && (
                  <button
                    type="button"
                    onClick={() => handleHandwritingSubmit(handwritingImage)}
                    disabled={isRecognizing}
                    className="min-h-[38px] px-3 py-1.5 bg-white border border-[#F2C0B8] rounded-xl text-xs font-serif font-bold text-[#8C281F] hover:bg-[#FFF8F6] cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>重新辨識</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setShowTypingModalInHandwriting(true);
                  }}
                  className="min-h-[38px] px-3.5 py-1.5 bg-[#B9382C] text-white rounded-xl text-xs font-serif font-bold hover:bg-[#A32F24] cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <span>立即改用打字輸入</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Divining Overlay / Transition state */}
        {isDivining && (
          <div className="my-auto py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-[#FFFBF8] border-2 border-[#B9382C] flex items-center justify-center shadow-md animate-pulse">
                <span className="text-4xl font-serif font-black text-[#B9382C]">
                  {confirmedCharacter || '字'}
                </span>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#B9382C] rounded-full animate-ping" />
            </div>

            <div className="space-y-1.5 max-w-xs">
              <h3 className="text-xl font-serif font-bold text-[#23201C]">
                正在推衍字形理路...
              </h3>
              <p className="text-sm font-serif text-[#787163]">
                細探漢字結構筆劃與離合之趣，為您整理生活深層省思。
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#8A8274] font-serif pt-2">
              <span className="w-2 h-2 rounded-full bg-[#3E7C59] animate-pulse" />
              <span>進行嚴格來源比對與文字關係核驗</span>
            </div>
          </div>
        )}

        {/* Step 1: Question */}
        {!isDivining && step === 'question' && (
          <StepQuestion
            initialTopic={topic}
            initialQuestion={question}
            onProceed={handleProceedToHandwriting}
          />
        )}

        {/* Step 2: Handwriting */}
        {!isDivining && step === 'handwriting' && (
          <StepHandwriting
            topic={topic}
            question={question}
            onBack={() => setStep('question')}
            onHandwritingSubmit={handleHandwritingSubmit}
            onDirectTypedSubmit={handleDirectTypedSubmit}
            isRecognizing={isRecognizing}
            onCancelRecognition={cancelRecognition}
            externalShowTypingModal={showTypingModalInHandwriting}
            onCloseExternalTypingModal={() => setShowTypingModalInHandwriting(false)}
          />
        )}

        {/* Step 3: Confirmation */}
        {!isDivining && step === 'confirm' && recognition && (
          <StepConfirm
            recognition={recognition}
            handwritingImage={handwritingImage || undefined}
            topic={topic}
            question={question}
            onConfirmCharacter={handleConfirmAndDivine}
            onBackToHandwriting={() => setStep('handwriting')}
            isDivining={isDivining}
          />
        )}

        {/* Step 4/5: Result */}
        {!isDivining && step === 'result' && divinationResult && (
          <StepResult
            result={divinationResult}
            onRestart={handleRestart}
            onModifyQuestion={handleModifyQuestion}
          />
        )}
      </main>

      {/* Ancient Sources Modal */}
      <SourcesModal
        isOpen={isSourcesModalOpen}
        onClose={() => setIsSourcesModalOpen(false)}
      />
    </div>
  );
}
