import React, { useState } from 'react';
import { DivinationResult, SourceRecord } from '../data/types.ts';
import {
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Edit3,
  ExternalLink,
  BookOpen,
  Sparkles,
  Info,
  ShieldAlert,
} from 'lucide-react';

interface StepResultProps {
  result: DivinationResult;
  onRestart: () => void;
  onModifyQuestion: () => void;
}

export const StepResult: React.FC<StepResultProps> = ({
  result,
  onRestart,
  onModifyQuestion,
}) => {
  const [copied, setCopied] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  // Format copyable text
  const handleCopy = async () => {
    const methodsSummary = result.method_applications
      .map(
        (m) =>
          `・【${m.rule_name || m.rule_id}】：${m.transformation}\n  說明：${m.explanation}`
      )
      .join('\n\n');

    const sourceCitations = result.all_verified_sources
      .map((s) => `・《${s.book}》${s.section}：「${s.quote}」(${s.source_url})`)
      .join('\n');

    let handwritingSummary = '';
    if (result.handwriting_features && result.handwriting_features.is_handwritten) {
      handwritingSummary = `\n【當次筆跡字態觀察】（娛樂聯想・非真實人格判定）：
・大小：${result.handwriting_features.size}
・位置：${result.handwriting_features.position}
・歪斜：${result.handwriting_features.slant}
・疏密：${result.handwriting_features.density}
・字態聯想：${result.handwriting_features.entertainment_reflection}\n`;
    } else {
      handwritingSummary = `\n【書寫模式】：鍵盤直接輸入（跳過手寫筆跡分析）\n`;
    }

    const textToCopy = `【一字問心｜AI 測字館・測字解讀】
──────────────────────
【所測一字】：『${result.confirmed_character}』
【提問領域】：${result.topic}
【所求心念】：${result.question || '探求心境啟發'}
${handwritingSummary}
一、字形初察：
${result.observed_structure}

二、字形推演：
${methodsSummary}

三、意象引申：
【${result.zichu_extension.match_type === 'direct_case' ? '直接案例' : '依理類推'}】
${result.zichu_extension.explanation}

四、回到你問的事（生活深層省思）：
${result.modern_reflection}

五、送你一句話：
「${result.closing_sentence}」

──────────────────────
【古籍依據節選】（線上轉錄節選，未作影本校勘）：
${sourceCitations}

【聲明】：本應用依古籍文字方法作文化與生活思辨解讀，筆跡字態純屬當次書寫娛樂聯想，不具預測效力，不代表事實或未來預測。
──────────────────────`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2600);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2600);
    }
  };

  const isDirectCase = result.zichu_extension.match_type === 'direct_case';
  const hasHandwriting = result.handwriting_features && result.handwriting_features.is_handwritten;

  return (
    <div className="w-full max-w-xl mx-auto pb-12">
      {/* 1. 「你寫的字」 Top Card */}
      <div className="bg-white rounded-2xl border-2 border-[#DCD5C7] p-6 shadow-sm mb-6 relative overflow-hidden">
        {/* Decorative corner seal */}
        <div className="absolute -top-3 -right-3 w-16 h-16 bg-[#B9382C]/10 rounded-full flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 border border-[#B9382C]/30 rounded-full" />
        </div>

        <div className="flex items-start justify-between mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF5F2] border border-[#F2C7BF] text-[#B9382C] text-xs font-serif font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>解讀已成</span>
          </div>

          <div className="px-3 py-1 rounded-lg bg-[#FAF6EE] text-[#5C564A] text-xs font-serif border border-[#E3DDD0]">
            領域：{result.topic}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Big Calligraphy Character Tile with seal-red border */}
          <div className="relative shrink-0 w-24 h-24 rounded-2xl bg-[#FFFBF8] border-2 border-[#B9382C] flex items-center justify-center shadow-md">
            <span className="text-6xl font-serif font-black text-[#1F1D1A]">
              {result.confirmed_character}
            </span>
            {/* Small red imprint badge */}
            <div className="absolute bottom-1 right-1 px-1 py-0.2 bg-[#B9382C] text-white text-[10px] rounded-xs font-serif leading-tight">
              問心
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <span className="text-xs font-serif text-[#8C8476] tracking-wider">
              心中所問之事
            </span>
            <p className="text-xl font-serif font-bold text-[#23201C] mt-1 leading-snug">
              {result.question || `就「${result.topic}」之事，求一字之箴言。`}
            </p>
            <p className="text-xs font-serif text-[#8C8476] mt-2">
              以字照心，借象引申，探尋生活反思。
            </p>
          </div>
        </div>
      </div>

      {/* 2. 「先看字」 Structural Breakdown */}
      <section className="bg-white rounded-2xl border border-[#DFD8CC] p-5 shadow-2xs mb-5">
        <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-[#F0EBE2]">
          <span className="w-2 h-2 rounded-full bg-[#B9382C]" />
          <h3 className="font-serif font-bold text-lg text-[#25221E]">
            先看字：字形初察
          </h3>
        </div>
        <p className="text-xl font-serif leading-relaxed text-[#2C2924]">
          {result.observed_structure}
        </p>
      </section>

      {/* 2.5 當次筆跡字態觀察（娛樂聯想）- 與古籍嚴格分開 */}
      <section className="bg-[#FAF7F2] rounded-2xl border-2 border-[#E2DBD0] p-5 shadow-2xs mb-5">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E8E1D4]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B9382C]" />
            <h3 className="font-serif font-bold text-lg text-[#25221E]">
              字態觀察：當次書寫趣味聯想
            </h3>
          </div>
          <span className="text-xs font-serif px-2.5 py-0.5 rounded-full bg-[#FFF2F0] text-[#B9382C] border border-[#F5C7C0] font-bold">
            娛樂聯想・與古籍分開
          </span>
        </div>

        {hasHandwriting ? (
          <div className="space-y-3.5">
            {/* 4 observations grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-white rounded-xl border border-[#DFD8CC]">
                <span className="text-xs font-serif text-[#8A8274] block mb-0.5 font-bold">
                  ・大小
                </span>
                <p className="text-base font-serif text-[#292621]">
                  {result.handwriting_features!.size}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#DFD8CC]">
                <span className="text-xs font-serif text-[#8A8274] block mb-0.5 font-bold">
                  ・位置
                </span>
                <p className="text-base font-serif text-[#292621]">
                  {result.handwriting_features!.position}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#DFD8CC]">
                <span className="text-xs font-serif text-[#8A8274] block mb-0.5 font-bold">
                  ・歪斜
                </span>
                <p className="text-base font-serif text-[#292621]">
                  {result.handwriting_features!.slant}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#DFD8CC]">
                <span className="text-xs font-serif text-[#8A8274] block mb-0.5 font-bold">
                  ・疏密
                </span>
                <p className="text-base font-serif text-[#292621]">
                  {result.handwriting_features!.density}
                </p>
              </div>
            </div>

            {/* Commentary */}
            <div className="p-3.5 bg-white rounded-xl border border-[#DFD8CC]">
              <span className="text-xs font-serif text-[#8A8274] block mb-1 font-bold">
                字態聯想解析：
              </span>
              <p className="text-lg font-serif text-[#2C2924] leading-relaxed">
                {result.handwriting_features!.entertainment_reflection}
              </p>
            </div>

            <p className="text-xs text-[#8A8274] font-serif leading-normal">
              註：此處為當次手指書寫之字形分佈趣味觀察，與正文字理解讀分開列示，不宣稱具備心理學、人格或誠信之診斷效力。
            </p>
          </div>
        ) : (
          <div className="p-3.5 bg-white rounded-xl border border-[#DFD8CC] text-center">
            <p className="text-base font-serif text-[#6D6556]">
              此字為鍵盤打字輸入，已跳過手寫筆跡字態分析。
            </p>
          </div>
        )}
      </section>

      {/* 3. 「字形推演」 */}
      <section className="bg-white rounded-2xl border border-[#DFD8CC] p-5 shadow-2xs mb-5">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F0EBE2]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B9382C]" />
            <h3 className="font-serif font-bold text-lg text-[#25221E]">
              字形推演：拆解析意
            </h3>
          </div>
          <span className="text-xs font-serif text-[#8C8476]">
            字理推衍
          </span>
        </div>

        <div className="space-y-4">
          {result.method_applications.map((m, idx) => (
            <div
              key={idx}
              className="bg-[#FAF7F2] rounded-xl p-4 sm:p-5 border border-[#E8E2D5]"
            >
              <div className="flex items-center gap-2 mb-2.5">
                <span className="px-2.5 py-0.5 rounded-md bg-[#B9382C] text-white text-xs font-serif font-bold">
                  {m.rule_name || m.rule_id}
                </span>
                <span className="text-base font-serif font-bold text-[#443E35]">
                  {m.transformation}
                </span>
              </div>
              <p className="text-xl font-serif text-[#2C2924] leading-relaxed">
                {m.explanation}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 「意象引申」 */}
      <section className="bg-white rounded-2xl border border-[#DFD8CC] p-5 shadow-2xs mb-5">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F0EBE2]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B9382C]" />
            <h3 className="font-serif font-bold text-lg text-[#25221E]">
              意象引申：離合之趣
            </h3>
          </div>
          <span
            className={`text-xs font-serif px-2 py-0.5 rounded-md border ${
              isDirectCase
                ? 'bg-[#EBF5EE] text-[#22673B] border-[#C3E4CD]'
                : 'bg-[#F5F2EB] text-[#6D6556] border-[#DDD6C8]'
            }`}
          >
            {isDirectCase ? '直接案例' : '依理類推'}
          </span>
        </div>

        <p className="text-xl font-serif text-[#2C2924] leading-relaxed">
          {result.zichu_extension.explanation}
        </p>

        {!isDirectCase && (
          <p className="mt-3 text-xs text-[#8A8375] font-serif bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EDE7DC]">
            註：此處以漢字離合之趣展開思維引申，不作吉凶論斷。詳細古籍文獻可於下方依據區查看。
          </p>
        )}
      </section>

      {/* 5. 「回到你問的事」 Modern Reflection */}
      <section className="bg-[#FFFDFB] rounded-2xl border-2 border-[#E5DECF] p-6 shadow-sm mb-5">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#EAE3D6]">
          <span className="w-2 h-2 rounded-full bg-[#B9382C]" />
          <h3 className="font-serif font-bold text-lg text-[#25221E]">
            回到你問的事：生活省思
          </h3>
        </div>
        <p className="text-xl font-serif text-[#1C1A17] leading-relaxed tracking-normal">
          {result.modern_reflection}
        </p>
      </section>

      {/* 6. 「送你一句話」 Golden Sentence */}
      <section className="bg-gradient-to-br from-[#FFF8F6] to-[#FAF5EE] rounded-2xl border-2 border-[#F2C7BF] p-6 shadow-sm mb-6 text-center">
        <span className="text-xs font-serif tracking-widest text-[#B9382C] font-bold block mb-2">
          ・ 送 你 一 句 話 ・
        </span>
        <blockquote className="text-2xl sm:text-3xl font-serif font-bold text-[#8A251A] leading-snug px-2 py-1">
          「{result.closing_sentence}」
        </blockquote>
      </section>

      {/* 7. 「查看古籍依據」 Collapsible Section */}
      <section className="bg-white rounded-2xl border border-[#DFD8CC] shadow-2xs mb-6 overflow-hidden">
        <button
          type="button"
          onClick={() => setSourcesOpen(!sourcesOpen)}
          className="w-full p-4 flex items-center justify-between font-serif text-base text-[#38332A] hover:bg-[#FAF7F2] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#B9382C]" />
            <span className="font-bold">查看古籍依據（共引用 {result.all_verified_sources.length} 則）</span>
          </div>
          {sourcesOpen ? (
            <ChevronUp className="w-5 h-5 text-[#888172]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#888172]" />
          )}
        </button>

        {sourcesOpen && (
          <div className="p-5 pt-2 border-t border-[#EFEAE0] space-y-4">
            <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8E2D5] text-xs font-serif text-[#787163] flex items-start gap-2">
              <Info className="w-4 h-4 text-[#8C8476] shrink-0 mt-0.5" />
              <p>
                版本聲明：以下均為古籍線上轉錄節選，部分經繁體轉寫與標點整理，未作影本校勘。程式嚴格依內建固定資料庫比對引證，未讓 AI 模型任意改寫原文或杜撰出處。
              </p>
            </div>

            {result.all_verified_sources.map((src: SourceRecord) => (
              <div
                key={src.id}
                className="p-3.5 bg-white rounded-xl border border-[#E3DDD0] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-sm text-[#272420]">
                    [{src.id}]《{src.book}》{src.section}
                  </span>
                  <span className="text-[11px] font-serif px-2 py-0.5 rounded-sm bg-[#EFECE4] text-[#635C4E]">
                    {src.record_type}
                  </span>
                </div>

                <div className="p-2.5 bg-[#FAF7F2] rounded-lg border border-[#EDE7DB] font-serif text-base text-[#1E1C19] italic">
                  「{src.quote}」
                </div>

                {src.author_attribution && (
                  <p className="text-xs text-[#8A8274] font-serif">
                    歸屬：{src.author_attribution}
                  </p>
                )}

                {src.note && (
                  <p className="text-xs text-[#A14738] font-serif bg-[#FFF8F6] p-2 rounded-md border border-[#F5D8D3]">
                    考證提醒：{src.note}
                  </p>
                )}

                <div className="pt-1 flex items-center justify-between text-xs font-serif text-[#888072]">
                  <span>{src.text_status}</span>
                  <a
                    href={src.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#B9382C] hover:underline"
                  >
                    <span>來源文獻</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Action buttons (≥ 48px touch targets) */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleCopy}
          className="w-full min-h-[50px] bg-[#B9382C] hover:bg-[#A32F24] text-white font-serif font-bold text-lg rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm active:scale-[0.99]"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>已複製解讀內容（附古籍出處與聲明）</span>
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              <span>複製解讀內容</span>
            </>
          )}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onModifyQuestion}
            className="min-h-[48px] rounded-xl border border-[#D5CFC3] bg-white text-[#4A453E] hover:bg-[#F5F2EB] font-serif text-base flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Edit3 className="w-4 h-4 text-[#7A7468]" />
            <span>修改問題</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="min-h-[48px] rounded-xl border border-[#D5CFC3] bg-white text-[#4A453E] hover:bg-[#F5F2EB] font-serif text-base flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-[#7A7468]" />
            <span>再測一字</span>
          </button>
        </div>
      </div>

      {/* Footer disclaimer */}
      <footer className="mt-8 pt-4 border-t border-[#E5DFD4] text-center space-y-2">
        <p className="text-xs font-serif text-[#878072] leading-relaxed flex items-center justify-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-[#A39B8D]" />
          <span>
            依古籍文字方法作文化與娛樂解讀，不代表事實或未來預測。
          </span>
        </p>
        <p className="text-[11px] font-serif text-[#A8A194]">
          手寫圖片與問題會送至 AI 服務處理；本應用不主動保存，服務端資料處理依所用服務設定。
        </p>
      </footer>
    </div>
  );
};
