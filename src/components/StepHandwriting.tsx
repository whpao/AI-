import React, { useState } from 'react';
import { HandwritingCanvas } from './HandwritingCanvas.tsx';
import { TopicType } from './StepQuestion.tsx';
import { ArrowLeft, Sparkles, X, Check, Keyboard } from 'lucide-react';

interface StepHandwritingProps {
  topic: TopicType;
  question: string;
  onBack: () => void;
  onHandwritingSubmit: (imageBase64: string, spatialFeatures?: any) => void;
  onDirectTypedSubmit: (character: string) => void;
  isRecognizing: boolean;
  onCancelRecognition?: () => void;
  externalShowTypingModal?: boolean;
  onCloseExternalTypingModal?: () => void;
}

export const StepHandwriting: React.FC<StepHandwritingProps> = ({
  topic,
  question,
  onBack,
  onHandwritingSubmit,
  onDirectTypedSubmit,
  isRecognizing,
  onCancelRecognition,
  externalShowTypingModal = false,
  onCloseExternalTypingModal,
}) => {
  const [internalTypingModal, setInternalTypingModal] = useState(false);
  const showTypingModal = externalShowTypingModal || internalTypingModal;
  const setShowTypingModal = (open: boolean) => {
    setInternalTypingModal(open);
    if (!open && onCloseExternalTypingModal) {
      onCloseExternalTypingModal();
    }
  };
  const [typedChar, setTypedChar] = useState('');
  const [typedError, setTypedError] = useState<string | null>(null);

  const handleTypingConfirm = () => {
    const trimmed = typedChar.trim();
    if (!trimmed) {
      setTypedError('請輸入一個中文字。');
      return;
    }
    // Check if single Chinese character
    const isChinese = /^[\u4e00-\u9fa5]$/.test(trimmed);
    if (!isChinese && trimmed.length > 1) {
      setTypedError('請只輸入單一箇中文字。');
      return;
    }
    setShowTypingModal(false);
    onDirectTypedSubmit(trimmed.slice(0, 1));
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => {
            if (isRecognizing) {
              onCancelRecognition?.();
            }
            onBack();
          }}
          className="min-h-[44px] px-3 py-2 text-sm font-serif text-[#635C50] hover:text-[#B9382C] flex items-center gap-1.5 rounded-lg hover:bg-[#EFEAE0] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回修改題目</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFECE4] border border-[#DDD6C8] text-[#8C3227] text-xs font-serif">
          <Sparkles className="w-3 h-3" />
          <span>第二步・手指寫字</span>
        </div>
      </div>

      {/* Question context card */}
      <div className="mb-5 p-3.5 bg-white rounded-xl border border-[#DFD8CC] shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="shrink-0 px-2 py-0.5 rounded-md bg-[#FFF3F0] text-[#B9382C] font-serif font-bold text-sm border border-[#F5D2CD]">
            {topic}
          </span>
          <p className="font-serif text-sm text-[#4E483E] truncate">
            {question || '靜心思索心中之念'}
          </p>
        </div>
      </div>

      {/* Main instruction */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-serif font-bold text-[#1E1C19]">
          隨意落筆，寫下一字
        </h2>
        <p className="mt-1 text-sm text-[#736C5F] font-serif">
          不必拘泥美觀，順從當下第一直覺，寫出浮現腦海的字。
        </p>
      </div>

      {/* Handwriting Canvas */}
      <HandwritingCanvas
        onConfirmHandwriting={onHandwritingSubmit}
        onSwitchToTyping={() => setShowTypingModal(true)}
        isRecognizing={isRecognizing}
        onCancelRecognition={onCancelRecognition}
      />

      {/* Typing Modal */}
      {showTypingModal && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] w-full max-w-sm rounded-2xl p-6 border-2 border-[#D8D0C2] shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E5DFD4]">
              <div className="flex items-center gap-2 text-[#24211D]">
                <Keyboard className="w-5 h-5 text-[#B9382C]" />
                <h3 className="font-serif font-bold text-lg">改用鍵盤輸入</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTypingModal(false)}
                className="p-1 rounded-full text-[#8C8476] hover:bg-[#EFEAE0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm font-serif text-[#666054] mb-4">
              請在下方輸入你想測的一個繁體中文字：
            </p>

            <div className="flex justify-center mb-4">
              <input
                type="text"
                maxLength={2}
                value={typedChar}
                onChange={(e) => {
                  setTypedChar(e.target.value);
                  setTypedError(null);
                }}
                placeholder="字"
                className="w-24 h-24 text-center font-serif text-4xl font-bold bg-white border-2 border-[#B9382C] rounded-2xl shadow-inner focus:outline-hidden text-[#1E1C19]"
                autoFocus
              />
            </div>

            {typedError && (
              <p className="text-xs font-serif text-[#9E2A2B] text-center mb-3">
                {typedError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowTypingModal(false)}
                className="flex-1 min-h-[44px] rounded-xl border border-[#D5CFC3] bg-white text-[#554F44] font-serif text-sm cursor-pointer hover:bg-[#F3EFE7]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleTypingConfirm}
                className="flex-1 min-h-[44px] rounded-xl bg-[#B9382C] hover:bg-[#A32F24] text-white font-serif font-bold text-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>確認這個字</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
