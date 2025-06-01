import Header from '@/components/Header';
import Navbar from '@/components/Navbar';
import About from '@/components/About';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import Skills from '@/components/Skills';
import Hobbies from '@/components/Hobbies';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Header />
      <Navbar />
      <div className="flex-grow">
        <About />
        <Experience />
        <Projects />
        <Skills />
        <Hobbies />
      </div>
      <Footer />
    </main>
  );
}
