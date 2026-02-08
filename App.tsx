
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Trade, SavedAnalysis, Contribution, Asset, ExtraIncome, Broker, DiaryEntry, GuideSettings } from './types';
import { supabase } from './services/supabase';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AIAnalysis from './components/AIAnalysis';
import FundamentalAnalysisIA from './components/FundamentalAnalysisIA';
import MacroCorrelation from './components/MacroCorrelation';
import History from './components/History';
import Settings from './components/Settings';
import TradeModal from './components/TradeModal';
import AssetModal from './components/AssetModal';
import AssetsManager from './components/AssetsManager';
import IncomeModal from './components/IncomeModal';
import CashManager from './components/CashManager';
import FinishTradeModal from './components/FinishTradeModal';
import TradeDiary from './components/TradeDiary';
import DGGuide from './components/DGGuide';
import { DashboardIcon, BrainIcon, HistoryIcon, PlusIcon, SettingsIcon, Logo, ArchiveIcon, BriefcaseIcon, CheckIcon, AlertIcon, XIcon, BankIcon, JournalIcon, ShieldIcon, GridIcon, InfoIcon } from './components/Icons';
import { getUSDBRLRate } from './services/finance';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<View>(View.Dashboard);
  const [loadingData, setLoadingData] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, type: 'success' | 'error' | 'info', message: string}[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  
  const [incomeTargetAsset, setIncomeTargetAsset] = useState('');
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);
  const [finishingTrade, setFinishingTrade] = useState<Trade | undefined>(undefined);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  
  const [exchangeRate, setExchangeRate] = useState<number>(5.80);
  const [manualRate, setManualRate] = useState<number | null>(null);

  const [trades, setTrades] = useState<Trade[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [extraIncomes, setExtraIncomes] = useState<ExtraIncome[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [guideSettings, setGuideSettings] = useState<GuideSettings>({ enabled: true, onboardingCompleted: false, missionsCompleted: [] });
  const [onboardingStep, setOnboardingStep] = useState(0);

  const addNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 6000);
  }, []);

  const currentExchangeRate = useMemo(() => manualRate || exchangeRate, [manualRate, exchangeRate]);

  const equityBRL = useMemo(() => {
    const rate = currentExchangeRate;
    const cashMovementsBRL = contributions.reduce((sum, c) => {
      const val = c.currency === 'USD' ? Number(c.amount) * rate : Number(c.amount);
      const costVal = (c.costs || 0) * (c.currency === 'USD' ? rate : 1);
      if (c.type === 'Retirada' || c.type === 'Custo') return sum - (val + costVal);
      return sum + val;
    }, 0);
    const realizedProfitBRL = trades
      .filter(t => t.result !== 'Pendente')
      .reduce((sum, t) => sum + (t.currency === 'USD' ? Number(t.profit) * rate : Number(t.profit)), 0);
    const extraIncomesBRL = extraIncomes.reduce((sum, i) => {
      const val = i.currency === 'USD' ? Number(i.amount) * rate : Number(i.amount);
      return sum + val;
    }, 0);
    return cashMovementsBRL + realizedProfitBRL + extraIncomesBRL;
  }, [contributions, trades, extraIncomes, currentExchangeRate]);

  const mapDiaryFromDB = (data: any): DiaryEntry => ({
    id: data.id,
    user_id: data.user_id,
    date: data.date,
    timestamp: Number(data.timestamp),
    session: data.session,
    emotionalState: data.emotional_state,
    postSessionFeeling: data.post_session_feeling,
    sleepQuality: data.sleep_quality,
    expectation: data.expectation,
    objective: data.objective,
    evaluation: data.evaluation || '',
    reflection: data.reflection || '',
    objectiveReached: !!data.objective_met, 
    emotionalAudit: !!data.mental_rigor,     
    strategicAudit: !!data.tactical_rigor,   
    financialAudit: !!data.risk_rigor,       
    learning: data.learning || '',
    isClosed: !!data.is_closed,
    isDaySealed: !!data.is_day_sealed, 
    status: data.status || 'aberta'
  });

  const fetchAllData = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoadingData(true);
    try {
      const [t, a, c, i, b, d, s] = await Promise.all([
        supabase.from('trades').select('*'),
        supabase.from('assets').select('*'),
        supabase.from('contributions').select('*'),
        supabase.from('extra_incomes').select('*'),
        supabase.from('brokers').select('*'),
        supabase.from('diary_entries').select('*'),
        supabase.from('saved_analyses').select('*')
      ]);

      setTrades((t.data || []).map(d => ({
        ...d,
        contracts: Number(d.contracts),
        entryPrice: Number(d.entry_price),
        stopPrice: Number(d.stop_price),
        profit: Number(d.profit),
        costs: Number(d.costs || 0),
        timestamp: Number(d.timestamp),
        brokerId: d.broker_id
      })));
      setAssets(a.data || []);
      setContributions((c.data || []).map(d => ({
        ...d,
        amount: Number(d.amount),
        timestamp: Number(d.timestamp),
        brokerId: d.broker_id,
        assetName: d.asset_name,
        costs: Number(d.costs || 0)
      })));
      setExtraIncomes((i.data || []).map(d => ({
        ...d,
        amount: Number(d.amount),
        timestamp: Number(d.timestamp),
        brokerId: d.broker_id,
        assetName: d.asset_name
      })));
      setBrokers(b.data || []);
      setDiaryEntries((d.data || []).map(mapDiaryFromDB));
      
      // Normalização: mapeia assetname (DB) para assetName (Interface)
      setSavedAnalyses((s.data || []).map(d => ({
        ...d,
        assetName: d.assetname || d.assetName 
      })));
    } catch (err) {
      console.error("[DG-AI] Erro de sincronização:", err);
    } finally {
      setLoadingData(false);
    }
  }, [session]);

  useEffect(() => {
    const initSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setIsReady(true);
      if (currentSession) updateExchangeRate();
    };
    initSession();
  }, []);

  useEffect(() => {
    if (session) fetchAllData();
  }, [session, view, fetchAllData]);

  const updateExchangeRate = async () => {
    const rate = await getUSDBRLRate();
    setExchangeRate(rate);
  };

  if (!isReady) return <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-6"><Logo size={64} className="animate-pulse" /><p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Sincronizando Terminal...</p></div>;
  if (!session) return <Auth onSession={(s) => setSession(s)} />;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#020617] text-slate-100 relative">
      <DGGuide currentView={view} setView={setView} settings={guideSettings} updateSettings={setGuideSettings} assets={assets} brokers={brokers} trades={trades} diaryEntries={diaryEntries} analyses={savedAnalyses} equity={equityBRL} onboardingStep={onboardingStep} setOnboardingStep={setOnboardingStep} />

      <div className="fixed top-6 right-6 z-[600] space-y-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl animate-in slide-in-from-right-10 duration-300 pointer-events-auto ${n.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : n.type === 'info' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
            {n.type === 'success' ? <CheckIcon size={18} /> : n.type === 'info' ? <InfoIcon size={18} /> : <AlertIcon size={18} />}
            <span className="text-xs font-black uppercase tracking-widest">{n.message}</span>
            <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="ml-2 hover:text-white transition-colors"><XIcon size={14}/></button>
          </div>
        ))}
      </div>

      <aside className="hidden md:flex w-72 flex-col bg-slate-900/40 border-r border-slate-800 sticky top-0 h-screen overflow-y-auto custom-scrollbar">
        <div className="p-8 flex items-center gap-4"><Logo size={48} /><h1 className="text-lg font-black text-white leading-tight">Terminal <span className="text-emerald-400 block">DG-AI</span></h1></div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          <NavBtn active={view === View.Dashboard} onClick={() => setView(View.Dashboard)} icon={<DashboardIcon />} label="Dashboard" />
          <NavBtn active={view === View.MacroCorrelation} onClick={() => setView(View.MacroCorrelation)} icon={<GridIcon />} label="Macro" />
          <NavBtn active={view === View.FundamentalAnalysis} onClick={() => setView(View.FundamentalAnalysis)} icon={<ShieldIcon />} label="Valuation" />
          <NavBtn active={view === View.AI} onClick={() => setView(View.AI)} icon={<BrainIcon />} label="Análise IA" />
          <NavBtn active={view === View.Assets} onClick={() => setView(View.Assets)} icon={<BriefcaseIcon />} label="Biblioteca" />
          <NavBtn active={view === View.CashManager} onClick={() => setView(View.CashManager)} icon={<BankIcon />} label="Tesouraria" />
          <NavBtn active={view === View.TradeDiary} onClick={() => setView(View.TradeDiary)} icon={<JournalIcon />} label="Diário" />
          <NavBtn active={view === View.History} onClick={() => setView(View.History)} icon={<HistoryIcon />} label="Monitoramento" />
          <NavBtn active={view === View.Settings} onClick={() => setView(View.Settings)} icon={<SettingsIcon />} label="Ajustes" />
        </nav>
        <div className="p-6 border-t border-slate-800">
          <button onClick={() => { setEditingTrade(undefined); setIsModalOpen(true); }} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-black text-white uppercase text-xs shadow-lg transition-all active:scale-95"><PlusIcon size={18} />Nova Ordem</button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-12 pb-32 md:pb-12 max-w-7xl mx-auto w-full overflow-y-auto custom-scrollbar">
        {loadingData && <div className="flex items-center gap-3 mb-8 bg-emerald-500/10 border border-emerald-500/20 px-6 py-4 rounded-2xl animate-pulse"><div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div><span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sincronizando Banco de Dados...</span></div>}
        
        {view === View.Dashboard && <Dashboard trades={trades} contributions={contributions} assets={assets} extraIncomes={extraIncomes} diaryEntries={diaryEntries} exchangeRate={currentExchangeRate} equityBRL={equityBRL} />}
        {view === View.MacroCorrelation && <MacroCorrelation />}
        {view === View.FundamentalAnalysis && <FundamentalAnalysisIA addNotification={addNotification} />}
        {view === View.AI && <AIAnalysis assets={assets} savedAnalyses={savedAnalyses} onSaveAnalysis={async (a) => {
          // Mapeamento explícito para o Supabase
          const { data, error } = await supabase.from('saved_analyses').insert({ 
            assetname: a.assetName,
            timestamp: a.timestamp,
            date: a.date,
            image: a.image,
            result: a.result,
            user_id: session.user.id 
          }).select().single();
          
          if (!error && data) {
            const mapped = { ...data, assetName: data.assetname };
            setSavedAnalyses(prev => [mapped, ...prev]);
            addNotification('success', `Análise de ${a.assetName} vinculada ao dossiê.`);
          } else if (error) {
            addNotification('error', `Falha ao salvar análise: ${error.message}`);
          }
        }} onDeleteAnalysis={async (id) => { await supabase.from('saved_analyses').delete().eq('id', id); setSavedAnalyses(p => p.filter(x => x.id !== id)); }} onQuickAddAsset={() => setIsAssetModalOpen(true)} />}
        {view === View.Assets && <AssetsManager assets={assets} savedAnalyses={savedAnalyses} trades={trades} contributions={contributions} extraIncomes={extraIncomes} isSyncing={loadingData} onEdit={(a) => { setEditingAsset(a); setIsAssetModalOpen(true); }} onAddNew={() => { setEditingAsset(undefined); setIsAssetModalOpen(true); }} onUpdateStatus={async (id, s) => { await supabase.from('assets').update({ status: s }).eq('id', id); fetchAllData(); }} onToggleArchiveAnalysis={() => {}} onDeleteAnalysis={() => {}} addNotification={addNotification} />}
        {view === View.CashManager && <CashManager brokers={brokers} contributions={contributions} trades={trades} extraIncomes={extraIncomes} exchangeRate={currentExchangeRate} onAddBroker={async (b) => { 
          const { error } = await supabase.from('brokers').insert({ ...b, user_id: session.user.id });
          if (error) addNotification('error', `Falha ao registrar instituição: ${error.message}`);
          else { addNotification('success', 'Instituição vinculada.'); fetchAllData(); }
        }} onDeleteBroker={async (id) => { await supabase.from('brokers').delete().eq('id', id); fetchAllData(); }} onAddContribution={async (c) => { 
          const dbPayload: any = {
            amount: c.amount, currency: c.currency, type: c.type, date: c.date,
            timestamp: c.timestamp, broker_id: c.brokerId, asset_name: c.assetName,
            costs: c.costs || 0, user_id: session.user.id
          };
          const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
          if (isUuid(c.id)) dbPayload.id = c.id;

          const { error } = await supabase.from('contributions').upsert(dbPayload);
          if (error) addNotification('error', `Falha no lançamento: ${error.message}`);
          else { addNotification('success', 'Lançamento de caixa efetivado.'); await fetchAllData(); }
        }} onDeleteContribution={async (id) => { await supabase.from('contributions').delete().eq('id', id); fetchAllData(); }} />}
        
        {view === View.TradeDiary && <TradeDiary entries={diaryEntries} onSave={async (e) => { 
          const payload: any = {
            date: e.date,
            timestamp: e.timestamp,
            session: e.session,
            emotional_state: e.emotionalState,
            post_session_feeling: e.postSessionFeeling || 'Indiferente',
            sleep_quality: e.sleepQuality,
            expectation: e.expectation,
            objective: e.objective,
            evaluation: e.evaluation || '',
            reflection: e.reflection || '',
            objective_met: e.objectiveReached,      
            mental_rigor: e.emotionalAudit,          
            tactical_rigor: e.strategicAudit,        
            risk_rigor: e.financialAudit,            
            learning: e.learning || '',
            is_closed: e.isClosed,
            is_day_sealed: e.isDaySealed || false,   
            status: e.status || 'aberta',
            user_id: session.user.id
          };

          const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
          if (isUuid(e.id)) payload.id = e.id;

          const { error: upsertError } = await supabase.from('diary_entries').upsert(payload);

          if (upsertError) {
            console.error("[Supabase Error]", upsertError.message);
            addNotification('error', `Falha crítica de sincronização: ${upsertError.message}`);
            throw upsertError;
          } else {
            addNotification('success', 'Performance sincronizada com a auditoria completa.');
            await fetchAllData();
          }
        }} onDelete={async (id) => { await supabase.from('diary_entries').delete().eq('id', id); fetchAllData(); }} addNotification={addNotification} />}
        
        {view === View.History && <History trades={trades} extraIncomes={extraIncomes} contributions={contributions} onEdit={(t) => { setEditingTrade(t); setIsModalOpen(false); setEditingTrade(undefined); setIsModalOpen(true); }} onDelete={async (id) => { await supabase.from('trades').delete().eq('id', id); fetchAllData(); }} onArchive={async (id) => { await supabase.from('trades').update({ archived: true }).eq('id', id); fetchAllData(); }} onAddIncome={(a) => { setIncomeTargetAsset(a); setIsIncomeModalOpen(true); }} onFinishTrade={(t) => { setFinishingTrade(t); setIsFinishModalOpen(true); }} registeredAssets={assets} exchangeRate={currentExchangeRate} totalEquityBRL={equityBRL} />}
        {view === View.Settings && <Settings onArchiveRange={() => {}} onReset={async () => { await fetchAllData(); }} tradeCount={trades.length} currentFetchedRate={exchangeRate} manualRate={manualRate} onUpdateManualRate={setManualRate} guideSettings={guideSettings} onUpdateGuideSettings={setGuideSettings} />}
      </main>

      {isModalOpen && <TradeModal key={editingTrade?.id || 'new-trade'} editingTrade={editingTrade} brokers={brokers} onClose={() => { setIsModalOpen(false); setEditingTrade(undefined); }} onSave={async (t) => { 
        const dbTrade: any = {
          asset: t.asset, type: t.type, currency: t.currency, contracts: t.contracts,
          entry_price: t.entryPrice, stop_price: t.stopPrice, initial_stop_price: t.initialStopPrice,
          take_profit: t.takeProfit, guarantee: t.guarantee, result: t.result, profit: t.profit,
          costs: t.costs || 0, date: t.date, timestamp: t.timestamp, archived: t.archived,
          image: t.image, notes: t.notes, broker_id: t.brokerId, user_id: session.user.id
        };
        if (t.id) dbTrade.id = t.id;
        await supabase.from('trades').upsert(dbTrade); 
        fetchAllData(); 
      }} exchangeRate={currentExchangeRate} registeredAssets={assets} defaultCapital={equityBRL} />}
      {isAssetModalOpen && <AssetModal key={editingAsset?.id || 'new-asset'} onClose={() => { setIsAssetModalOpen(false); setEditingAsset(undefined); }} onSave={async (a) => { await supabase.from('assets').upsert({ ...a, user_id: session.user.id, status: a.status || 'ATIVO' }); fetchAllData(); }} editingAsset={editingAsset} />}
      {isIncomeModalOpen && <IncomeModal targetAsset={incomeTargetAsset} brokers={brokers} onClose={() => setIsIncomeModalOpen(false)} onSave={async (i) => { 
        const dbIncome: any = {
          asset_name: i.assetName, type: i.type, amount: i.amount, currency: i.currency,
          date: i.date, timestamp: i.timestamp, notes: i.notes, broker_id: i.brokerId, user_id: session.user.id
        };
        if (i.id) dbIncome.id = i.id;
        await supabase.from('extra_incomes').insert(dbIncome); 
        fetchAllData(); 
      }} />}
      {isFinishModalOpen && finishingTrade && <FinishTradeModal trade={finishingTrade} assetConfig={assets.find(a => a.name === finishingTrade.asset)} onClose={() => setIsFinishModalOpen(false)} onConfirm={async (t) => { 
        const dbTrade: any = {
          asset: t.asset, type: t.type, currency: t.currency, contracts: t.contracts,
          entry_price: t.entryPrice, stop_price: t.stopPrice, initial_stop_price: t.initialStopPrice,
          take_profit: t.takeProfit, guarantee: t.guarantee, result: t.result, profit: t.profit,
          costs: t.costs || 0, date: t.date, timestamp: t.timestamp, archived: t.archived,
          image: t.image, notes: t.notes, broker_id: t.brokerId, user_id: session.user.id
        };
        if (t.id) dbTrade.id = t.id;
        await supabase.from('trades').upsert(dbTrade); 
        fetchAllData(); 
      }} />}
    </div>
  );
};

const NavBtn: React.FC<{active: boolean; onClick: () => void; icon: React.ReactNode; label: string}> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-3.5 rounded-2xl transition-all ${active ? 'bg-emerald-600/15 text-emerald-400 font-bold' : 'text-slate-500 hover:bg-slate-800/50'}`}>
    {icon} <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
