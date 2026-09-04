import { useState } from "react";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BarcodeScannerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

const BarcodeScanner = ({ isOpen, onOpenChange, onScan }: BarcodeScannerProps) => {
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = value.trim();
    if (!code) return;
    onScan(code);
    setValue("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <ScanLine className="h-5 w-5 text-primary" />
            Scan Barcode
          </DialogTitle>
          <DialogDescription>
            Scan a shipment label with a handheld scanner, or type the tracking number.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label className="text-xs">Tracking number</Label>
            <Input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="TH-2026-XXXXXXXX"
            />
          </div>
          <Button type="submit" className="w-full font-display font-bold">
            Search Shipment
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
