/**
 * Order persistence — Supabase (prod) or JSON file (local / fallback)
 */
const fs = require("fs");
const path = require("path");

const SEED_FILE = path.join(__dirname, "../../../data/admin-orders.json");
const TMP_FILE = "/tmp/esim-admin-orders.json";

let supabaseClient = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const { createClient } = require("@supabase/supabase-js");
    supabaseClient = createClient(url, key);
    return supabaseClient;
  } catch {
    return null;
  }
}

function loadJsonStore() {
  const paths = [TMP_FILE, SEED_FILE];
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        const data = JSON.parse(fs.readFileSync(p, "utf8"));
        return { orders: data.orders || [], source: p };
      }
    } catch { /* continue */ }
  }
  return { orders: [], source: null };
}

function saveJsonStore(orders) {
  const payload = { orders, updated_at: new Date().toISOString() };
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(payload, null, 2));
    return true;
  } catch {
    return false;
  }
}

function rowToOrder(row) {
  if (!row) return null;
  const supplier = row.supplier_internal || {};
  return {
    id: row.id,
    orderId: row.request_number,
    status: row.status,
    service_type: row.service_type,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    customer_email: row.customer_email,
    destination_country: row.destination_country,
    destination_city: row.destination_city,
    city_id: row.city_id,
    hotel_official_name: row.hotel_official_name,
    hotel_id: row.hotel_id,
    room_type: row.room_type,
    check_in: row.check_in,
    check_out: row.check_out,
    guest_count: row.guest_count,
    people_count: row.people_count,
    travel_date: row.travel_date,
    selected_item: row.selected_item,
    extra_notes: row.extra_notes,
    final_price_mnt: row.final_price_mnt,
    availability_status: row.availability_status || "pending",
    internal_notes: row.internal_notes,
    voucher_url: row.voucher_url,
    voucher_sent_at: row.voucher_sent_at,
    last_checked_at: row.last_checked_at,
    supplier_internal: supplier,
    created_at: row.created_at,
    updated_at: row.updated_at,
    paid_at: row.paid_at
  };
}

function orderToRow(order) {
  return {
    request_number: order.orderId,
    status: order.status || "new",
    service_type: order.service_type || "hotel",
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    customer_email: order.customer_email,
    destination_country: order.destination_country,
    destination_city: order.destination_city,
    city_id: order.city_id,
    hotel_official_name: order.hotel_official_name,
    hotel_id: order.hotel_id,
    room_type: order.room_type,
    check_in: order.check_in || null,
    check_out: order.check_out || null,
    guest_count: order.guest_count || order.people_count,
    people_count: order.people_count || order.guest_count,
    travel_date: order.travel_date || order.check_in,
    selected_item: order.selected_item,
    extra_notes: order.extra_notes,
    final_price_mnt: order.final_price_mnt,
    availability_status: order.availability_status || "pending",
    internal_notes: order.internal_notes || null,
    voucher_url: order.voucher_url || null,
    voucher_sent_at: order.voucher_sent_at || null,
    last_checked_at: order.last_checked_at || null,
    supplier_internal: order.supplier_internal || null,
    paid_at: order.paid_at || null,
    updated_at: new Date().toISOString()
  };
}

async function createOrder(order) {
  const sb = getSupabase();
  const row = { ...orderToRow(order), created_at: order.created_at || new Date().toISOString() };

  if (sb) {
    const { data, error } = await sb.from("travel_requests").insert(row).select().single();
    if (error) throw new Error(error.message);
    return rowToOrder(data);
  }

  const store = loadJsonStore();
  const record = {
    id: `local-${Date.now()}`,
    ...order,
    created_at: order.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  store.orders.unshift(record);
  saveJsonStore(store.orders);
  return record;
}

async function listOrders(filters) {
  const sb = getSupabase();
  if (sb) {
    let q = sb.from("travel_requests").select("*").order("created_at", { ascending: false }).limit(100);
    if (filters?.status) q = q.eq("status", filters.status);
    if (filters?.service_type) q = q.eq("service_type", filters.service_type);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data || []).map(rowToOrder);
  }

  const store = loadJsonStore();
  let list = store.orders || [];
  if (filters?.status) list = list.filter((o) => o.status === filters.status);
  if (filters?.service_type) list = list.filter((o) => o.service_type === filters.service_type);
  return list;
}

async function getOrder(orderId) {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("travel_requests")
      .select("*")
      .eq("request_number", orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return rowToOrder(data);
  }

  const store = loadJsonStore();
  return (store.orders || []).find((o) => o.orderId === orderId || o.id === orderId) || null;
}

async function updateOrder(orderId, patch) {
  const existing = await getOrder(orderId);
  if (!existing) return null;
  const merged = { ...existing, ...patch };
  const sb = getSupabase();

  if (sb) {
    const { data, error } = await sb.from("travel_requests")
      .update(orderToRow(merged))
      .eq("request_number", orderId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return rowToOrder(data);
  }

  const store = loadJsonStore();
  const idx = store.orders.findIndex((o) => o.orderId === orderId);
  if (idx < 0) return null;
  store.orders[idx] = { ...store.orders[idx], ...merged, updated_at: new Date().toISOString() };
  saveJsonStore(store.orders);
  return store.orders[idx];
}

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  updateOrder,
  getSupabase
};
