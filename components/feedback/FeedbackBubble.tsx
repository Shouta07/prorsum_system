import { Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeedbackBubble({
  type,
  content,
  trainerName,
  createdAt,
  unread,
}: {
  type: "comment" | "like";
  content: string | null;
  trainerName: string;
  createdAt: string;
  unread?: boolean;
}) {
  if (type === "like") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-600 ring-1 ring-rose-100">
        <Heart size={14} className="fill-rose-500 text-rose-500" />
        <span>{trainerName} が「いいね」</span>
      </div>
    );
  }

  return (
    <div className="relative flex gap-2">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <MessageCircle size={14} />
      </div>
      <div
        className={cn(
          "relative flex-1 rounded-lg px-3 py-2 text-sm",
          unread ? "bg-emerald-50 ring-1 ring-emerald-200" : "bg-zinc-50 ring-1 ring-zinc-100",
        )}
      >
        {unread && (
          <span className="absolute -right-1 -top-1 inline-flex size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}
        <div className="flex items-center justify-between gap-2 pb-0.5">
          <span className="text-xs font-bold text-zinc-700">{trainerName}</span>
          <span className="text-[10px] text-zinc-400">{createdAt}</span>
        </div>
        <p className="text-zinc-800 leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
