import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, MessageSquare, Trash2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { RespondToFeedbackDialog } from "@/components/RespondToFeedbackDialog"
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog"
import { resolveClientFeedback, reopenClientFeedback, deleteClientFeedback } from "@/app/actions"

export function FeedbackCard({ feedback, isOpen }: { feedback: any, isOpen: boolean }) {
    return (
        <Card className={!isOpen ? "opacity-75 grayscale-[0.5]" : ""}>
            <CardHeader className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                {feedback.client_name}
                            </CardTitle>
                            {isOpen && (
                                <Badge variant="destructive" className="h-5 text-[10px] uppercase font-bold tracking-wider rounded-sm">
                                    New
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>Project: {feedback.project_title}</span>
                            <span>&bull;</span>
                            <span>{format(new Date(feedback.created_at), "MMM d, yyyy h:mm a")}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={`/projects/${feedback.project_id}?tab=feedback`}>
                            <Button size="sm" variant="outline" className="h-8">
                                Go to Project
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <RespondToFeedbackDialog feedbackId={feedback.id} />
                            {isOpen ? (
                                <form action={resolveClientFeedback}>
                                    <input type="hidden" name="feedbackId" value={feedback.id} />
                                    <Button type="submit" size="sm" variant="outline" className="h-8 text-green-600 border-green-200 bg-green-50 hover:bg-green-100 font-medium" title="Mark resolved">
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Resolve
                                    </Button>
                                </form>
                            ) : (
                                <form action={reopenClientFeedback}>
                                    <input type="hidden" name="feedbackId" value={feedback.id} />
                                    <Button type="submit" size="sm" variant="outline" className="h-8 text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100 font-medium">
                                        Take Back
                                    </Button>
                                </form>
                            )}
                            <DeleteConfirmDialog
                                action={deleteClientFeedback}
                                hiddenFields={{ feedbackId: feedback.id }}
                                itemName="this feedback"
                            />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="bg-muted/30 p-4 rounded-lg border text-sm italic leading-relaxed">
                    "{feedback.message}"
                </div>
                {feedback.developer_response && (
                    <div className="mt-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-sm leading-relaxed">
                        <strong className="text-blue-900 block mb-1">Your Response:</strong>
                        <span className="text-blue-800">{feedback.developer_response}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
