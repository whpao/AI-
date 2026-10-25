import React, { useState } from 'react';
import { SOURCES, RULES, DIRECT_CASES } from '../data/sources.ts';
import { BookOpen, X, ExternalLink, HelpCircle, ShieldAlert } from 'lucide-react';

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SourcesModal: React.FC<SourcesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'sources' | 'rules' | 'direct_cases'>('sources');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#FAF7F2] w-full max-w-2xl max-h-[88vh] rounded-2xl flex flex-col border-2 border-[#D8D0C2] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5DFD4] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFF2F0] border border-[#F5C2BE] flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#B9382C]" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-[#22201C]">
                古籍文獻與測字法度庫
              </h2>
              <p className="text-xs font-serif text-[#787163]">
                《測字秘牒》（清・程省）與《字觸》（清・周亮工）原文轉錄節選
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#827A6D] hover:bg-[#EFEAE0] cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer Notice */}
        <div className="mx-4 mt-3 p-3 bg-[#FFFBF0] rounded-xl border border-[#EDE2C5] text-xs font-serif text-[#6D634E] flex items-start gap-2 shrink-0">
          <ShieldAlert className="w-4 h-4 text-[#C47D15] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">版本定位說明：</span>
            本館所錄文獻為線上轉錄節選，部分經繁體轉寫與標點整理，尚未逐字對照古籍影本，不標示為影本校勘定本，亦非收錄兩書全文。解讀嚴格依據固定資料庫與程式比對驗證。
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3 flex gap-2 border-b border-[#E5DFD4] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('sources')}
            className={`pb-2.5 px-3 font-serif text-sm border-b-2 cursor-pointer transition-colors ${
              activeTab === 'sources'
                ? 'border-[#B9382C] text-[#B9382C] font-bold'
                : 'border-transparent text-[#6B6457] hover:text-[#22201C]'
            }`}
          >
            原文節選（18條）
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`pb-2.5 px-3 font-serif text-sm border-b-2 cursor-pointer transition-colors ${
              activeTab === 'rules'
                ? 'border-[#B9382C] text-[#B9382C] font-bold'
                : 'border-transparent text-[#6B6457] hover:text-[#22201C]'
            }`}
          >
            操作規則（R01~R12）
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('direct_cases')}
            className={`pb-2.5 px-3 font-serif text-sm border-b-2 cursor-pointer transition-colors ${
              activeTab === 'direct_cases'
                ? 'border-[#B9382C] text-[#B9382C] font-bold'
                : 'border-transparent text-[#6B6457] hover:text-[#22201C]'
            }`}
          >
            收錄直接案例（5字）
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {activeTab === 'sources' && (
            <div className="space-y-3">
              {Object.values(SOURCES).map((src) => (
                <div
                  key={src.id}
                  className="p-3.5 bg-white rounded-xl border border-[#DFD8CC] shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-sm text-[#272420]">
                      <span className="text-[#B9382C] mr-1.5">[{src.id}]</span>
                      《{src.book}》{src.section}
                    </span>
                    <span className="text-xs font-serif px-2 py-0.5 rounded-sm bg-[#FAF6EE] text-[#5A5447] border border-[#E8E1D2]">
                      {src.record_type}
                    </span>
                  </div>

                  <p className="font-serif text-base text-[#1E1C19] p-2 bg-[#FAF7F2] rounded-md border border-[#EDE7DC]">
                    「{src.quote}」
                  </p>

                  {src.author_attribution && (
                    <p className="text-xs text-[#8A8274] font-serif">
                      歸屬：{src.author_attribution}
                    </p>
                  )}

                  {src.note && (
                    <p className="text-xs text-[#9E3424] font-serif bg-[#FFF5F2] p-1.5 rounded-md border border-[#F5C7C0]">
                      注意事項：{src.note}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs font-serif text-[#878072] pt-1">
                    <span>{src.text_status}</span>
                    <a
                      href={src.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#B9382C] hover:underline"
                    >
                      <span>文獻出處連結</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              {Object.values(RULES).map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 bg-white rounded-xl border border-[#DFD8CC] shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-sm text-[#B9382C]">
                        [{r.id}]
                      </span>
                      <h4 className="font-serif font-bold text-base text-[#25221E]">
                        {r.name}
                      </h4>
                    </div>
                    <span className="text-xs font-serif px-2 py-0.5 rounded-sm bg-[#FAF7F2] text-[#696254] border border-[#E5DFD4]">
                      依據：{r.evidence_ids.join(', ')}
                    </span>
                  </div>

                  <p className="text-sm font-serif text-[#3A362F]">
                    {r.description}
                  </p>

                  <div className="p-2 bg-[#FAF7F2] rounded-md border border-[#ECE5D8] text-xs font-serif text-[#666052]">
                    <span className="font-bold text-[#8C3227]">執行限制：</span>
                    {r.constraints}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'direct_cases' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E5DFD4] text-xs font-serif text-[#6D6556] flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-[#B9382C] shrink-0 mt-0.5" />
                <p>
                  《字觸》非固定吉凶字典，本庫僅收錄 Z05、Z06
                  等處有明確記載之文字離合案例。非此五字者，解讀一律標記為「借古籍方法類推」，絕不妄加杜撰。
                </p>
              </div>

              {Object.entries(DIRECT_CASES).map(([char, info]) => (
                <div
                  key={char}
                  className="p-3.5 bg-white rounded-xl border border-[#DFD8CC] shadow-2xs flex items-start gap-4"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#FFF8F6] border-2 border-[#B9382C] flex items-center justify-center shrink-0">
                    <span className="text-3xl font-serif font-black text-[#1E1C19]">
                      {char}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-base text-[#24211D]">
                        字形：「{char}」
                      </h4>
                      <span className="text-xs font-serif px-2 py-0.5 bg-[#FAF6EE] rounded-sm text-[#736B5C]">
                        出處：[{info.evidence_id}]
                      </span>
                    </div>
                    <p className="text-xs font-serif text-[#4A443A]">
                      <span className="font-bold">離合關係：</span>
                      {info.relation}
                    </p>
                    <p className="text-xs font-serif text-[#787163]">
                      <span className="font-bold">背景註記：</span>
                      {info.historical_note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#E5DFD4] bg-[#FAF7F2] flex justify-end shrink-0 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 bg-[#2B2823] text-white font-serif text-sm rounded-xl cursor-pointer hover:bg-[#1E1C19]"
          >
            關閉本視窗
          </button>
        </div>
      </div>
    </div>
  );
};
