"use client"
import Cadre from "@/components/Cadre"
import Feed from "@/components/Feed"
import Suggestions from "@/components/Suggestions"

export default function Accueil() {
	return (
		<Cadre plein>
			<Feed />
			<Suggestions />
		</Cadre>
	)
}
