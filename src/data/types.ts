export type RecordType =
  | '方法'
  | '方法限制'
  | '諧聲例示'
  | '序文觀點'
  | '編纂原則'
  | '方法區分'
  | '文字離合案例'
  | '文字聯想案例';

export interface SourceRecord {
  id: string;
  book: '測字秘牒' | '字觸';
  section: string;
  quote: string;
  record_type: RecordType;
  source_url: string;
  text_status: string;
  author_attribution?: string;
  note?: string;
}

export interface RuleDefinition {
  id: string;
  name: string;
  evidence_ids: string[];
  description: string;
  constraints: string;
}

export type MatchType = 'direct_case' | 'method_analogy' | 'no_match';

export interface MethodApplication {
  rule_id: string;
  rule_name?: string;
  evidence_ids: string[];
  transformation: string;
  explanation: string;
  verified_sources?: SourceRecord[];
}

export interface ZichuExtension {
  evidence_ids: string[];
  match_type: MatchType;
  explanation: string;
  verified_sources?: SourceRecord[];
}

export interface HandwritingFeatures {
  is_handwritten: boolean;
  size: string; // 大小：偏大、適中、偏小、無法判定
  position: string; // 位置：居中、偏上、偏下、偏左、偏右、無法判定
  slant: string; // 歪斜：端正、右傾、左傾、欹斜、無法判定
  density: string; // 疏密：緊密密聚、疏朗舒展、分佈勻稱、無法判定
  entertainment_reflection: string; // 當次寫法趣味聯想（標明為字態娛樂聯想，與古籍分開）
}

export interface DivinationResult {
  status: 'ok' | 'insufficient_evidence';
  confirmed_character: string;
  topic: string;
  question: string;
  observed_structure: string;
  handwriting_features?: HandwritingFeatures | null;
  method_applications: MethodApplication[];
  zichu_extension: ZichuExtension;
  modern_reflection: string;
  closing_sentence: string;
  limitations: string[];
  all_verified_sources: SourceRecord[];
}

export interface RecognitionResult {
  has_text: boolean;
  is_single_chinese_character: boolean;
  primary_character: string;
  candidates: string[];
  needs_rewrite: boolean;
  reason?: string;
  is_simplified_or_variant?: boolean;
  variant_note?: string;
}
