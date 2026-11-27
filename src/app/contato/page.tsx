import ContactForm from "@/components/ContactForm";
import MainTemplate from "@/templates/MainTemplate/Index";

export const metadata = { title: "Contato | SIGEFIS" };

export default function ContactPage() {
  return (
    <MainTemplate>
      <section className="mx-auto w-[min(90%,620px)] py-10 sm:py-14">
        <h1 className="mb-8 border-l-4 border-secondary pl-4 text-3xl font-semibold">Contato</h1>
        <ContactForm />
      </section>
    </MainTemplate>
  );
}
