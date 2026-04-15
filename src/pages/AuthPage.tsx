import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Mail, Lock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";

const AuthPage = () => {
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        toast({ title: t("auth.passwordMismatch"), variant: "destructive" });
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, displayName);
      if (error) {
        toast({ title: t("auth.signUpError"), description: error.message, variant: "destructive" });
      } else {
        toast({ title: t("auth.signUpSuccess") });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: t("auth.signInError"), description: error.message, variant: "destructive" });
      } else {
        toast({ title: t("auth.signInSuccess") });
        navigate("/");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <PageTransition>
        <div className="flex-1 flex items-center justify-center bg-muted/30 py-16">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="font-display text-2xl font-black">
                {isSignUp ? t("auth.signUp") : t("auth.signIn")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t("auth.displayName")}
                      className="pl-10"
                      required
                    />
                  </div>
                )}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("auth.email")}
                    className="pl-10"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth.password")}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
                {isSignUp && (
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t("auth.confirmPassword")}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                )}
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-display font-bold" disabled={loading}>
                  {loading
                    ? (isSignUp ? t("auth.signingUp") : t("auth.signingIn"))
                    : (isSignUp ? t("auth.signUp") : t("auth.signIn"))
                  }
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-primary hover:underline"
                >
                  {isSignUp ? t("auth.hasAccount") : t("auth.noAccount")}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
      <Footer />
    </div>
  );
};

export default AuthPage;
