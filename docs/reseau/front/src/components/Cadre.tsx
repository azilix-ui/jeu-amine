"use client"
// Le cadre commun des pages : la navigation (colonne sur PC/iPad, barres en haut et en bas sur téléphone) et la zone qui défile.
import React from "react"
import Sidebar from "@/components/Sidebar"

export default function Cadre({ children, plein = false }: { children: React.ReactNode; plein?: boolean }) {
	return (
		<div className="mc-cadre flex flex-col md:flex-row h-dvh overflow-hidden bg-gray-50">
			<Sidebar />
			<main className={`mc-zone flex-1 min-w-0 min-h-0 flex ${plein ? "overflow-hidden" : "overflow-y-auto"}`}>{children}</main>
			<div className="md:hidden shrink-0" style={{ height: "calc(56px + env(safe-area-inset-bottom))" }} aria-hidden="true" />
		</div>
	)
}
