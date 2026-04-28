import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useCallback, useRef, useState } from 'react';
import type { WorkspaceDomain } from '@/context/WorkspaceContext';

export type VoiceLanguage = 'en' | 'es' | 'zh' | 'ar' | 'fr';

export const VOICE_LANGUAGES: Record<VoiceLanguage, { label: string; speechLocale: string; flag: string }> = {
  en: { label: 'English', speechLocale: 'en-US', flag: '🇺🇸' },
  es: { label: 'Español', speechLocale: 'es-ES', flag: '🇪🇸' },
  zh: { label: '中文', speechLocale: 'zh-CN', flag: '🇨🇳' },
  ar: { label: 'العربية', speechLocale: 'ar-SA', flag: '🇸🇦' },
  fr: { label: 'Français', speechLocale: 'fr-FR', flag: '🇫🇷' },
};

export interface VoiceQueryResult {
  query: string;
  domain: WorkspaceDomain;
  response: string;
  cards: VoiceResultCard[];
  language: VoiceLanguage;
}

export interface VoiceResultCard {
  id: string;
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

const DOMAIN_KEYWORDS_EN: Record<WorkspaceDomain, string[]> = {
  intelligence: ['intelligence', 'fusion', 'cross-domain', 'combined', 'correlation'],
  command: ['command', 'status', 'overview', 'all', 'cross', 'ecosystem', 'briefing'],
  defense: ['threat', 'security', 'defense', 'attack', 'vulnerability', 'aegis', 'incident', 'soc'],
  fleet: ['vessel', 'fleet', 'ship', 'maritime', 'cargo', 'port', 'voyage', 'anchor'],
  properties: ['property', 'properties', 'real estate', 'building', 'terra', 'valuation', 'deal', 'zoning'],
  operations: ['operations', 'lyte', 'system', 'uptime', 'incident', 'devops', 'health', 'signal'],
  advisory: ['advisory', 'client', 'carlota', 'consultation', 'session', 'document'],
  portfolio: ['portfolio', 'investment', 'fund', 'szl', 'holdings', 'return', 'asset'],
  founder: ['founder', 'stephen', 'venture', 'article', 'personal'],
};

const DOMAIN_KEYWORDS_ES: Record<WorkspaceDomain, string[]> = {
  intelligence: ['inteligencia', 'fusión', 'correlación', 'combinado'],
  command: ['comando', 'estado', 'resumen', 'general', 'ecosistema', 'informe'],
  defense: ['amenaza', 'seguridad', 'defensa', 'ataque', 'vulnerabilidad', 'incidente'],
  fleet: ['buque', 'flota', 'barco', 'marítimo', 'carga', 'puerto', 'viaje'],
  properties: ['propiedad', 'inmueble', 'edificio', 'valoración', 'trato', 'zonificación'],
  operations: ['operaciones', 'sistema', 'tiempo de actividad', 'salud', 'señal'],
  advisory: ['asesoría', 'cliente', 'consulta', 'sesión', 'documento'],
  portfolio: ['portafolio', 'inversión', 'fondo', 'retorno', 'activo'],
  founder: ['fundador', 'emprendimiento', 'artículo', 'personal'],
};

const DOMAIN_KEYWORDS_ZH: Record<WorkspaceDomain, string[]> = {
  intelligence: ['情报', '融合', '跨域', '关联'],
  command: ['指挥', '状态', '概览', '全局', '生态', '简报'],
  defense: ['威胁', '安全', '防御', '攻击', '漏洞', '事件'],
  fleet: ['船舶', '船队', '海运', '货物', '港口', '航行'],
  properties: ['房产', '不动产', '建筑', '估值', '交易', '分区'],
  operations: ['运营', '系统', '正常运行', '健康', '信号'],
  advisory: ['咨询', '客户', '会话', '文件'],
  portfolio: ['投资组合', '投资', '基金', '回报', '资产'],
  founder: ['创始人', '创业', '文章', '个人'],
};

const DOMAIN_KEYWORDS_AR: Record<WorkspaceDomain, string[]> = {
  intelligence: ['استخبارات', 'اندماج', 'ارتباط', 'مشترك'],
  command: ['قيادة', 'حالة', 'نظرة عامة', 'عام', 'نظام بيئي', 'إيجاز'],
  defense: ['تهديد', 'أمن', 'دفاع', 'هجوم', 'ثغرة', 'حادث'],
  fleet: ['سفينة', 'أسطول', 'بحري', 'شحن', 'ميناء', 'رحلة'],
  properties: ['عقار', 'عقارات', 'مبنى', 'تقييم', 'صفقة', 'تنظيم'],
  operations: ['عمليات', 'نظام', 'وقت التشغيل', 'صحة', 'إشارة'],
  advisory: ['استشارة', 'عميل', 'جلسة', 'وثيقة'],
  portfolio: ['محفظة', 'استثمار', 'صندوق', 'عائد', 'أصول'],
  founder: ['مؤسس', 'ريادة', 'مقال', 'شخصي'],
};

const DOMAIN_KEYWORDS_FR: Record<WorkspaceDomain, string[]> = {
  intelligence: ['renseignement', 'fusion', 'interdomaine', 'corrélation'],
  command: ['commandement', 'statut', 'aperçu', 'général', 'écosystème', 'briefing'],
  defense: ['menace', 'sécurité', 'défense', 'attaque', 'vulnérabilité', 'incident'],
  fleet: ['navire', 'flotte', 'maritime', 'cargo', 'port', 'voyage'],
  properties: ['propriété', 'immobilier', 'bâtiment', 'évaluation', 'transaction', 'zonage'],
  operations: ['opérations', 'système', 'disponibilité', 'santé', 'signal'],
  advisory: ['conseil', 'client', 'consultation', 'session', 'document'],
  portfolio: ['portefeuille', 'investissement', 'fonds', 'rendement', 'actif'],
  founder: ['fondateur', 'entreprise', 'article', 'personnel'],
};

const DOMAIN_RESPONSES: Record<VoiceLanguage, Record<WorkspaceDomain, { response: string; cards: VoiceResultCard[] }>> = {
  en: {
    command: { response: 'Cross-domain status nominal. 2 high-priority signals require attention across Defense and Fleet.', cards: [{ id: '1', label: 'Active Signals', value: '14', change: '+3', trend: 'up', severity: 'high' }, { id: '2', label: 'Critical Alerts', value: '2', trend: 'up', severity: 'critical' }, { id: '3', label: 'Domains Online', value: '7/7', trend: 'neutral' }] },
    intelligence: { response: 'Intelligence fusion engine provides cross-domain signal correlation.', cards: [] },
    defense: { response: 'Defense posture elevated. 1 active incident, 3 critical CVEs pending patch validation.', cards: [{ id: '1', label: 'Threat Level', value: 'ELEVATED', severity: 'high' }, { id: '2', label: 'Active Incidents', value: '1', severity: 'critical' }, { id: '3', label: 'Pending Patches', value: '3 CVEs', trend: 'down' }] },
    fleet: { response: 'Fleet operational. 12 vessels active, 1 delayed at Port of Rotterdam due to weather.', cards: [{ id: '1', label: 'Active SEXTANT', value: '12', trend: 'neutral' }, { id: '2', label: 'On Schedule', value: '11/12', trend: 'up' }, { id: '3', label: 'Cargo Value', value: '$84.2M', trend: 'up' }] },
    properties: { response: 'Portfolio performing well. 3 new distress signals detected in Miami-Dade corridor.', cards: [{ id: '1', label: 'Portfolio Value', value: '$2.4B', change: '+1.2%', trend: 'up' }, { id: '2', label: 'Active Deals', value: '7', trend: 'neutral' }, { id: '3', label: 'Distress Signals', value: '3', severity: 'medium' }] },
    operations: { response: 'Systems healthy. API latency up 12% — KORA agent investigating root cause.', cards: [{ id: '1', label: 'System Health', value: '94%', trend: 'down' }, { id: '2', label: 'API Latency', value: '238ms', change: '+12%', trend: 'up', severity: 'medium' }, { id: '3', label: 'Active Signals', value: '5', trend: 'neutral' }] },
    advisory: { response: '3 client sessions scheduled today. Pending document review for Blackstone engagement.', cards: [{ id: '1', label: 'Sessions Today', value: '3', trend: 'neutral' }, { id: '2', label: 'Pending Reviews', value: '2 docs', severity: 'low' }, { id: '3', label: 'Client NPS', value: '94', trend: 'up' }] },
    portfolio: { response: 'Portfolio up 2.1% this week. Counsel fund outperforming benchmark by 340bps.', cards: [{ id: '1', label: 'Portfolio Value', value: '$847M', change: '+2.1%', trend: 'up' }, { id: '2', label: 'Counsel Alpha', value: '+340bps', trend: 'up' }, { id: '3', label: 'Active Positions', value: '23', trend: 'neutral' }] },
    founder: { response: '2 articles pending publication. 4 ventures in active diligence phase.', cards: [{ id: '1', label: 'Articles Pending', value: '2', trend: 'neutral' }, { id: '2', label: 'Active Ventures', value: '4', trend: 'up' }, { id: '3', label: 'Portfolio IRR', value: '18.4%', trend: 'up' }] },
  },
  es: {
    command: { response: 'Estado interdomain nominal. 2 señales de alta prioridad requieren atención en Defensa y Flota.', cards: [{ id: '1', label: 'Señales Activas', value: '14', change: '+3', trend: 'up', severity: 'high' }, { id: '2', label: 'Alertas Críticas', value: '2', trend: 'up', severity: 'critical' }, { id: '3', label: 'Dominios en Línea', value: '7/7', trend: 'neutral' }] },
    intelligence: { response: 'El motor de fusión de inteligencia proporciona correlación de señales entre dominios.', cards: [] },
    defense: { response: 'Postura de defensa elevada. 1 incidente activo, 3 CVEs críticos pendientes de validación.', cards: [{ id: '1', label: 'Nivel de Amenaza', value: 'ELEVADO', severity: 'high' }, { id: '2', label: 'Incidentes Activos', value: '1', severity: 'critical' }, { id: '3', label: 'Parches Pendientes', value: '3 CVEs', trend: 'down' }] },
    fleet: { response: 'Flota operativa. 12 buques activos, 1 retrasado en el Puerto de Rotterdam por clima.', cards: [{ id: '1', label: 'Buques Activos', value: '12', trend: 'neutral' }, { id: '2', label: 'En Horario', value: '11/12', trend: 'up' }, { id: '3', label: 'Valor de Carga', value: '$84.2M', trend: 'up' }] },
    properties: { response: 'Portafolio con buen rendimiento. 3 nuevas señales de dificultad detectadas en el corredor Miami-Dade.', cards: [{ id: '1', label: 'Valor del Portafolio', value: '$2.4B', change: '+1.2%', trend: 'up' }, { id: '2', label: 'Acuerdos Activos', value: '7', trend: 'neutral' }, { id: '3', label: 'Señales de Dificultad', value: '3', severity: 'medium' }] },
    operations: { response: 'Sistemas saludables. Latencia de API aumentó 12% — agente KORA investigando causa raíz.', cards: [{ id: '1', label: 'Salud del Sistema', value: '94%', trend: 'down' }, { id: '2', label: 'Latencia API', value: '238ms', change: '+12%', trend: 'up', severity: 'medium' }, { id: '3', label: 'Señales Activas', value: '5', trend: 'neutral' }] },
    advisory: { response: '3 sesiones de clientes programadas hoy. Revisión de documento pendiente para compromiso Blackstone.', cards: [{ id: '1', label: 'Sesiones Hoy', value: '3', trend: 'neutral' }, { id: '2', label: 'Revisiones Pendientes', value: '2 docs', severity: 'low' }, { id: '3', label: 'NPS de Clientes', value: '94', trend: 'up' }] },
    portfolio: { response: 'Portafolio subió 2.1% esta semana. El fondo Counsel supera el benchmark en 340bps.', cards: [{ id: '1', label: 'Valor Portafolio', value: '$847M', change: '+2.1%', trend: 'up' }, { id: '2', label: 'Alpha Counsel', value: '+340bps', trend: 'up' }, { id: '3', label: 'Posiciones Activas', value: '23', trend: 'neutral' }] },
    founder: { response: '2 artículos pendientes de publicación. 4 empresas en fase activa de diligencia.', cards: [{ id: '1', label: 'Artículos Pendientes', value: '2', trend: 'neutral' }, { id: '2', label: 'Empresas Activas', value: '4', trend: 'up' }, { id: '3', label: 'IRR Portafolio', value: '18.4%', trend: 'up' }] },
  },
  zh: {
    command: { response: '跨域状态正常。防御和舰队领域有2个高优先级信号需要关注。', cards: [{ id: '1', label: '活跃信号', value: '14', change: '+3', trend: 'up', severity: 'high' }, { id: '2', label: '严重警报', value: '2', trend: 'up', severity: 'critical' }, { id: '3', label: '在线域', value: '7/7', trend: 'neutral' }] },
    intelligence: { response: '情报融合引擎提供跨域信号关联分析。', cards: [] },
    defense: { response: '防御态势升级。1个活跃事件，3个严重CVE等待补丁验证。', cards: [{ id: '1', label: '威胁级别', value: '升级', severity: 'high' }, { id: '2', label: '活跃事件', value: '1', severity: 'critical' }, { id: '3', label: '待处理补丁', value: '3个CVE', trend: 'down' }] },
    fleet: { response: '舰队运营正常。12艘船舶在役，1艘因天气在鹿特丹港延误。', cards: [{ id: '1', label: '在役船舶', value: '12', trend: 'neutral' }, { id: '2', label: '按时率', value: '11/12', trend: 'up' }, { id: '3', label: '货物价值', value: '8420万美元', trend: 'up' }] },
    properties: { response: '投资组合表现良好。迈阿密-戴德走廊检测到3个新的困境信号。', cards: [{ id: '1', label: '组合价值', value: '24亿美元', change: '+1.2%', trend: 'up' }, { id: '2', label: '活跃交易', value: '7', trend: 'neutral' }, { id: '3', label: '困境信号', value: '3', severity: 'medium' }] },
    operations: { response: '系统健康。API延迟上升12%——KORA代理正在调查根本原因。', cards: [{ id: '1', label: '系统健康', value: '94%', trend: 'down' }, { id: '2', label: 'API延迟', value: '238ms', change: '+12%', trend: 'up', severity: 'medium' }, { id: '3', label: '活跃信号', value: '5', trend: 'neutral' }] },
    advisory: { response: '今日安排3个客户会议。黑石合作的文件审查待处理。', cards: [{ id: '1', label: '今日会议', value: '3', trend: 'neutral' }, { id: '2', label: '待审文件', value: '2份', severity: 'low' }, { id: '3', label: '客户NPS', value: '94', trend: 'up' }] },
    portfolio: { response: '本周投资组合上涨2.1%。Counsel基金跑赢基准340bps。', cards: [{ id: '1', label: '组合价值', value: '8.47亿美元', change: '+2.1%', trend: 'up' }, { id: '2', label: 'Counsel超额', value: '+340bps', trend: 'up' }, { id: '3', label: '活跃仓位', value: '23', trend: 'neutral' }] },
    founder: { response: '2篇文章待发布。4家企业处于积极尽调阶段。', cards: [{ id: '1', label: '待发文章', value: '2', trend: 'neutral' }, { id: '2', label: '活跃企业', value: '4', trend: 'up' }, { id: '3', label: '组合IRR', value: '18.4%', trend: 'up' }] },
  },
  ar: {
    command: { response: 'حالة النظام البيئي طبيعية. إشارتان ذات أولوية عالية تتطلبان الانتباه في الدفاع والأسطول.', cards: [{ id: '1', label: 'إشارات نشطة', value: '14', change: '+3', trend: 'up', severity: 'high' }, { id: '2', label: 'تنبيهات حرجة', value: '2', trend: 'up', severity: 'critical' }, { id: '3', label: 'النطاقات المتصلة', value: '7/7', trend: 'neutral' }] },
    intelligence: { response: 'محرك دمج الاستخبارات يوفر ارتباط الإشارات عبر النطاقات.', cards: [] },
    defense: { response: 'وضع الدفاع مرتفع. حادث نشط واحد، 3 ثغرات حرجة بانتظار التحقق.', cards: [{ id: '1', label: 'مستوى التهديد', value: 'مرتفع', severity: 'high' }, { id: '2', label: 'حوادث نشطة', value: '1', severity: 'critical' }, { id: '3', label: 'تصحيحات معلقة', value: '3 CVEs', trend: 'down' }] },
    fleet: { response: 'الأسطول يعمل. 12 سفينة نشطة، واحدة متأخرة في ميناء روتردام بسبب الطقس.', cards: [{ id: '1', label: 'السفن النشطة', value: '12', trend: 'neutral' }, { id: '2', label: 'في الموعد', value: '11/12', trend: 'up' }, { id: '3', label: 'قيمة الشحن', value: '$84.2M', trend: 'up' }] },
    properties: { response: 'أداء المحفظة جيد. تم اكتشاف 3 إشارات ضائقة جديدة في ممر ميامي ديد.', cards: [{ id: '1', label: 'قيمة المحفظة', value: '$2.4B', change: '+1.2%', trend: 'up' }, { id: '2', label: 'صفقات نشطة', value: '7', trend: 'neutral' }, { id: '3', label: 'إشارات ضائقة', value: '3', severity: 'medium' }] },
    operations: { response: 'الأنظمة سليمة. زمن استجابة API ارتفع 12% — وكيل KORA يحقق في السبب.', cards: [{ id: '1', label: 'صحة النظام', value: '94%', trend: 'down' }, { id: '2', label: 'زمن API', value: '238ms', change: '+12%', trend: 'up', severity: 'medium' }, { id: '3', label: 'إشارات نشطة', value: '5', trend: 'neutral' }] },
    advisory: { response: '3 جلسات عملاء مجدولة اليوم. مراجعة وثائق معلقة لتعاون بلاكستون.', cards: [{ id: '1', label: 'جلسات اليوم', value: '3', trend: 'neutral' }, { id: '2', label: 'مراجعات معلقة', value: '2 وثائق', severity: 'low' }, { id: '3', label: 'NPS العملاء', value: '94', trend: 'up' }] },
    portfolio: { response: 'المحفظة ارتفعت 2.1% هذا الأسبوع. صندوق Counsel يتفوق على المعيار بـ 340 نقطة أساس.', cards: [{ id: '1', label: 'قيمة المحفظة', value: '$847M', change: '+2.1%', trend: 'up' }, { id: '2', label: 'ألفا Counsel', value: '+340bps', trend: 'up' }, { id: '3', label: 'مراكز نشطة', value: '23', trend: 'neutral' }] },
    founder: { response: 'مقالان بانتظار النشر. 4 مشاريع في مرحلة العناية الواجبة.', cards: [{ id: '1', label: 'مقالات معلقة', value: '2', trend: 'neutral' }, { id: '2', label: 'مشاريع نشطة', value: '4', trend: 'up' }, { id: '3', label: 'IRR المحفظة', value: '18.4%', trend: 'up' }] },
  },
  fr: {
    command: { response: 'Statut interdomaine nominal. 2 signaux haute priorite requierent attention en Defense et Flotte.', cards: [{ id: '1', label: 'Signaux Actifs', value: '14', change: '+3', trend: 'up', severity: 'high' }, { id: '2', label: 'Alertes Critiques', value: '2', trend: 'up', severity: 'critical' }, { id: '3', label: 'Domaines en Ligne', value: '7/7', trend: 'neutral' }] },
    intelligence: { response: 'Le moteur de fusion du renseignement fournit la correlation des signaux interdomaines.', cards: [] },
    defense: { response: 'Posture de defense elevee. 1 incident actif, 3 CVE critiques en attente de validation.', cards: [{ id: '1', label: 'Niveau de Menace', value: 'ELEVE', severity: 'high' }, { id: '2', label: 'Incidents Actifs', value: '1', severity: 'critical' }, { id: '3', label: 'Correctifs en Attente', value: '3 CVEs', trend: 'down' }] },
    fleet: { response: 'Flotte operationnelle. 12 navires actifs, 1 retarde au port de Rotterdam pour cause meteo.', cards: [{ id: '1', label: 'Navires Actifs', value: '12', trend: 'neutral' }, { id: '2', label: 'A l\'Heure', value: '11/12', trend: 'up' }, { id: '3', label: 'Valeur Cargo', value: '$84.2M', trend: 'up' }] },
    properties: { response: 'Portefeuille performant. 3 nouveaux signaux de detresse detectes dans le couloir Miami-Dade.', cards: [{ id: '1', label: 'Valeur Portefeuille', value: '$2.4B', change: '+1.2%', trend: 'up' }, { id: '2', label: 'Transactions Actives', value: '7', trend: 'neutral' }, { id: '3', label: 'Signaux de Detresse', value: '3', severity: 'medium' }] },
    operations: { response: 'Systemes sains. Latence API en hausse de 12% — agent KORA enquete sur la cause.', cards: [{ id: '1', label: 'Sante Systeme', value: '94%', trend: 'down' }, { id: '2', label: 'Latence API', value: '238ms', change: '+12%', trend: 'up', severity: 'medium' }, { id: '3', label: 'Signaux Actifs', value: '5', trend: 'neutral' }] },
    advisory: { response: '3 sessions clients prevues aujourd\'hui. Revision de documents en attente pour l\'engagement Blackstone.', cards: [{ id: '1', label: 'Sessions Aujourd\'hui', value: '3', trend: 'neutral' }, { id: '2', label: 'Revisions en Attente', value: '2 docs', severity: 'low' }, { id: '3', label: 'NPS Clients', value: '94', trend: 'up' }] },
    portfolio: { response: 'Portefeuille en hausse de 2.1% cette semaine. Le fonds Counsel surperforme le benchmark de 340bps.', cards: [{ id: '1', label: 'Valeur Portefeuille', value: '$847M', change: '+2.1%', trend: 'up' }, { id: '2', label: 'Alpha Counsel', value: '+340bps', trend: 'up' }, { id: '3', label: 'Positions Actives', value: '23', trend: 'neutral' }] },
    founder: { response: '2 articles en attente de publication. 4 entreprises en phase active de due diligence.', cards: [{ id: '1', label: 'Articles en Attente', value: '2', trend: 'neutral' }, { id: '2', label: 'Entreprises Actives', value: '4', trend: 'up' }, { id: '3', label: 'IRR Portefeuille', value: '18.4%', trend: 'up' }] },
  },
};

function routeToDomain(query: string, language: VoiceLanguage): WorkspaceDomain {
  const lower = query.toLowerCase();
  let bestDomain: WorkspaceDomain = 'command';
  let bestScore = 0;

  const keywordsMap =
    language === 'ar' ? DOMAIN_KEYWORDS_AR :
    language === 'fr' ? DOMAIN_KEYWORDS_FR :
    language === 'es' ? DOMAIN_KEYWORDS_ES :
    language === 'zh' ? DOMAIN_KEYWORDS_ZH :
    DOMAIN_KEYWORDS_EN;

  for (const [domain, keywords] of Object.entries(keywordsMap)) {
    const score = keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestDomain = domain as WorkspaceDomain;
    }
  }
  return bestDomain;
}

