import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function About() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 pt-24 pb-12 container mx-auto px-4 max-w-4xl">
                <h1 className="text-4xl font-display font-bold mb-6 text-center">About Dewana</h1>
                <div className="prose dark:prose-invert mx-auto">
                    <p className="text-lg text-muted-foreground mb-6 text-center">
                        Reimagining how we celebrate life's special moments.
                    </p>
                    <div className="card p-8 space-y-4">
                        <p>
                            Dewana is your digital companion for creating stunning, personalized event invitations.
                            Whether it's a wedding, birthday, or a casual get-together, we believe every event
                            deserves a beautiful beginning.
                        </p>
                        <p>
                            Our mission is to replace clunky, outdated invitation methods with a seamless,
                            mobile-first experience that delights both hosts and guests.
                        </p>
                        <p>
                            Founded with love and a passion for design, Dewana brings the elegance of traditional
                            invitations to the digital age.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
