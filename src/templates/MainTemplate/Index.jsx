import Footer from "../../components/Footer";
import NavBar from "../../components/NavBar";

export default function MainTemplate({ children }) {
  return (
    <>
      <NavBar />
      <main className="p-0 m-0">
        {children}
      </main>
      <Footer />
    </>
  );
}