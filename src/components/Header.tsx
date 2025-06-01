import Link from 'next/link';
import { FaLinkedin, FaEnvelope, FaFileAlt, FaGithub } from 'react-icons/fa';

const Header = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Ryan Jackman</h1>
          <div className="flex space-x-6">
            <Link 
              href="https://www.linkedin.com/in/rcjackman" 
              target="_blank"
              className="text-gray-600 hover:text-gray-900"
            >
              <FaLinkedin className="h-6 w-6" />
            </Link>
            <Link 
              href="https://github.com/ryguy3305"
              target="_blank"
              className="text-gray-600 hover:text-gray-900"
            >
              <FaGithub className="h-6 w-6" />
            </Link>
            <Link 
              href="/resume.pdf" 
              target="_blank"
              className="text-gray-600 hover:text-gray-900"
            >
              <FaFileAlt className="h-6 w-6" />
            </Link>
            <Link 
              href="mailto:jackman.55@osu.edu"
              className="text-gray-600 hover:text-gray-900"
            >
              <FaEnvelope className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 