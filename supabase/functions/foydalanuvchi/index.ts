// Foydalanuvchilarni boshqarish: faqat admin chaqira oladi.
// Amallar: create (yangi kishi), update (ism / rol), password (yangi parol), delete.
// Kirish uchun email kerak emas: login "login@milliysomsa.uz" ko'rinishidagi ichki manzilga aylantiriladi.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const DOMAIN = "milliysomsa.uz";
const ROLES = ["admin", "ishchi", "kuzatuvchi"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST kerak" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, service, { auth: { persistSession: false } });

  // Chaqiruvchini aniqlaymiz va admin ekanini tekshiramiz
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: who, error: whoErr } = await admin.auth.getUser(token);
  if (whoErr || !who?.user) return json({ error: "Avval tizimga kiring" }, 401);
  const { data: me } = await admin.from("profiles").select("role").eq("id", who.user.id).maybeSingle();
  if (!me || me.role !== "admin") return json({ error: "Bu amal faqat admin uchun" }, 403);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "So'rov noto'g'ri" }, 400); }
  const action = String(body.action || "");

  if (action === "create") {
    const login = String(body.login || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    const role = String(body.role || "kuzatuvchi");
    if (!/^[a-z0-9._-]{3,30}$/.test(login)) return json({ error: "Login 3–30 ta lotin harf yoki raqamdan iborat bo'lsin" }, 400);
    if (!name) return json({ error: "Ismni kiriting" }, 400);
    if (password.length < 6) return json({ error: "Parol kamida 6 ta belgi bo'lsin" }, 400);
    if (!ROLES.includes(role)) return json({ error: "Rol noto'g'ri" }, 400);
    const { data, error } = await admin.auth.admin.createUser({
      email: `${login}@${DOMAIN}`, password, email_confirm: true,
      user_metadata: { name, role, login },
    });
    if (error) return json({ error: error.message.includes("already") ? "Bu login band" : error.message }, 400);
    // Trigger profil yaratadi; rolni aniq qilib yozib qo'yamiz
    await admin.from("profiles").update({ name, role, login }).eq("id", data.user!.id);
    return json({ ok: true, id: data.user!.id });
  }

  const id = String(body.id || "");
  if (!id) return json({ error: "Foydalanuvchi tanlanmagan" }, 400);

  if (action === "update") {
    const patch: Record<string, string> = {};
    if (body.name != null) patch.name = String(body.name).trim();
    if (body.role != null) {
      const role = String(body.role);
      if (!ROLES.includes(role)) return json({ error: "Rol noto'g'ri" }, 400);
      if (id === who.user.id && role !== "admin") return json({ error: "O'zingizni admindan chiqara olmaysiz" }, 400);
      patch.role = role;
    }
    const { error } = await admin.from("profiles").update(patch).eq("id", id);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  if (action === "password") {
    const password = String(body.password || "");
    if (password.length < 6) return json({ error: "Parol kamida 6 ta belgi bo'lsin" }, 400);
    const { error } = await admin.auth.admin.updateUserById(id, { password });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  if (action === "delete") {
    if (id === who.user.id) return json({ error: "O'zingizni o'chira olmaysiz" }, 400);
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  return json({ error: "Noma'lum amal" }, 400);
});
