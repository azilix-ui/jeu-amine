import type { Metadata, Viewport } from "next"
import { Toaster } from "react-hot-toast"
import "@fontsource/nunito/latin-400.css"
import "@fontsource/nunito/latin-600.css"
import "@fontsource/nunito/latin-700.css"
import "@fontsource/nunito/latin-800.css"
import "@fontsource/lobster/latin-400.css"
import "./globals.css"
import TanstackProvider from "@/app/TanstackProvider"
import LoadingBar from "@/components/ui/loading-bar"
import SocketInitializer from "./socketProvider"
import RouteGuard from "@/components/RouteGuard"
import { Suspense } from "react"

export const metadata: Metadata = {
	title: "Mechmoum · le réseau de la famille",
	description: "Mechmoum (مشموم), le petit réseau privé de la famille Missaoui : photos, reels, stories et messages.",
	manifest: "/reseau/manifest.webmanifest",
	icons: { icon: "/reseau/icone-192.png", apple: "/reseau/icone-180.png" },
	appleWebApp: { capable: true, title: "Mechmoum", statusBarStyle: "default" },
	robots: { index: false, follow: false },
}

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#000000" },
	],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="fr">
			<head>
				<script src="/reseau/garde-erreurs.js" />
				<script src="/reseau/enregistre-sw.js" defer />
			</head>
			<body className="antialiased">
				<SocketInitializer>
					<LoadingBar />
					<TanstackProvider>
						<Suspense>
							<RouteGuard>{children}</RouteGuard>
						</Suspense>
					</TanstackProvider>
					<Toaster
						position="top-center"
						toastOptions={{
							success: { iconTheme: { primary: "#0f766e", secondary: "#fafafa" } },
							error: { iconTheme: { primary: "#b4235a", secondary: "#fafafa" } },
						}}
					/>
				</SocketInitializer>
			</body>
		</html>
	)
}
