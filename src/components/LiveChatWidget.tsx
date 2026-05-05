import { useState } from "react";
import { MessageCircle, X, Mail, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const SUPPORT_EMAIL = "support@transporthaven.com";
const SUPPORT_PHONE = "+1 (213) 595-7723";
const SUPPORT_PHONE_TEL = "+12135957723";

const LiveChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Support request from ${name || "website visitor"}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\n${message}\n\n— Sent from TransportHaven live chat`
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999]">
      {open && (
        <div className="mb-3 w-[320px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <div>
              <div className="font-display font-bold">TransportHaven Support</div>
              <div className="text-xs opacity-90">We typically reply within minutes</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-white/10 rounded"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-4 space-y-3 bg-background">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-primary">{SUPPORT_EMAIL}</a>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <a href={`tel:${SUPPORT_PHONE_TEL}`} className="hover:text-primary">
                {SUPPORT_PHONE}
              </a>
              <span>· call or text</span>
            </div>
            <form onSubmit={handleSend} className="space-y-2 pt-2 border-t border-border">
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-9 text-sm"
              />
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9 text-sm"
              />
              <Textarea
                placeholder="How can we help?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={3}
                className="text-sm resize-none"
              />
              <Button type="submit" className="w-full h-9 font-display font-bold" size="sm">
                <Send className="h-3 w-3 mr-2" /> Send message
              </Button>
            </form>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-2xl transition-transform hover:scale-105 flex items-center gap-2"
        aria-label={open ? "Close live chat" : "Open live chat"}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        {!open && <span className="font-display font-bold text-sm pr-1 hidden sm:inline">Chat</span>}
      </button>
    </div>
  );
};

export default LiveChatWidget;
