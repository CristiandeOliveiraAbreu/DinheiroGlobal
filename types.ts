
export type TradeResult = 'Lucro' | 'Prejuízo' | 'Pendente';
export type TradeType = 'Compra' | 'Venda';
export type CurrencyType = 'USD' | 'BRL';
export type IncomeType = 'Dividendo' | 'Juros';
export type CalculationMethod = 'Pontos' | 'Percentual';
export type AssetCategory = 'Ações/FII' | 'CI';
export type BrokerType = 'Exchange' | 'Corretora' | 'Banco';
export type PostSessionFeeling = 'Disciplinado' | 'Frustrado' | 'Eufórico' | 'Esgotado' | 'Indiferente';
export type AssetStatus = 'ATIVO' | 'INATIVO';

export type ReportStatus = 'aguardando' | 'processando' | 'concluído' | 'erro';
export type ExecutionMode = 'MODO_RAPIDO' | 'MODO_PRECISO';

export interface GuideSettings {
  enabled: boolean;
  onboardingCompleted: boolean;
  missionsCompleted: string[];
}

export interface CorrelationAsset {
  id: string;
  name: string;
  ticker: string;
  category: 'Índice' | 'Moeda' | 'Commodity' | 'Futuros';
}

export interface B3StockData {
  ranking: number;
  ativo: string;
  setor: string;
  preco_validado: number;
  preco_original?: number;
  preco_manual?: number;
  validacao_info: string;
  preco_teto_final: number;
  margem_seguranca: number;
  pl: number;
  pvp: number;
  dividend_yield: number;
  classificacao: 'Excelente' | 'Boa' | 'Neutra' | 'Cara';
  status_cor: 'Verde' | 'Amarelo' | 'Vermelho';
  data_atualizacao: string;
  ajustado_em?: string;
  favorito?: boolean;
}

export interface B3WeeklyReport {
  id: string;
  data_relatorio: string;
  timestamp: number;
  status: ReportStatus;
  progresso: number;
  score_dgai: number;
  mode: ExecutionMode;
  top_40: B3StockData[];
  resumo: {
    acao_mais_descontada: string;
    acao_mais_cara: string;
    margem_media: string;
    setor_mais_descontado: string;
    texto_informativo: string;
  };
}

export interface Broker {
  id: string;
  user_id?: string;
  name: string;
  type: BrokerType;
}

export interface Trade {
  id: string;
  user_id?: string;
  asset: string;
  type: TradeType;
  currency: CurrencyType;
  contracts: number;
  entryPrice: number;
  stopPrice: number;
  initialStopPrice: number;
  takeProfit: number;
  guarantee: number;
  result: TradeResult;
  profit: number;
  costs?: number;
  date: string;
  timestamp: number;
  archived?: boolean;
  image?: string;
  notes?: string;
  brokerId: string;
}

export interface ExtraIncome {
  id: string;
  user_id?: string;
  assetName: string;
  type: IncomeType;
  amount: number;
  currency: CurrencyType;
  date: string;
  timestamp: number;
  notes?: string;
  brokerId?: string;
}

export interface Contribution {
  id: string;
  user_id?: string;
  amount: number;
  currency: CurrencyType;
  type: 'Inicial' | 'Adicional' | 'Retirada' | 'Rendimento' | 'Custo';
  date: string;
  timestamp: number;
  brokerId: string;
  assetName?: string;
  costs?: number;
}

export interface Asset {
  id?: string;
  user_id?: string;
  name: string;
  category: AssetCategory;
  currency: CurrencyType;
  calculation_method: CalculationMethod; 
  point_value: number;
  min_lots: number;
  receives_dividends: boolean;
  receives_interest: boolean;
  receives_bonus: boolean;
  status?: AssetStatus;
}

export interface DiaryEntry {
  id: string;
  user_id?: string;
  date: string;
  timestamp: number;
  session: 'Madrugada (24h até 5h)' | 'Manhã (5h até 12h)' | 'Tarde (12h até 18h)' | 'Noite (18h até 24h)';
  emotionalState: 'Calmo' | 'Ansioso' | 'Eufórico' | 'Frustrado';
  postSessionFeeling?: PostSessionFeeling;
  sleepQuality: 'Boa' | 'Regular' | 'Ruim';
  expectation: 'Realista' | 'Positiva' | 'Negativa';
  objective: string;
  evaluation: string;
  reflection: string;
  objectiveReached: boolean;
  emotionalAudit: boolean;
  strategicAudit: boolean;
  financialAudit: boolean;
  learning: string;
  isClosed: boolean;
  isDaySealed?: boolean;
  status?: 'aberta' | 'finalizada';
}

export interface AIAnalysisResult {
  direction: 'COMPRA' | 'VENDA' | 'NEUTRO' | 'AGUARDAR';
  entryRegion: string;
  maxSafeBoundary: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  reasoning: string;
  volatility: 'BAIXA' | 'MÉDIA' | 'ALTA';
  riskScore: number;
  riskMitigation: string;
  structureStatus: 'ALTA' | 'BAIXA' | 'LATERAL' | 'EXAUSTÃO' | 'ROMPIMENTO';
  trendContext: string;
  trendAlert?: string;
}

export interface SavedAnalysis {
  id: string;
  user_id?: string;
  assetName: string;
  timestamp: number;
  date: string;
  image?: string;
  result: AIAnalysisResult;
  archived?: boolean;
}

export enum View {
  Dashboard = 'dashboard',
  MacroCorrelation = 'macro_correlation',
  FundamentalAnalysis = 'fundamental_analysis',
  AI = 'ai',
  History = 'history',
  TradeDiary = 'trade_diary',
  Archived = 'archived',
  Settings = 'settings',
  Assets = 'assets',
  AccountControl = 'account_control',
  CashManager = 'cash_manager'
}
