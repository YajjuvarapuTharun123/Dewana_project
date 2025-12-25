import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 pt-24 pb-12 container mx-auto px-4 max-w-3xl">
                <h1 className="text-4xl font-display font-bold mb-8 text-center">Frequently Asked Questions</h1>

                <div className="card p-6 md:p-8">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Is Dewana free to use?</AccordionTrigger>
                            <AccordionContent>
                                Yes! creating events and sending invitations is completely free.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Can I edit my event after publishing?</AccordionTrigger>
                            <AccordionContent>
                                Absolutely. You can edit your event details at any time from your dashboard.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>How do guests RSVP?</AccordionTrigger>
                            <AccordionContent>
                                Guests can RSVP directly on your event page. They just need to enter their name (and email if required) to confirm attendance.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger>Can I add multiple events like Haldi and Sangeet?</AccordionTrigger>
                            <AccordionContent>
                                Yes, you can add multiple sub-events under your main event to keep everything organized in one place.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </main>
            <Footer />
        </div>
    );
}
