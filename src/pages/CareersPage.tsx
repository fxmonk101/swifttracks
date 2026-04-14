import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { MapPin, Clock, Briefcase, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const { ref, isVisible } = useScrollAnimation();
  return <div ref={ref} className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>{children}</div>;
};

const jobs = [
  { title: "Senior Software Engineer", dept: "Engineering", location: "New York, NY", type: "Full-time" },
  { title: "Delivery Driver", dept: "Operations", location: "Multiple Locations", type: "Full-time" },
  { title: "Logistics Coordinator", dept: "Operations", location: "Chicago, IL", type: "Full-time" },
  { title: "UX Designer", dept: "Product", location: "Remote", type: "Full-time" },
  { title: "Data Analyst", dept: "Analytics", location: "San Francisco, CA", type: "Full-time" },
  { title: "Customer Support Lead", dept: "Support", location: "Remote", type: "Full-time" },
];

const CareersPage = () => (
  <div className="min-h-screen flex flex-col">
    <AppHeader />
    <section className="bg-secondary py-20">
      <div className="container text-center">
        <h1 className="font-display text-5xl md:text-7xl font-black text-secondary-foreground">JOIN OUR <span className="text-primary">TEAM</span></h1>
        <p className="text-secondary-foreground/70 text-lg mt-4 max-w-2xl mx-auto">Help us revolutionize logistics. We're always looking for passionate people.</p>
      </div>
    </section>

    <section className="container py-16">
      <Section>
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-black text-foreground">OPEN POSITIONS</h2>
          <p className="text-muted-foreground mt-2">Find your perfect role at SwiftTrack</p>
        </div>
        <div className="space-y-4 max-w-3xl mx-auto">
          {jobs.map((job) => (
            <Card key={job.title} className="hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer group">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">{job.title}</h3>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {job.dept}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {job.type}</span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
    </section>

    <section className="bg-primary py-16">
      <div className="container text-center">
        <h2 className="font-display text-4xl font-black text-primary-foreground mb-4">DON'T SEE YOUR ROLE?</h2>
        <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">We're always looking for talented individuals. Send us your resume and we'll keep you in mind.</p>
        <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-display font-bold tracking-wide px-8 py-6">SEND YOUR RESUME</Button>
      </div>
    </section>
    <Footer />
  </div>
);

export default CareersPage;
