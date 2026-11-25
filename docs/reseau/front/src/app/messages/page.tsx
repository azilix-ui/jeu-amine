"use client"
import { Suspense } from "react"
import Cadre from "@/components/Cadre"
import MessagesComponent from "@/components/Messages"

export default function Page() {
	return (
		<Cadre plein>
			<Suspense fallback={null}>
				<MessagesComponent />
			</Suspense>
		</Cadre>
	)
}
