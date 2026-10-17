-- Milliy somsa: telefon xabarnomalari
-- Telefon (APK) o'zining maxsus kaliti bilan har 15 daqiqada notify_feed() ni chaqiradi.
-- Kalit kirish paytida register_device() orqali beriladi. Xabarlar shu yerda, rolga qarab hisoblanadi.

create table if not exists public.notify_devices (
  key text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen timestamptz
);
alter table public.notify_devices enable row level security;
-- Siyosat yo'q: jadvalga faqat quyidagi funksiyalar orqali kiriladi.

create or replace function public.register_device() returns text
language plpgsql security definer set search_path to 'public' as $$
declare k text;
begin
  if auth.uid() is null or not public.is_staff() then raise exception 'ruxsat yo''q'; end if;
  k := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
  insert into public.notify_devices(key, user_id) values (k, auth.uid());
  return k;
end $$;
revoke all on function public.register_device() from public, anon;
grant execute on function public.register_device() to authenticated;

create or replace function public.unregister_device(dkey text) returns void
language sql security definer set search_path to 'public' as $$
  delete from public.notify_devices where key = dkey;
$$;
revoke all on function public.unregister_device(text) from public;
grant execute on function public.unregister_device(text) to anon, authenticated;

-- Pulni "100 000" ko'rinishida yozish
create or replace function public.som_fmt(x numeric) returns text
language sql immutable as $$
  select replace(to_char(round(coalesce(x,0)), 'FM999,999,999,990'), ',', ' ')
$$;

create or replace function public.notify_feed(dkey text) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare
  uid uuid; urole text; since timestamptz;
  nowl timestamp := now() at time zone 'Asia/Tashkent';
  today date := (now() at time zone 'Asia/Tashkent')::date;
  hr int := extract(hour from (now() at time zone 'Asia/Tashkent'));
  out jsonb := '[]'::jsonb;
  txt text; n numeric; c record; d record; e record;
  dmax numeric; ddays int; cred numeric; bal numeric; since_d date; cum numeric; days int;
  s_sold numeric := 0; s_rev numeric := 0; s_paid numeric := 0; s_debt numeric := 0;
