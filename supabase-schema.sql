-- 생리 주기 테이블
CREATE TABLE cycles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person TEXT NOT NULL CHECK (person IN ('big', 'small', 'mom')),
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 증상 기록 테이블
CREATE TABLE symptoms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person TEXT NOT NULL CHECK (person IN ('big', 'small', 'mom')),
  date DATE NOT NULL,
  pain_level SMALLINT DEFAULT 0 CHECK (pain_level BETWEEN 0 AND 3), -- 0:없음 1:하 2:중 3:상
  headache BOOLEAN DEFAULT FALSE,
  notes TEXT CHECK (char_length(notes) <= 80),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (person, date)
);

-- Row Level Security 설정 (anon key로 모든 작업 허용)
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_cycles" ON cycles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_symptoms" ON symptoms FOR ALL USING (true) WITH CHECK (true);
