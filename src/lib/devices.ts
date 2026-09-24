import { supabase } from "@/integrations/supabase/client";

export type DeviceStatus = "pending" | "approved" | "rejected";
export type AdminDevice = {
  id: string;
  deviceId: string;
  label: string;
  status: DeviceStatus;
  createdAt: string;
};

const KEY = "wafr_device_id";

export function getDeviceId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function describeDevice(): string {
  const ua = navigator.userAgent;
  const os = /Android/i.test(ua)
    ? "أندرويد"
    : /iPhone|iPad/i.test(ua)
      ? "آيفون"
      : /Windows/i.test(ua)
        ? "ويندوز"
        : /Mac/i.test(ua)
          ? "ماك"
          : /Linux/i.test(ua)
            ? "لينكس"
            : "جهاز";
  const br = /Edg/i.test(ua)
    ? "Edge"
    : /Chrome/i.test(ua)
      ? "Chrome"
      : /Firefox/i.test(ua)
        ? "Firefox"
        : /Safari/i.test(ua)
          ? "Safari"
          : "متصفح";
  return `${os} - ${br} (${screen.width}×${screen.height})`;
}

/** Registers this device (if new) and returns its status. */
export async function requestAccess(): Promise<DeviceStatus> {
  const deviceId = getDeviceId();
  const { data } = await supabase
    .from("admin_devices")
    .select("status")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (data) return data.status as DeviceStatus;
  await supabase.from("admin_devices").insert({ device_id: deviceId, label: describeDevice() });
  return "pending";
}

export async function myDeviceStatus(): Promise<DeviceStatus | null> {
  const { data } = await supabase
    .from("admin_devices")
    .select("status")
    .eq("device_id", getDeviceId())
    .maybeSingle();
  return (data?.status as DeviceStatus) ?? null;
}

export async function listDevices(): Promise<AdminDevice[]> {
  const { data } = await supabase
    .from("admin_devices")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map((d) => ({
    id: d.id,
    deviceId: d.device_id,
    label: d.label,
    status: d.status as DeviceStatus,
    createdAt: d.created_at,
  }));
}

export async function setDeviceStatus(id: string, status: DeviceStatus) {
  await supabase
    .from("admin_devices")
    .update({ status, decided_at: new Date().toISOString() })
    .eq("id", id);
}

export async function deleteDevice(id: string) {
  await supabase.from("admin_devices").delete().eq("id", id);
}
