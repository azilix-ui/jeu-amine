"use client"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { LoginForm } from "@/components/LoginForm"
import AccountDeletionSuccess from "@/components/ui/AccountDeleted"

function Contenu() {
	if (useSearchParams().get("acc") === "deleted") return <AccountDeletionSuccess />
	return (
		<div className="mc-fond-entree flex min-h-dvh flex-col items-center justify-center p-4">
			<LoginForm />
		</div>
	)
}

export default function LoginPage() {
	return (
		<Suspense fallback={null}>
			<Contenu />
		</Suspense>
	)
}
