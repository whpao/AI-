import React, { useState } from 'react';
import { ArrowRight, HelpCircle, ShieldCheck, Sparkles } from 'lucide-react';

export const TOPICS = ['生意', '財運', '合作', '人際', '生活', '其他'] as const;
export type TopicType = (typeof TOPICS)[number];

const EXAMPLE_QUESTIONS: Record<TopicType, string[]> = {
  生意: [
    '最近想開拓新的客源，想聽一個提醒。',
    '店面經營正逢轉型期，此時宜守還是宜動？',
  ],
  財運: [
    '近期有一筆較大開銷的決定，內心猶豫不決。',
    '想審視現階段的理財節奏，求一個心境上的啟發。',
  ],
  合作: [
    '最近想和朋友合夥共事，想聽聽相處上的提醒。',
    '團隊目前步調不一，該如何凝聚共識？',
  ],
  人際: [
    '與熟識的老朋友有些誤會，該如何釋懷化解？',
    '新環境中想找到自在的相處分寸。',
  ],
  生活: [
    '近期事務繁雜心神不寧，想尋找梳理思緒的方向。',
    '站在人生的交叉路口，尋求一個轉念的視角。',
  ],
  其他: [
    '心中有一件掛念的事，想以字觀心，聽一句提醒。',
    '面對近期的不確定感，想求一份心安沉著。',
  ],
};

interface StepQuestionProps {
  initialTopic?: TopicType;
  initialQuestion?: string;
  onProceed: (topic: TopicType, question: string) => void;
}

export const StepQuestion: React.FC<StepQuestionProps> = ({
  initialTopic = '生活',
  initialQuestion = '',
  onProceed,
}) => {
  const [topic, setTopic] = useState<TopicType>(initialTopic);
  const [question, setQuestion] = useState(initialQuestion);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProceed(topic, question.trim());
  };

  const handleSelectExample = (ex: string) => {
    setQuestion(ex);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Title block */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFECE4] border border-[#DDD6C8] text-[#8C3227] text-sm font-serif mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>第一步・問一件事</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1C19] tracking-tight">
          選定提問主題
        </h2>
        <p className="mt-2 text-base sm:text-lg text-[#6E675A] font-serif">
          心有所思，字有所顯。請選擇您想探究的領域。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic Selector */}
        <div>
          <label className="block text-lg font-serif font-bold text-[#2C2924] mb-3">
            問事領域
          </label>
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {TOPICS.map((t) => {
              const isSelected = topic === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className={`min-h-[52px] rounded-xl font-serif text-lg transition-all cursor-pointer flex items-center justify-center border-2 ${
                    isSelected
                      ? 'border-[#B9382C] bg-[#FFF8F6] text-[#B9382C] font-bold shadow-xs'
                      : 'border-[#E0DAD0] bg-white text-[#4A453D] hover:border-[#CDC5B8]'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Supplementary Question Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="question-input"
              className="text-lg font-serif font-bold text-[#2C2924]"
            >
              心中具體想問的題目（選填）
            </label>
            <span className="text-sm font-serif text-[#8C8476]">
              {question.length}/80 字
            </span>
          </div>

          <textarea
            id="question-input"
            rows={3}
            maxLength={80}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="例如：最近想和朋友合作，想聽一個提醒。"
            className="w-full p-3.5 text-lg font-serif rounded-xl border-2 border-[#D8D2C6] bg-white text-[#1E1C19] placeholder:text-[#AAA396] focus:border-[#B9382C] focus:outline-hidden transition-colors"
          />

          {/* Quick examples */}
          <div className="mt-3">
            <div className="flex items-center gap-1.5 text-xs text-[#7A7366] font-serif mb-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#B9382C]" />
              <span>點擊參考例句：</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_QUESTIONS[topic].map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectExample(ex)}
                  className="text-left text-xs font-serif bg-white hover:bg-[#F3EFE7] border border-[#DDD7CC] text-[#554F44] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-3.5 bg-[#FAF6EE] rounded-xl border border-[#E8E1D3] flex items-start gap-2.5 text-sm font-serif text-[#666054]">
          <ShieldCheck className="w-5 h-5 text-[#3E7C59] shrink-0 mt-0.5" />
          <p>
            本館重視隱私，絕不要求姓名、生辰八字、電話或個人身份資訊；問題與圖片僅在您測字時送至 AI 服務即時辨識與解讀，不建立個人資料庫。
          </p>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full min-h-[52px] bg-[#B9382C] hover:bg-[#A32F24] text-white font-serif font-bold text-lg rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.99]"
          >
            <span>下一步：提筆書字</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
