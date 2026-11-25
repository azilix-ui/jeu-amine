"use client"
// Une seule publication : /reseau/p/?id=<numéro> (depuis une notification).
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Cadre from "@/components/Cadre"
import PostComponent from "@/components/ui/post"
import { PostSkeleton } from "@/components/ui/skeleton"
import axios_instance from "@/config/axios"

function Une() {
	const id = useSearchParams().get("id") || ""
	const { data, isLoading } = useQuery({
		queryKey: ["post", id],
		queryFn: async () => {
			const { data } = await axios_instance.get(`/posts/un/${encodeURIComponent(id)}`)
			if (!data.success) throw new Error(data.message)
			return data.data
		},
		enabled: !!id,
		retry: false,
	})
	return (
		<div className="flex-1 min-w-0 px-2 py-4 md:py-8 pb-24">
			{isLoading ? <PostSkeleton /> : data ? <PostComponent postData={data} /> : <p className="text-center text-gray-500 py-20">Cette publication n&apos;existe plus.</p>}
		</div>
	)
}

export default function Page() {
	return (
		<Cadre>
			<Suspense fallback={null}>
				<Une />
			</Suspense>
		</Cadre>
	)
}
