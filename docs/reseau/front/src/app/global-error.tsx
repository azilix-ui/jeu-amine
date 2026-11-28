"use client"
// 28/11 : si même la mise en page plante.
export default function ErreurGlobale({ error }: { error: Error }) {
	try { (window as any).__mcNote?.(error?.name + ": " + error?.message, error?.stack) } catch {}
	return (
		<html lang="fr"><body style={{ fontFamily: "system-ui", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100dvh", gap: 16, textAlign: "center", padding: 24 }}>
			<p style={{ fontSize: 48 }}>🌼</p>
			<h1 style={{ fontSize: 20 }}>Oups, Mechmoum a eu un petit souci.</h1>
			<button type="button" onClick={() => location.reload()} style={{ padding: "12px 20px", borderRadius: 12, background: "#111", color: "#fff", fontWeight: 700, border: 0 }}>Recharger</button>
			<a href="/" style={{ color: "#666" }}>Revenir au site de la famille</a>
		</body></html>
	)
}
