"use client"

import { useEffect, useState } from "react"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useBlockUser } from "@/hooks/useBlockUser"

interface BlockUserDialogProps {
	children: React.ReactNode
	username: string
	isBlocked?: boolean
}

const BlockUserDialog = ({
	children,
	username,
	isBlocked = false,
}: BlockUserDialogProps) => {
	const [open, setOpen] = useState(false)
	const { blockUser, unblockUser, isLoading } = useBlockUser(() => {
		setOpen(false)
		setBlocked(!blocked)
	})
	const [blocked, setBlocked] = useState(isBlocked)

	useEffect(() => {
		setBlocked(isBlocked)
	}, [isBlocked])

	const handleBlock = () => {
		if (blocked) unblockUser(username)
		else blockUser(username)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[400px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<AlertTriangle className="w-5 h-5 text-yellow-500" />
						{blocked ? "Débloquer" : "Bloquer"}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<p className="text-sm text-gray-600">
						{blocked ? (
							<>
								Débloquer <strong>{username}</strong> ?
								<br />
								<br />
								Vous pourrez de nouveau voir vos publications et vous écrire.
							</>
						) : (
							<>
								Bloquer <strong>{username}</strong> ?
								<br />
								<br />
								Vous ne verrez plus vos profils, publications, stories ni messages.
								Mechmoum ne le préviendra pas. Si quelqu&apos;un t&apos;embête, tu peux aussi le signaler.
							</>
						)}
					</p>

					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							className="flex-1 cursor-pointer"
							disabled={isLoading}
						>
							Annuler
						</Button>
						<Button
							type="button"
							variant={blocked ? "default" : "destructive"}
							onClick={handleBlock}
							className="flex-1 cursor-pointer"
							disabled={isLoading}
						>
							{isLoading
								? blocked
									? "Un instant…"
									: "Un instant…"
								: blocked
								? "Débloquer"
								: "Bloquer"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default BlockUserDialog
