import { useEffect, useState } from "react"
import { api } from "../../lib/api"
import { clearContentCache } from "../../lib/content"
import { branding as defaultBranding } from "../../data"
import { inputClass, labelClass } from "./AdminLogin"

function urlSafeBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

function AlertsManager() {
  const [supported] = useState(
    () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window
  )
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  )
  const [devices, setDevices] = useState([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState("")

  const load = async () => {
    try {
      const data = await api.get("/api/admin/subscriptions")
      setDevices(Array.isArray(data) ? data : [])
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    load()
  }, [])

  const enable = async () => {
    setBusy(true)
    setMsg("")
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== "granted") {
        setMsg("Permission denied — allow notifications for this site in the browser.")
        setBusy(false)
        return
      }
      const reg = await navigator.serviceWorker.register("/sw.js")
      const { key } = await api.get("/api/push/key")
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlSafeBase64ToUint8Array(key),
      })
      const json = sub.toJSON()
      await api.post("/api/admin/subscriptions", {
        endpoint: sub.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        label: `${navigator.platform || "device"} · ${new Date().toLocaleDateString()}`,
      })
      setMsg("This device will now get a desktop alert for every new visitor — even with the tab closed.")
      load()
    } catch (err) {
      setMsg(`Could not enable alerts: ${err.message}`)
    }
    setBusy(false)
  }

  const test = async () => {
    setBusy(true)
    try {
      const r = await api.post("/api/admin/push/test", {})
      setMsg(r.sent > 0 ? `Test sent to ${r.sent} device${r.sent === 1 ? "" : "s"}.` : "No devices subscribed yet.")
    } catch (err) {
      setMsg(`Test failed: ${err.message}`)
    }
    setBusy(false)
  }

  const removeDevice = async (id) => {
    await api.del(`/api/admin/subscriptions/${id}`).catch(() => {})
    load()
  }

  if (!supported) {
    return <p className="mt-2 text-sm text-zinc-500">This browser does not support push notifications.</p>
  }

  return (
    <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <h4 className="text-base font-bold text-white dark:text-zinc-100">Desktop visitor alerts</h4>
      <p className="mt-1 text-sm text-zinc-500">
        Get a system notification the moment a visitor lands on your site — works even
        with the admin tab closed (browser just needs to be running).
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={enable} disabled={busy} className="btn btn-primary">
          {busy ? "Working…" : permission === "granted" && devices.length > 0 ? "Re-enable this device" : "Enable alerts on this device"}
        </button>
        <button
          type="button"
          onClick={test}
          disabled={busy || devices.length === 0}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
        >
          Send test alert
        </button>
      </div>
      {msg && <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{msg}</p>}
      {devices.length > 0 && (
        <ul className="mt-4 space-y-2">
          {devices.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm dark:border-zinc-800"
            >
              <span className="text-zinc-700 dark:text-zinc-300">
                {d.label || "Device"} <span className="font-mono text-xs text-zinc-400">· {new Date(d.created_at).toLocaleDateString()}</span>
              </span>
              <button
                type="button"
                onClick={() => removeDevice(d.id)}
                className="font-mono text-xs text-rose-500 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Site settings: logo, mark and wordmark. */
export default function SettingsManager() {
  const [form, setForm] = useState({ ...defaultBranding })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState("")
  const [preview, setPreview] = useState("")

  useEffect(() => {
    api
      .get("/api/admin/content")
      .then((data) => {
        const row = (data || []).find((r) => r.key === "branding")
        if (row?.value) {
          setForm({ ...defaultBranding, ...row.value })
          setPreview(row.value.logoImage || "")
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (key === "logoImage") setPreview(e.target.value)
  }

  const upload = async (file) => {
    if (!file) return
    setUploading(true)
    setMsg("")
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const data = await api.post("/api/admin/upload", { filename: file.name, dataUrl })
      setForm((f) => ({ ...f, logoImage: data.url }))
      setPreview(data.url)
      setMsg("Logo uploaded — save settings to apply it.")
    } catch (err) {
      setMsg(`Upload failed: ${err.message}`)
    }
    setUploading(false)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg("")
    try {
      await api.put("/api/admin/content/branding", {
        value: {
          mark: form.mark.trim() || "TD",
          nameBefore: form.nameBefore.trim(),
          nameAfter: form.nameAfter.trim(),
          logoImage: form.logoImage.trim(),
        },
      })
      clearContentCache()
      setMsg("Saved — logo and name are live on the site.")
    } catch (err) {
      setMsg(`Error: ${err.message}`)
    }
    setSaving(false)
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading settings…</p>

  return (
    <form
      onSubmit={save}
      className="max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h3 className="text-lg font-bold text-white dark:text-zinc-100">Logo &amp; brand</h3>
      <p className="mt-1 text-sm text-zinc-500">
        Shown in the nav bar and footer. Leave the image empty to use the letter mark.
      </p>

      <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <p className={labelClass}>Preview</p>
        <div className="mt-2 flex items-center gap-3">
          {preview ? (
            <img src={preview} alt="Logo preview" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 font-mono text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950">
              {form.mark || "TD"}
            </span>
          )}
          <span className="font-mono text-sm font-medium text-white dark:text-zinc-100">
            {form.nameBefore}
            <span className="text-indigo-600 dark:text-indigo-400">{form.nameAfter}</span>
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Letter mark</label>
          <input value={form.mark} onChange={set("mark")} maxLength={3} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Name (plain)</label>
          <input value={form.nameBefore} onChange={set("nameBefore")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Name (accent)</label>
          <input value={form.nameAfter} onChange={set("nameAfter")} className={inputClass} />
        </div>
      </div>

      <div className="mt-4">
        <label className={labelClass}>Logo image URL</label>
        <div className="flex gap-2">
          <input
            value={form.logoImage}
            onChange={set("logoImage")}
            placeholder="/uploads/logo.png or https://…"
            className={inputClass}
          />
          {form.logoImage && (
            <button
              type="button"
              onClick={() => {
                setForm((f) => ({ ...f, logoImage: "" }))
                setPreview("")
              }}
              className="shrink-0 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <label className={labelClass}>Or upload (PNG/JPG/SVG/WebP, ≤2MB)</label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif,image/x-icon"
          disabled={uploading}
          onChange={(e) => upload(e.target.files?.[0])}
          className="block w-full text-sm text-zinc-500 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white disabled:opacity-50 dark:file:bg-zinc-100 dark:file:text-zinc-950"
        />
        {uploading && <p className="mt-2 font-mono text-xs text-zinc-500">Uploading…</p>}
      </div>

      {msg && <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">{msg}</p>}
      <button type="submit" disabled={saving} className="btn btn-primary mt-5">
        {saving ? "Saving…" : "Save settings"}
      </button>

      <AlertsManager />
    </form>
  )
}
