-- ログイン不要版のRLS設定
-- 既存のポリシーを削除して、誰でもアクセスできるポリシーに変更

drop policy if exists "Users can manage their own events" on events;

create policy "Allow all"
  on events for all
  using (true)
  with check (true);
