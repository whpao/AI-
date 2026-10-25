import { SOURCES, RULES, DIRECT_CASES } from './sources.ts';
import {
  DivinationResult,
  MethodApplication,
  SourceRecord,
  ZichuExtension,
  HandwritingFeatures,
} from './types.ts';

export interface RawModelDivinationPayload {
  status?: string;
  confirmed_character?: string;
  topic?: string;
  question?: string;
  observed_structure?: string;
  handwriting_features?: {
    is_handwritten?: boolean;
    size?: string;
    position?: string;
    slant?: string;
    density?: string;
    entertainment_reflection?: string;
  } | null;
  method_applications?: Array<{
    rule_id?: string;
    evidence_ids?: string[];
    transformation?: string;
    explanation?: string;
  }>;
  zichu_extension?: {
    evidence_ids?: string[];
    match_type?: string;
    explanation?: string;
  };
  modern_reflection?: string;
  closing_sentence?: string;
  limitations?: string[];
}

/**
 * Validates, repairs, hydrates and guarantees safety and ancient grounding for divination results.
 */
export function verifyAndHydrateDivination(
  raw: RawModelDivinationPayload,
  fallbackChar: string,
  fallbackTopic: string,
  fallbackQuestion: string,
  handwritingContext?: {
    isHandwritten: boolean;
    computedSpatial?: {
      size: string;
      position: string;
      slant: string;
      density: string;
    };
  }
): DivinationResult {
  const confirmed_character = (
    raw.confirmed_character?.trim() || fallbackChar
  ).slice(0, 4);
  const topic = raw.topic?.trim() || fallbackTopic || '生活';
  const question = raw.question?.trim() || fallbackQuestion || '';

  const observed_structure =
    raw.observed_structure?.trim() ||
    `「${confirmed_character}」字筆劃分明，結構端方。`;

  const verifiedSourceSet = new Set<string>();

  // Process method_applications
  const verifiedMethods: MethodApplication[] = [];
  const rawMethods = Array.isArray(raw.method_applications)
    ? raw.method_applications
    : [];

  for (const m of rawMethods) {
    const rule_id = m.rule_id?.trim().toUpperCase() || '';
    const ruleDef = RULES[rule_id];

    // Filter evidence_ids to strictly known M sources and strictly rule-allowed sources
    const rawEvIds = Array.isArray(m.evidence_ids) ? m.evidence_ids : [];
    const validEvIds = rawEvIds.filter((id) => {
      const cleanId = id.trim().toUpperCase();
      // M rules must only cite M sources
      if (!cleanId.startsWith('M')) return false;
      if (!SOURCES[cleanId]) return false;
      // If rule is known, check against its allowed evidence IDs
      if (ruleDef && !ruleDef.evidence_ids.includes(cleanId)) return false;
      return true;
    });

    // If valid rule or valid evidence, retain it
    if (ruleDef || validEvIds.length > 0) {
      const chosenRuleId = ruleDef ? rule_id : 'R05';
      const actualRule = RULES[chosenRuleId] || RULES['R05'];
      const finalEvIds =
        validEvIds.length > 0 ? validEvIds : actualRule.evidence_ids;

      finalEvIds.forEach((id) => verifiedSourceSet.add(id));

      const verifiedSources: SourceRecord[] = finalEvIds
        .map((id) => SOURCES[id])
        .filter(Boolean);

      verifiedMethods.push({
        rule_id: chosenRuleId,
        rule_name: actualRule.name,
        evidence_ids: finalEvIds,
        transformation:
          m.transformation?.trim() ||
          `依《測字秘牒》之「${actualRule.name}」剖析構件。`,
        explanation:
          m.explanation?.trim() ||
          `自字形之點畫分合中，細察象意，理路分明。`,
        verified_sources: verifiedSources,
      });
    }
  }

  // Ensure at least 1 method application
  if (verifiedMethods.length === 0) {
    const defaultRule = RULES['R05']; // 破解
    verifiedSourceSet.add('M05');
    verifiedMethods.push({
      rule_id: 'R05',
      rule_name: defaultRule.name,
      evidence_ids: ['M05'],
      transformation: `析「${confirmed_character}」字之本形結構`,
      explanation:
        '《測字秘牒》云「破者，劈破。解者，解拆」，自本字現有構件切入省思。',
      verified_sources: [SOURCES['M05']],
    });
  }

  // Process Zichu Extension
  const rawZ = raw.zichu_extension || {};
  const rawZEvIds = Array.isArray(rawZ.evidence_ids) ? rawZ.evidence_ids : [];
  const validZEvIds = rawZEvIds.filter((id) => {
    const cleanId = id.trim().toUpperCase();
    // Z extension must only cite Z sources (Z01~Z06)
    return cleanId.startsWith('Z') && Boolean(SOURCES[cleanId]);
  });

  const finalZEvIds = validZEvIds.length > 0 ? validZEvIds : ['Z01', 'Z02'];
  finalZEvIds.forEach((id) => verifiedSourceSet.add(id));

  // Strict check on direct_case vs method_analogy:
  let match_type = (rawZ.match_type || 'method_analogy') as
    | 'direct_case'
    | 'method_analogy'
    | 'no_match';

  const isDirectCaseMatch = Boolean(DIRECT_CASES[confirmed_character]);

  if (match_type === 'direct_case' && !isDirectCaseMatch) {
    // Model erroneously claimed direct case for a character not in direct cases! Downgrade!
    match_type = 'method_analogy';
  } else if (isDirectCaseMatch && match_type !== 'no_match') {
    match_type = 'direct_case';
  }

  // If direct case, ensure the specific designated source (Z05 or Z06) is present
  if (match_type === 'direct_case') {
    const caseInfo = DIRECT_CASES[confirmed_character];
    if (caseInfo && !finalZEvIds.includes(caseInfo.evidence_id)) {
      finalZEvIds.unshift(caseInfo.evidence_id);
      verifiedSourceSet.add(caseInfo.evidence_id);
    }
  }

  let zExplanation = rawZ.explanation?.trim() || '';
  // Clean up any residual mechanical disclaimers if generated
  zExplanation = zExplanation
    .replace(/^本資料庫未收錄[^\n：:；;]*[：:；;]\s*/g, '')
    .replace(/本資料庫未收錄此字[之的]直接案例[；;，,、\s]*以下借用古籍方法類推[。：:；;]?\s*/g, '')
    .trim();

  if (!zExplanation) {
    if (match_type === 'direct_case') {
      const caseInfo = DIRECT_CASES[confirmed_character];
      zExplanation = `《字觸》書中收錄「${confirmed_character}」之案例關聯：${caseInfo.relation}。（${caseInfo.historical_note}）`;
    } else {
      zExplanation = `借用漢字離合之趣隨機感發，此字筆劃結構由內而外開展，象徵面對目前的事情若能退一步看清整體，往往能生出意想不到的靈活轉變。`;
    }
  }

  const verifiedZSources: SourceRecord[] = finalZEvIds
    .map((id) => SOURCES[id])
    .filter(Boolean);

  const zichu_extension: ZichuExtension = {
    evidence_ids: finalZEvIds,
    match_type,
    explanation: zExplanation,
    verified_sources: verifiedZSources,
  };

  // Process handwriting_features (size, position, slant, density, reflection)
  let handwriting_features: HandwritingFeatures | null = null;
  const isHandwritten = handwritingContext?.isHandwritten !== false;

  if (isHandwritten) {
    const rawHf = raw.handwriting_features;
    const computed = handwritingContext?.computedSpatial;

    const size =
      rawHf?.size?.trim() ||
      computed?.size ||
      '適中（體態勻稱，邊距得宜）';

    const position =
      rawHf?.position?.trim() ||
      computed?.position ||
      '居中（端居九宮格中央）';

    const slant =
      rawHf?.slant?.trim() ||
      computed?.slant ||
      '端正（骨幹挺立整飭）';

    const density =
      rawHf?.density?.trim() ||
      computed?.density ||
      '分佈勻稱（筆墨疏密相宜）';

    const reflection =
      rawHf?.entertainment_reflection?.trim() ||
      `本次手寫字跡呈現「${size.split('（')[0]}、${position.split('（')[0]}」之勢。落筆舒展從容，氣韻自適，為當次隨興之字態趣味。`;

    handwriting_features = {
      is_handwritten: true,
      size,
      position,
      slant,
      density,
      entertainment_reflection: reflection,
    };
  } else {
    // Typed mode: explicitly skip handwriting analysis
    handwriting_features = null;
  }

  // Modern reflection: detailed 150~250 words connecting to the user question
  let modern_reflection =
    raw.modern_reflection?.trim() ||
    `面對您所問的「${topic}」（${question || '所求事項'}），「${confirmed_character}」字之結構啟發我們：凡事宜先定其骨架，後審其虛實。不急於一時冒進，而在於細辨情境、妥為梳理，順應時勢方得自如。`;

  // Closing sentence: 20~30 words
  let closing_sentence =
    raw.closing_sentence?.trim() ||
    `觀字如鑑照自心，理順當前事，步履自從容。`;

  const limitations = Array.isArray(raw.limitations)
    ? raw.limitations
    : [
        '本分析本於古籍字形離合之文化意趣，非命定吉凶預言。',
        '手寫筆跡僅作字形辨認與當次字態趣味觀察，不作個人性格、誠信或命格推斷。',
        '引用資料為線上轉錄節選，未作古籍影本校勘。',
      ];

  // Consolidate all verified sources uniquely
  const all_verified_sources: SourceRecord[] = Array.from(verifiedSourceSet)
    .sort()
    .map((id) => SOURCES[id])
    .filter(Boolean);

  return {
    status: 'ok',
    confirmed_character,
    topic,
    question,
    observed_structure,
    handwriting_features,
    method_applications: verifiedMethods,
    zichu_extension,
    modern_reflection,
    closing_sentence,
    limitations,
    all_verified_sources,
  };
}
