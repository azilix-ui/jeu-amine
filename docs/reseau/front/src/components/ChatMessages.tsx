import { Loader, MessageCircleCode } from "lucide-react"
import { type Message } from "@/types/message"

type Props = {
	messages: {
		isLoading: boolean
		isError: boolean
		data?: Message[]
	}
	currentUserId: string
}

const ChatMessages = ({ messages, currentUserId }: Props) => {
	if (messages.isLoading) {
		return (
			<p className="flex-1 flex items-center justify-center">
				<Loader className="size-8 animate-spin" />
			</p>
		)
	}

	if (messages.isError) {
		return (
			<p className="text-center text-red-600 text-lg flex-1 flex items-center justify-center">
				Impossible de charger les messages
			</p>
		)
	}

	return (
		<div className="flex-1 flex flex-col-reverse overflow-y-auto p-4 pb-0 gap-2 mb-3">
			{messages.data && messages.data?.length > 0 ? (
				messages.data.map((msg) => {
					const isOwn = msg.sender === currentUserId
					return (
						<div
							key={msg._id}
							className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
						>
							<div
								className={`px-4 py-2 rounded-2xl max-w-[80%] lg:max-w-md text-[15px] ${
									isOwn
										? "bg-[#1f5fbf] text-white rounded-br-md"
										: "bg-gray-100 text-gray-900 rounded-bl-md"
								}`}
							>
								<p className="whitespace-pre-wrap break-words">{msg.message}</p>
								<div
									className={`text-[10px] mt-1 opacity-70 ${
										isOwn ? "text-right" : "text-left"
									}`}
								>
									{new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</div>
							</div>
						</div>
					)
				})
			) : (
				<div className="flex flex-col items-center h-full justify-center text-gray-500 text-lg gap-4 text-center">
					<MessageCircleCode className="mb-2 text-gray-300" size={72} />
					<div>Écris le premier message ! 👋</div>
				</div>
			)}
		</div>
	)
}

export default ChatMessages
