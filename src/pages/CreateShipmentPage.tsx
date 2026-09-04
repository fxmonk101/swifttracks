import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Package, ArrowRight, MapPin, Box, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { useToast } from "@/hooks/use-toast";
import { COUNTRY_OPTIONS } from "@/lib/geocoding";

const AddressFields = ({ prefix, t }: { prefix: string; t: (k: string) => string }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="md:col-span-2">
      <Label>{t("createShipment.name")}</Label>
      <Input placeholder={t("createShipment.name")} />
    </div>
    <div className="md:col-span-2">
      <Label>{t("createShipment.street")}</Label>
      <Input placeholder={t("createShipment.street")} />
    </div>
    <div>
      <Label>{t("createShipment.city")}</Label>
      <Input placeholder={t("createShipment.city")} />
    </div>
    <div>
      <Label>{t("createShipment.state")}</Label>
      <Input placeholder={t("createShipment.state")} />
    </div>
    <div>
      <Label>{t("createShipment.zip")}</Label>
      <Input placeholder={t("createShipment.zip")} />
    </div>
    <div>
      <Label>{t("createShipment.country")}</Label>
      <Select defaultValue="US">
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent className="max-h-72">

          {COUNTRY_OPTIONS.map((country) => (
            <SelectItem key={country.value} value={country.value}>{country.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);

const CreateShipmentPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const steps = [
    { num: 1, label: t("createShipment.senderInfo"), icon: MapPin },
    { num: 2, label: t("createShipment.receiverInfo"), icon: MapPin },
    { num: 3, label: t("createShipment.packageDetails"), icon: Box },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <PageTransition>
        <section className="bg-secondary py-12">
          <div className="container">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-black text-secondary-foreground">{t("createShipment.title")}</h1>
                <p className="text-secondary-foreground/60 text-sm">{t("createShipment.subtitle")}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              {steps.map((s) => (
                <button
                  key={s.num}
                  onClick={() => setStep(s.num)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    step === s.num
                      ? "bg-primary text-primary-foreground"
                      : step > s.num
                      ? "bg-success/20 text-success"
                      : "bg-secondary-foreground/10 text-secondary-foreground/50"
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold">
                    {s.num}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-8">
          <div className="max-w-3xl mx-auto">
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-xl font-bold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {t("createShipment.senderInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AddressFields prefix="sender" t={t} />
                  <Button onClick={() => setStep(2)} className="mt-6 bg-primary hover:bg-primary/90 font-display font-bold">
                    {t("createShipment.receiverInfo")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-xl font-bold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {t("createShipment.receiverInfo")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AddressFields prefix="receiver" t={t} />
                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                    <Button onClick={() => setStep(3)} className="bg-primary hover:bg-primary/90 font-display font-bold">
                      {t("createShipment.packageDetails")} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-xl font-bold flex items-center gap-2">
                    <Box className="h-5 w-5 text-primary" />
                    {t("createShipment.packageDetails")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t("createShipment.weight")}</Label>
                      <Input type="number" placeholder="0.0" min="0" step="0.1" />
                    </div>
                    <div>
                      <Label>{t("createShipment.serviceType")}</Label>
                      <Select defaultValue="STANDARD">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EXPRESS">{t("createShipment.express")}</SelectItem>
                          <SelectItem value="STANDARD">{t("createShipment.standard")}</SelectItem>
                          <SelectItem value="ECONOMY">{t("createShipment.economy")}</SelectItem>
                          <SelectItem value="OVERNIGHT">{t("createShipment.overnight")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t("createShipment.length")}</Label>
                      <Input type="number" placeholder="0" min="0" />
                    </div>
                    <div>
                      <Label>{t("createShipment.width")}</Label>
                      <Input type="number" placeholder="0" min="0" />
                    </div>
                    <div>
                      <Label>{t("createShipment.height")}</Label>
                      <Input type="number" placeholder="0" min="0" />
                    </div>
                    <div className="flex items-center gap-2 mt-6">
                      <Checkbox id="signature" />
                      <Label htmlFor="signature">{t("createShipment.signatureRequired")}</Label>
                    </div>
                    <div className="md:col-span-2">
                      <Label>{t("createShipment.description")}</Label>
                      <Textarea placeholder={t("createShipment.description")} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                    <Button
                      className="bg-primary hover:bg-primary/90 font-display font-bold"
                      onClick={() => toast({ title: "Shipment created!", description: "Tracking ID: ST-2024-NEW12345" })}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      {t("createShipment.submit")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </PageTransition>
      <Footer />
    </div>
  );
};

export default CreateShipmentPage;

