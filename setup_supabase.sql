
-- SCRIPT DE CONFIGURAÇÃO TOTAL TERMINAL DG-AI V6
-- Execute este script no SQL Editor do Supabase para um reset completo.

-- 1. TABELA DE CORRETORAS (BROKERS)
CREATE TABLE IF NOT EXISTS public.brokers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Exchange', 'Corretora', 'Banco'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE ATIVOS (ASSETS)
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Ações/FII', 'CI'
    currency TEXT NOT NULL, -- 'USD', 'BRL'
    calculation_method TEXT NOT NULL, -- 'Pontos', 'Percentual'
    point_value NUMERIC DEFAULT 1,
    min_lots NUMERIC DEFAULT 1,
    receives_dividends BOOLEAN DEFAULT FALSE,
    receives_interest BOOLEAN DEFAULT FALSE,
    receives_bonus BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'ATIVO',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE ORDENS (TRADES)
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    asset TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Compra', 'Venda'
    currency TEXT NOT NULL,
    contracts NUMERIC NOT NULL,
    entry_price NUMERIC NOT NULL,
    stop_price NUMERIC NOT NULL,
    initial_stop_price NUMERIC NOT NULL,
    take_profit NUMERIC,
    guarantee NUMERIC,
    result TEXT DEFAULT 'Pendente', -- 'Lucro', 'Prejuízo', 'Pendente'
    profit NUMERIC DEFAULT 0,
    costs NUMERIC DEFAULT 0,
    date TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    archived BOOLEAN DEFAULT FALSE,
    image TEXT,
    notes TEXT,
    broker_id UUID REFERENCES public.brokers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE CAIXA/MOVIMENTAÇÕES (CONTRIBUTIONS)
CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Inicial', 'Adicional', 'Retirada', 'Rendimento', 'Custo'
    date TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    broker_id UUID REFERENCES public.brokers(id) ON DELETE CASCADE,
    asset_name TEXT,
    costs NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE PROVENTOS/RENDIMENTOS EXTRAS (EXTRA_INCOMES)
CREATE TABLE IF NOT EXISTS public.extra_incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    asset_name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Dividendo', 'Juros'
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    date TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    notes TEXT,
    broker_id UUID REFERENCES public.brokers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE ANÁLISES SALVAS (SAVED_ANALYSES)
CREATE TABLE IF NOT EXISTS public.saved_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    assetName TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    date TEXT NOT NULL,
    image TEXT,
    result JSONB NOT NULL,
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DE DIÁRIO DE PERFORMANCE (DIARY_ENTRIES) - ESTRUTURA AUDITORIA COMPLETA
CREATE TABLE IF NOT EXISTS public.diary_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    session TEXT NOT NULL,
    emotional_state TEXT NOT NULL,
    post_session_feeling TEXT DEFAULT 'Indiferente',
    sleep_quality TEXT NOT NULL,
    expectation TEXT NOT NULL,
    objective TEXT NOT NULL,
    evaluation TEXT DEFAULT '',
    reflection TEXT DEFAULT '',
    objective_met BOOLEAN DEFAULT FALSE, -- REQUISITO: Objetivo atingido
    mental_rigor BOOLEAN DEFAULT FALSE,    -- REQUISITO: Rigor Mental
    tactical_rigor BOOLEAN DEFAULT FALSE,  -- REQUISITO: Rigor Tático
    risk_rigor BOOLEAN DEFAULT FALSE,      -- REQUISITO: Rigor de Risco
    learning TEXT DEFAULT '',
    is_closed BOOLEAN DEFAULT FALSE,
    is_day_sealed BOOLEAN DEFAULT FALSE,   -- REQUISITO: Dia Selado
    status TEXT DEFAULT 'aberta',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CONFIGURAÇÃO DE SEGURANÇA (RLS)
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO (POR USUÁRIO)
CREATE POLICY "manage_own_brokers" ON public.brokers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage_own_assets" ON public.assets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage_own_trades" ON public.trades FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage_own_contributions" ON public.contributions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage_own_incomes" ON public.extra_incomes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage_own_analyses" ON public.saved_analyses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "manage_own_diary" ON public.diary_entries FOR ALL USING (auth.uid() = user_id);

-- NOTIFICAÇÃO DE ATUALIZAÇÃO DE SCHEMA
NOTIFY pgrst, 'reload schema';
