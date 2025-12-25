import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Terms() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 pt-24 pb-12 container mx-auto px-4 max-w-4xl">
                <h1 className="text-3xl font-display font-bold mb-6">Terms & Conditions</h1>
                <div className="prose dark:prose-invert max-w-none card p-8">
                    <h3>1. Introduction</h3>
                    <p>Welcome to Dewana. By using our website and services, you agree to these terms and conditions.</p>

                    <h3>2. Use of Service</h3>
                    <p>You agree to use Dewana only for lawful purposes and in accordance with these Terms.</p>

                    <h3>3. User Accounts</h3>
                    <p>You are responsible for maintaining the confidentiality of your account credentials.</p>

                    <h3>4. Content</h3>
                    <p>You retain ownership of the content you upload, but grant us license to display it for the purpose of the service.</p>

                    <h3>5. Privacy</h3>
                    <p>Your use of Dewana is also governed by our Privacy Policy.</p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
