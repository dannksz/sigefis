import Footer from "@/components/Footer";
import Navbar from "@/components/NavBar";
import AccessibilityWidget from "@/components/AccessibilityWidget";

type MainTemplatetProps = {
    children: React.ReactNode;
}


export default function MainTemplate({children}: Readonly<MainTemplatetProps>){
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar/>
            <main className="flex-1">
                {children}
            </main>
            <Footer />
            <AccessibilityWidget />
        </div>
    )
}