begin
  select dv.user_id, dv.created_at, p.role into uid, since, urole
    from public.notify_devices dv join public.profiles p on p.id = dv.user_id where dv.key = dkey;
  if uid is null or urole not in ('admin','ishchi') then return null; end if;
  update public.notify_devices set last_seen = now() where key = dkey;

  -- 1) Masalliq kam qoldi (hammaga), kuniga bir marta, 07:00–21:59
  if hr between 7 and 21 then
    select string_agg(x.name, ', ' order by x.name) into txt from (
      select name from public.ingredients
       where coalesce(min,0) > 0 and coalesce(stock,0) < min * (case unit when 'ta' then 1 else 1000 end)
      union all
      select name from public.semi where coalesce(min,0) > 0 and coalesce(stock,0) < min * 1000
    ) x;
    if txt is not null then
      out := out || jsonb_build_object('k', 'low:' || today || ':' || md5(txt), 't', 'Masalliq kam qoldi', 'b', txt);
    end if;
  end if;

  if urole = 'admin' then
    -- Do'konlar qarzi (FIFO bo'yicha eng eski to'lanmagan sana)
    select coalesce((value->>'debtMax')::numeric, 500000), coalesce((value->>'debtDays')::int, 7)
      into dmax, ddays from public.settings where key = 'main';
    dmax := coalesce(dmax, 500000); ddays := coalesce(ddays, 7);
    txt := null;
    for c in select id, name, coalesce(start_debt,0) sd from public.clients order by sort loop
      select coalesce(sum(coalesce((v->>'retSum')::numeric,0) + coalesce((v->>'paid')::numeric,0)),0) into cred
        from public.days dd, jsonb_each(dd.deliveries) j(k, v)
       where j.k = c.id and (v->>'done')::boolean;
      cred := cred + coalesce((select sum(amount) from public.payments where client_id = c.id), 0);
      if c.sd < 0 then cred := cred - c.sd; end if;
      bal := -cred; cum := 0; since_d := null;
      if c.sd > 0 then
        bal := bal + c.sd; cum := c.sd;
        if cum > cred then since_d := (select min(date) from public.days); end if;
      end if;
      for d in select dd.date, coalesce((v->>'givenSum')::numeric,0) g
                 from public.days dd, jsonb_each(dd.deliveries) j(k, v)
                where j.k = c.id and (v->>'done')::boolean and coalesce((v->>'givenSum')::numeric,0) > 0
                order by dd.date loop
        bal := bal + d.g; cum := cum + d.g;
        if since_d is null and cum > cred + 0.5 then since_d := d.date; end if;
      end loop;
      s_debt := s_debt + greatest(bal, 0);
      days := case when since_d is null then 0 else greatest(today - since_d, 0) end;
      if bal > dmax or (bal > 0 and days > ddays) then
        txt := coalesce(txt || '; ', '') || c.name || ' — ' || public.som_fmt(bal) || case when days > 0 then ' (' || days || ' kun)' else '' end;
      end if;
    end loop;
    if txt is not null and hr between 9 and 20 then
      out := out || jsonb_build_object('k', 'debt:' || today || ':' || md5(txt), 't', 'Qarzni undirish kerak', 'b', txt);
    end if;

    -- Yetkazish kiritildi (boshqa odam kiritganda, shu telefon ulangandan keyin)
    for e in select dd.date, j.k cid, v
               from public.days dd, jsonb_each(dd.deliveries) j(k, v)
              where dd.date between today - 1 and today and (v->>'done')::boolean
                and (v->>'at') is not null and (v->>'at')::timestamptz > since
                and coalesce(v->>'by','') <> uid::text loop
      n := (select coalesce(sum(value::numeric),0) from jsonb_each_text(coalesce(e.v->'given','{}'::jsonb)));
      bal := coalesce((e.v->>'givenSum')::numeric,0) - coalesce((e.v->>'retSum')::numeric,0) - coalesce((e.v->>'paid')::numeric,0);
      out := out || jsonb_build_object(
        'k', 'dl:' || e.date || ':' || e.cid || ':' || (e.v->>'at'),
        't', 'Yetkazildi: ' || coalesce((select name from public.clients where id = e.cid), e.cid),
        'b', n || ' ta berildi · olindi ' || public.som_fmt((e.v->>'paid')::numeric)
             || case when bal >= 1 then ' · qarzga ' || public.som_fmt(bal) else '' end);
    end loop;

    -- Kechki hisobot, 22:00 dan keyin
    if hr >= 22 then
      for e in select v from public.days dd, jsonb_each(dd.deliveries) j(k, v)
                where dd.date = today and (v->>'done')::boolean loop
        s_sold := s_sold + (select coalesce(sum(value::numeric),0) from jsonb_each_text(coalesce(e.v->'given','{}'::jsonb)))
                         - (select coalesce(sum(value::numeric),0) from jsonb_each_text(coalesce(e.v->'returned','{}'::jsonb)));
        s_rev := s_rev + coalesce((e.v->>'givenSum')::numeric,0) - coalesce((e.v->>'retSum')::numeric,0);
        s_paid := s_paid + coalesce((e.v->>'paid')::numeric,0);
      end loop;
      s_paid := s_paid + coalesce((select sum(amount) from public.payments where date = today), 0);
      out := out || jsonb_build_object('k', 'report:' || today, 't', 'Bugungi hisobot',
        'b', case when s_sold = 0 and s_rev = 0 then 'Bugun yetkazish bo''lmadi'
                  else 'Sotildi ' || s_sold || ' ta · savdo ' || public.som_fmt(s_rev) end
             || ' · tushgan pul ' || public.som_fmt(s_paid) || ' · jami qarz ' || public.som_fmt(s_debt));
    end if;
  end if;

  -- Ertalabki eslatma (onam), 06:00–10:59
  if urole = 'ishchi' and hr between 6 and 10 then
    select string_agg(t.name || ' ' || x.n, ', ' order by t.sort), sum(x.n) into txt, n
      from (select o.key tid, sum(o.value::numeric) n
              from public.days dd, jsonb_each(dd.orders) c2(k, ord), jsonb_each_text(ord) o
             where dd.date = today group by o.key) x
      join public.somsa_types t on t.id = x.tid
     where x.n > 0;
    if n > 0 then
      out := out || jsonb_build_object('k', 'morning:' || today, 't', 'Bugun ' || n || ' ta somsa yopiladi', 'b', txt);
    end if;
  end if;

  return out;
end $$;
revoke all on function public.notify_feed(text) from public;
grant execute on function public.notify_feed(text) to anon, authenticated;
