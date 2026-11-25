import type { NextConfig } from "next"

// Mechmoum (réseau de la famille Missaoui) : compilé en fichiers simples, servis par le site sous /reseau/ (pas de serveur Node).
const nextConfig: NextConfig = {
	output: "export",
	basePath: "/reseau",
	trailingSlash: true,
	images: { unoptimized: true },
}

export default nextConfig
