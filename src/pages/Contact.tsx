import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Contact() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 pt-24 pb-12 container mx-auto px-4 max-w-4xl">
                <h1 className="text-4xl font-display font-bold mb-6 text-center">Contact Us</h1>

                <div className="grid md:grid-cols-2 gap-8 my-12">
                    <div className="card p-8 space-y-6">
                        <h3 className="text-xl font-semibold">Get in Touch</h3>
                        <p className="text-muted-foreground">
                            Have questions or feedback? We'd love to hear from you.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-primary" />
                                <span>support@dewana.com</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-primary" />
                                <span>+91 98765 43210</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="h-5 w-5 text-primary" />
                                <span>Bangalore, India</span>
                            </div>
                        </div>
                    </div>

                    <div className="card p-8">
                        <form className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input className="input" placeholder="Name" />
                                <input className="input" placeholder="Email" />
                            </div>
                            <input className="input" placeholder="Subject" />
                            <textarea className="input min-h-[120px]" placeholder="Message"></textarea>
                            <button className="btn btn-primary w-full">Send Message</button>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
