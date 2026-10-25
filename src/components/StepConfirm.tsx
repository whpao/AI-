import React, { useState } from 'react';
import { RecognitionResult } from '../data/types.ts';
import { TopicType } from './StepQuestion.tsx';
import {
  Check,
  RotateCcw,
  Edit2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface StepConfirmProps {
  recognition: RecognitionResult;
  handwritingImage?: string;
  topic: TopicType;
  question: string;
  onConfirmCharacter: (character: string) => void;
  onBackToHandwriting: () => void;
  isDivining: boolean;
}

export const StepConfirm: React.FC<StepConfirmProps> = ({
  recognition,
  handwritingImage,
  topic,
  question,
  onConfirmCharacter,
  onBackToHandwriting,
  isDivining,
}) => {
  // Current chosen character (defaults to primary, or first candidate)
  const [selectedChar, setSelectedChar] = useState<string>(
    recognition.primary_character ||
      (recognition.candidates && recognition.candidates[0]) ||
      ''
  );
  const [isEditingManually, setIsEditingManually] = useState(false);
  const [manualInput, setManualInput] = useState(selectedChar);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Is recognition dubious?
  const isDubious =
    recognition.needs_rewrite ||
    !recognition.has_text ||
    !recognition.is_single_chinese_character ||
    !selectedChar;

  const handleSelectCandidate = (char: string) => {
    setSelectedChar(char);
    setManualInput(char);
    setIsEditingManually(false);
    setConfirmError(null);
  };

  const handleManualSave = () => {
    const trimmed = manualInput.trim();
    if (!trimmed) {
      setConfirmError('請輸入一個中文字');
      return;
    }
    setSelectedChar(trimmed.slice(0, 1));
    setIsEditingManually(false);
    setConfirmError(null);
  };

  const handleProceed = () => {
    const finalChar = selectedChar.trim();
    if (!finalChar) {
      setConfirmError('請先確認或手動輸入欲測的一個中文字');
      return;
    }
    onConfirmCharacter(finalChar);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Title */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFECE4] border border-[#DDD6C8] text-[#8C3227] text-xs font-serif mb-2">
          <Sparkles className="w-3 h-3" />
          <span>第三步・辨識確認</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1C19]">
          確認您所寫的字
        </h2>
        <p className="mt-1 text-base text-[#6E675A] font-serif">
          依古籍法度，測字必先明確字形，請確認此字是否相符。
        </p>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border-2 border-[#DCD5C7] p-6 shadow-sm mb-6">
        {/* Handwriting thumbnail & AI question */}
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-center py-2">
          {handwritingImage && (
            <div className="flex flex-col items-center">
              <span className="text-xs font-serif text-[#8A8274] mb-1.5">
                您的手寫字跡
              </span>
              <div className="w-28 h-28 rounded-xl border border-[#D5CEC1] overflow-hidden bg-white shadow-2xs p-1">
                <img
                  src={handwritingImage}
                  alt="手寫字跡"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col items-center text-center">
            <span className="text-sm font-serif text-[#787163] mb-1">
              辨識結果
            </span>
            {selectedChar && !isEditingManually ? (
              <div className="text-lg font-serif text-[#292620]">
                你寫的是
                <span className="inline-block mx-2 text-5xl sm:text-6xl font-serif font-black text-[#B9382C] px-3 py-1 bg-[#FFF8F6] border-2 border-[#B9382C]/30 rounded-2xl shadow-xs">
                  {selectedChar}
                </span>
                嗎？
              </div>
            ) : isEditingManually ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-serif text-[#666054]">
                  手動輸入正確中文字：
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={1}
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="w-16 h-16 text-center text-3xl font-serif font-bold border-2 border-[#B9382C] rounded-xl bg-[#FFF8F6] focus:outline-hidden"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleManualSave}
                    className="px-3 py-2 bg-[#B9382C] text-white text-sm font-serif rounded-lg cursor-pointer"
                  >
                    確定
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-base font-serif text-[#9E2A2B] bg-[#FFF2F0] p-3 rounded-xl border border-[#F5C2BE]">
                字跡未能明確判定，請由下方候選字挑選或手動修改。
              </div>
            )}
          </div>
        </div>

        {/* Simplified / Variant character hint */}
        {recognition.is_simplified_or_variant && (
          <div className="mt-4 p-3 bg-[#FAF5EB] border border-[#E8DEC7] rounded-xl text-sm font-serif text-[#6D6352] flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-[#C47D15] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#8A5B10]">繁簡 / 異體字提示：</p>
              <p>{recognition.variant_note || '偵測到輸入字為簡體或異體字，可選擇對應之繁體字進行測字，或保留原字。'}</p>
            </div>
          </div>
        )}

        {/* Warning if AI flags needs rewrite or non-character */}
        {isDubious && (
          <div className="mt-4 p-3 bg-[#FFF5F2] border border-[#F2C7BF] rounded-xl text-sm font-serif text-[#912F24] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#B9382C] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">辨識提示：</p>
              <p>
                {recognition.reason ||
                  '筆劃較為凌亂或非單一中文字，建議確認選字或返回重新書寫，不直接盲猜解字。'}
              </p>
            </div>
          </div>
        )}

        {/* Candidates selection */}
        {recognition.candidates && recognition.candidates.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[#EAE4D8]">
            <p className="text-sm font-serif text-[#787163] mb-2.5">
              其他相近候選字（點擊選取）：
            </p>
            <div className="flex flex-wrap gap-2.5">
              {recognition.candidates.map((cand, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectCandidate(cand)}
                  className={`min-h-[46px] min-w-[50px] px-3.5 py-1.5 rounded-xl font-serif text-xl border-2 transition-all cursor-pointer ${
                    selectedChar === cand
                      ? 'border-[#B9382C] bg-[#FFF8F6] text-[#B9382C] font-bold shadow-xs'
                      : 'border-[#DDD7CC] bg-white text-[#38332B] hover:border-[#CDC5B6]'
                  }`}
                >
                  {cand}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Manual edit trigger */}
        {!isEditingManually && (
          <div className="mt-4 pt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setManualInput(selectedChar);
                setIsEditingManually(true);
              }}
              className="text-sm font-serif text-[#686052] hover:text-[#B9382C] flex items-center gap-1 cursor-pointer hover:underline"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>不是這些字？點此手動改字</span>
            </button>
          </div>
        )}
      </div>

      {/* Confirmation error notice */}
      {confirmError && (
        <div className="mb-4 p-3 bg-[#FFF2F0] border border-[#F5C2BE] text-[#9E2A2B] rounded-xl text-sm font-serif">
          {confirmError}
        </div>
      )}

      {/* Action buttons (≥ 48px touch targets) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onBackToHandwriting}
          disabled={isDivining}
          className="min-h-[50px] rounded-xl border border-[#D5CFC3] bg-white text-[#4A453E] hover:bg-[#F5F2EB] font-serif text-base flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
        >
          <RotateCcw className="w-4 h-4" />
          <span>返回重寫</span>
        </button>

        <button
          type="button"
          onClick={handleProceed}
          disabled={!selectedChar || isDivining}
          className="min-h-[50px] rounded-xl bg-[#B9382C] hover:bg-[#A32F24] disabled:opacity-40 disabled:cursor-not-allowed text-white font-serif font-bold text-base flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-[0.99]"
        >
          {isDivining ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              正在依古籍測字...
            </span>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>確認「{selectedChar || '此字'}」，開始測字</span>
            </>
          )}
        </button>
      </div>

      {/* Reminder */}
      <p className="text-center text-xs text-[#91897C] font-serif mt-4">
        確認此字後，系統將整合《測字秘牒》與《字觸》之分析規則進行嚴謹推衍。
      </p>
    </div>
  );
};