export type VoiceCommandState = 'idle' | 'listening' | 'processing' | 'result' | 'error';

export function useVoiceCommand(language: VoiceLanguage = 'en') {
  const [state, setState] = useState<VoiceCommandState>('idle');
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<VoiceQueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);

  const startListening = useCallback(async () => {
    if (processingRef.current) return;
    setState('listening');
    setTranscript('');
    setResult(null);
    setError(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const submitQuery = useCallback(async (query: string) => {
    if (!query.trim() || processingRef.current) return;
    processingRef.current = true;
    setTranscript(query);
    setState('processing');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await new Promise((r) => setTimeout(r, 1200));

    const domain = routeToDomain(query, language);
    const { response, cards } = DOMAIN_RESPONSES[language][domain];

    setResult({ query, domain, response, cards, language });
    setState('result');
    processingRef.current = false;

    const speechLocale = VOICE_LANGUAGES[language].speechLocale;
    try {
      Speech.speak(response, { language: speechLocale, rate: 0.95, pitch: 1.0 });
    } catch {}

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [language]);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
  }, []);

  const reset = useCallback(() => {
    Speech.stop();
    setState('idle');
    setTranscript('');
    setResult(null);
    setError(null);
    processingRef.current = false;
  }, []);

  return { state, transcript, result, error, startListening, submitQuery, stopSpeaking, reset };
}
