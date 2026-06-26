-- 在 Supabase SQL Editor 中执行以下 SQL 创建竞赛平台数据表

-- 组队信息表
CREATE TABLE IF NOT EXISTS teams (
  id BIGSERIAL PRIMARY KEY,
  contest_name TEXT NOT NULL,
  team_name TEXT NOT NULL,
  roles TEXT NOT NULL,
  contact TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON teams FOR SELECT USING (true);
CREATE POLICY "public_insert" ON teams FOR INSERT WITH CHECK (true);

-- 资料分享表
CREATE TABLE IF NOT EXISTS resources (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  contest TEXT,
  res_type TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON resources FOR SELECT USING (true);
CREATE POLICY "public_insert" ON resources FOR INSERT WITH CHECK (true);
